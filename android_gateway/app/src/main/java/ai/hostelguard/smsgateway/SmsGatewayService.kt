package ai.hostelguard.smsgateway

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class SmsGatewayService : Service() {

    companion object {
        const val CHANNEL_ID = "hostelguard_sms_gateway_channel"
        const val NOTIFICATION_ID = 2026
        var instance: SmsGatewayService? = null
            private set
    }

    inner class LocalBinder : Binder() {
        fun getService(): SmsGatewayService = this@SmsGatewayService
    }

    private val binder = LocalBinder()
    private var serverManager: HttpServerManager? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()

        // Acquire WakeLock so CPU and local Wi-Fi stay active
        val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
        wakeLock = powerManager?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "HostelGuard:GatewayWakeLock")
        wakeLock?.acquire(24 * 60 * 60 * 1000L) // 24 hours max

        // Initialize and start embedded HTTP server on port 8080
        serverManager = HttpServerManager(this, port = 8080)
        serverManager?.start()

        startForeground(NOTIFICATION_ID, buildForegroundNotification("Online — Listening on port 8080"))
    }

    fun getServerManager(): HttpServerManager? = serverManager

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val endpoint = "http://${NetworkUtils.getLocalIpAddress()}:8080"
        updateNotification("Online — $endpoint")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onDestroy() {
        serverManager?.stop()
        serverManager = null
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        instance = null
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "HostelGuard SMS Gateway",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps local SMS Gateway active for emergency alert dispatch"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(contentText: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("HostelGuard SMS Gateway Active")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.sym_def_app_icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    fun updateNotification(contentText: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(NOTIFICATION_ID, buildForegroundNotification(contentText))
    }
}
