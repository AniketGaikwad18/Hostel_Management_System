package ai.hostelguard.smsgateway

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.telephony.TelephonyManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity(), HttpServerManager.GatewayListener {

    private lateinit var tvGatewayStatusBadge: TextView
    private lateinit var tvEndpointUrl: TextView
    private lateinit var tvSimStatus: TextView
    private lateinit var tvSmsServiceStatus: TextView
    private lateinit var tvApiKeyStatus: TextView
    private lateinit var tvLastRequest: TextView
    private lateinit var tvLastStatus: TextView
    private lateinit var tvLogs: TextView
    private lateinit var btnSendTestSms: Button

    private var gatewayService: SmsGatewayService? = null
    private var isBound = false

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as SmsGatewayService.LocalBinder
            gatewayService = binder.getService()
            isBound = true
            gatewayService?.getServerManager()?.listener = this@MainActivity

            val ip = NetworkUtils.getLocalIpAddress()
            tvEndpointUrl.text = "http://$ip:8080"
            tvGatewayStatusBadge.text = "● GATEWAY ONLINE"
            tvGatewayStatusBadge.setTextColor(ContextCompat.getColor(this@MainActivity, R.color.green_status))
            appendLog("Bound to foreground gateway service.")
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            gatewayService = null
            isBound = false
            tvGatewayStatusBadge.text = "○ GATEWAY STOPPED"
            tvGatewayStatusBadge.setTextColor(ContextCompat.getColor(this@MainActivity, R.color.red_status))
            appendLog("Gateway service disconnected.")
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val smsGranted = permissions[Manifest.permission.SEND_SMS] == true
        if (smsGranted) {
            tvSmsServiceStatus.text = "READY (Granted)"
            tvSmsServiceStatus.setTextColor(ContextCompat.getColor(this, R.color.green_status))
            appendLog("SEND_SMS permission granted by user.")
            startAndBindGatewayService()
        } else {
            tvSmsServiceStatus.text = "PERMISSION DENIED"
            tvSmsServiceStatus.setTextColor(ContextCompat.getColor(this, R.color.red_status))
            appendLog("ERROR: SEND_SMS permission was denied. SMS cannot be sent.")
            Toast.makeText(this, "SEND_SMS permission is required for the Gateway!", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        checkSimState()
        requestRequiredPermissions()

        btnSendTestSms.setOnClickListener {
            performDirectTestSms()
        }
    }

    private fun initViews() {
        tvGatewayStatusBadge = findViewById(R.id.tvGatewayStatusBadge)
        tvEndpointUrl = findViewById(R.id.tvEndpointUrl)
        tvSimStatus = findViewById(R.id.tvSimStatus)
        tvSmsServiceStatus = findViewById(R.id.tvSmsServiceStatus)
        tvApiKeyStatus = findViewById(R.id.tvApiKeyStatus)
        tvLastRequest = findViewById(R.id.tvLastRequest)
        tvLastStatus = findViewById(R.id.tvLastStatus)
        tvLogs = findViewById(R.id.tvLogs)
        btnSendTestSms = findViewById(R.id.btnSendTestSms)

        val localIp = NetworkUtils.getLocalIpAddress()
        tvEndpointUrl.text = "http://$localIp:8080"
    }

    private fun checkSimState() {
        val telephonyManager = getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
        val simState = telephonyManager?.simState ?: TelephonyManager.SIM_STATE_UNKNOWN
        if (simState == TelephonyManager.SIM_STATE_READY) {
            val carrier = telephonyManager?.networkOperatorName ?: "Carrier"
            tvSimStatus.text = "READY ($carrier)"
            tvSimStatus.setTextColor(ContextCompat.getColor(this, R.color.green_status))
        } else {
            tvSimStatus.text = "SIM NOT READY (State: $simState)"
            tvSimStatus.setTextColor(ContextCompat.getColor(this, R.color.red_status))
        }
    }

    private fun requestRequiredPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.SEND_SMS,
            Manifest.permission.READ_PHONE_STATE
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val allGranted = permissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }

        if (allGranted) {
            tvSmsServiceStatus.text = "READY (Granted)"
            startAndBindGatewayService()
        } else {
            permissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun startAndBindGatewayService() {
        val intent = Intent(this, SmsGatewayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    private fun performDirectTestSms() {
        val testSender = SmsSender(this)
        appendLog("Initiating local hardware test SMS...")
        // Sends test ping to self / configured phone
        val result = testSender.sendSms(
            phoneNumber = "7843006100",
            textMessage = "HOSTELGUARD AI TEST ALERT: Physical SIM connection confirmed. Gateway is operational."
        )

        if (result.success) {
            tvLastRequest.text = "Manual Device Test Trigger"
            tvLastStatus.text = "SMS SENT ✓ (SIM Network Confirmed)"
            appendLog("Local test SMS sent successfully via physical SIM.")
            Toast.makeText(this, "✓ SMS dispatched successfully through SIM!", Toast.LENGTH_SHORT).show()
        } else {
            tvLastStatus.text = "SMS FAILED ✕ (${result.error})"
            appendLog("Local test SMS failed: ${result.error}")
            Toast.makeText(this, "Failed: ${result.error}", Toast.LENGTH_LONG).show()
        }
    }

    override fun onStatusChanged(isOnline: Boolean, endpoint: String) {
        runOnUiThread {
            if (isOnline) {
                tvGatewayStatusBadge.text = "● GATEWAY ONLINE"
                tvGatewayStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.green_status))
                tvEndpointUrl.text = endpoint
            } else {
                tvGatewayStatusBadge.text = "○ GATEWAY OFFLINE"
                tvGatewayStatusBadge.setTextColor(ContextCompat.getColor(this, R.color.red_status))
            }
        }
    }

    override fun onRequestHandled(requestSummary: String, statusSummary: String) {
        runOnUiThread {
            tvLastRequest.text = requestSummary
            tvLastStatus.text = statusSummary
        }
    }

    override fun onLog(logMessage: String) {
        runOnUiThread {
            appendLog(logMessage)
        }
    }

    private fun appendLog(msg: String) {
        val current = tvLogs.text.toString()
        val lines = current.lines()
        val keptLines = if (lines.size > 20) lines.takeLast(19).joinToString("\n") else current
        tvLogs.text = "$keptLines\n$msg".trimStart()
    }

    override fun onDestroy() {
        if (isBound) {
            unbindService(serviceConnection)
            isBound = false
        }
        super.onDestroy()
    }
}
