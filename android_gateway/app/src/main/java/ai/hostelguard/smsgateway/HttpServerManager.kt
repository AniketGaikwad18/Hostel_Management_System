package ai.hostelguard.smsgateway

import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStream
import java.net.ServerSocket
import java.net.Socket
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors

class HttpServerManager(
    private val context: Context,
    private val port: Int = 8080,
    private val apiKey: String = "hostelguard_sms_gateway_secret_2026"
) {

    interface GatewayListener {
        fun onStatusChanged(isOnline: Boolean, endpoint: String)
        fun onRequestHandled(requestSummary: String, statusSummary: String)
        fun onLog(logMessage: String)
    }

    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private val threadPool = Executors.newCachedThreadPool()
    private val smsSender = SmsSender(context)
    var listener: GatewayListener? = null

    fun start() {
        if (isRunning) return
        isRunning = true

        threadPool.execute {
            try {
                serverSocket = ServerSocket(port)
                val localIp = NetworkUtils.getLocalIpAddress()
                val endpoint = "http://$localIp:$port"
                log("Server started on $endpoint")
                listener?.onStatusChanged(true, endpoint)

                while (isRunning && serverSocket != null && !serverSocket!!.isClosed) {
                    try {
                        val clientSocket = serverSocket!!.accept()
                        threadPool.execute { handleClient(clientSocket) }
                    } catch (e: Exception) {
                        if (isRunning) {
                            log("Socket accept error: ${e.message}")
                        }
                    }
                }
            } catch (e: Exception) {
                log("Failed to start server on port $port: ${e.message}")
                listener?.onStatusChanged(false, "Offline")
            }
        }
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
            serverSocket = null
            log("Server stopped.")
            listener?.onStatusChanged(false, "Offline")
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun handleClient(socket: Socket) {
        try {
            val reader = BufferedReader(InputStreamReader(socket.getInputStream()))
            val output = socket.getOutputStream()

            // 1. Parse HTTP Request Line (e.g. "POST /send-sms HTTP/1.1")
            val requestLine = reader.readLine() ?: return
            val parts = requestLine.split(" ")
            if (parts.size < 2) return
            val method = parts[0].uppercase(Locale.ROOT)
            val path = parts[1]

            // 2. Parse Headers
            var contentLength = 0
            var authHeader = ""
            var line: String? = reader.readLine()
            while (!line.isNullOrEmpty()) {
                val headerLower = line.lowercase(Locale.ROOT)
                if (headerLower.startsWith("content-length:")) {
                    contentLength = line.substring(15).trim().toIntOrNull() ?: 0
                } else if (headerLower.startsWith("authorization:")) {
                    authHeader = line.substring(14).trim()
                }
                line = reader.readLine()
            }

            // 3. Routing
            when {
                path == "/health" && method == "GET" -> {
                    handleHealthCheck(output)
                }
                path == "/send-sms" && method == "POST" -> {
                    // Check Authorization Bearer Token
                    val expectedBearer = "Bearer $apiKey"
                    if (authHeader != expectedBearer && !authHeader.endsWith(apiKey)) {
                        log("Unauthorized request blocked (Invalid or missing API key).")
                        sendHttpResponse(output, 401, "{\"status\":\"UNAUTHORIZED\",\"error\":\"Invalid Bearer API Key\"}")
                        listener?.onRequestHandled("Unauthorized Request", "REJECTED (401)")
                        return
                    }

                    // Read JSON Body
                    val bodyBuilder = StringBuilder()
                    if (contentLength > 0) {
                        val charBuffer = CharArray(contentLength)
                        var readSoFar = 0
                        while (readSoFar < contentLength) {
                            val count = reader.read(charBuffer, readSoFar, contentLength - readSoFar)
                            if (count == -1) break
                            readSoFar += count
                        }
                        bodyBuilder.append(charBuffer, 0, readSoFar)
                    }

                    handleSendSms(output, bodyBuilder.toString())
                }
                else -> {
                    sendHttpResponse(output, 404, "{\"error\":\"Not Found\"}")
                }
            }

        } catch (e: Exception) {
            log("Error processing request: ${e.message}")
        } finally {
            try {
                socket.close()
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    private fun handleHealthCheck(output: OutputStream) {
        val json = JSONObject()
        json.put("status", "ONLINE")
        json.put("service", "HostelGuard Android SMS Gateway")
        json.put("sim_ready", true)
        json.put("timestamp", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date()))
        sendHttpResponse(output, 200, json.toString())
    }

    private fun handleSendSms(output: OutputStream, jsonBody: String) {
        try {
            val json = JSONObject(jsonBody)
            val phone = json.optString("phone", "").trim()
            val message = json.optString("message", "").trim()

            if (phone.isEmpty() || message.isEmpty()) {
                sendHttpResponse(output, 400, "{\"status\":\"FAILED\",\"error\":\"Missing phone or message parameter\"}")
                return
            }

            log("Incoming SMS command for $phone (${message.length} chars)")
            val firstLine = message.lines().firstOrNull { it.isNotBlank() } ?: "Safety Alert"
            val incidentCode = if (message.contains("Incident:")) message.substringAfter("Incident:").trim().lines().firstOrNull() ?: "" else ""

            // Dispatch SMS through physical SIM
            val smsResult = smsSender.sendSms(phone, message)

            if (smsResult.success) {
                val resp = JSONObject()
                resp.put("status", "SUCCESS")
                resp.put("phone", phone)
                resp.put("parts", smsResult.partsCount)
                resp.put("timestamp", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date()))
                sendHttpResponse(output, 200, resp.toString())

                log("SMS sent successfully to $phone (${smsResult.partsCount} part(s))")
                listener?.onRequestHandled("$firstLine ($incidentCode)", "SMS SENT ✓")
            } else {
                val resp = JSONObject()
                resp.put("status", "FAILED")
                resp.put("error", smsResult.error ?: "Failed to dispatch SMS")
                sendHttpResponse(output, 500, resp.toString())

                log("SMS dispatch failed: ${smsResult.error}")
                listener?.onRequestHandled("$firstLine ($incidentCode)", "SMS FAILED ✕ (${smsResult.error})")
            }

        } catch (e: Exception) {
            log("JSON parse error: ${e.message}")
            sendHttpResponse(output, 400, "{\"status\":\"FAILED\",\"error\":\"Malformed JSON: ${e.message}\"}")
        }
    }

    private fun sendHttpResponse(output: OutputStream, statusCode: Int, jsonPayload: String) {
        val statusText = when (statusCode) {
            200 -> "OK"
            400 -> "Bad Request"
            401 -> "Unauthorized"
            404 -> "Not Found"
            else -> "Internal Server Error"
        }
        val bytes = jsonPayload.toByteArray(Charsets.UTF_8)
        val header = "HTTP/1.1 $statusCode $statusText\r\n" +
                "Content-Type: application/json; charset=UTF-8\r\n" +
                "Content-Length: ${bytes.size}\r\n" +
                "Connection: close\r\n\r\n"

        output.write(header.toByteArray(Charsets.UTF_8))
        output.write(bytes)
        output.flush()
    }

    private fun log(msg: String) {
        val time = SimpleDateFormat("HH:mm:ss", Locale.US).format(Date())
        val formatted = "[$time] $msg"
        listener?.onLog(formatted)
    }
}
