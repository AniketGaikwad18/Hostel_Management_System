package ai.hostelguard.smsgateway

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.core.content.ContextCompat

data class SmsResult(
    val success: Boolean,
    val message: String,
    val partsCount: Int = 1,
    val error: String? = null
)

class SmsSender(private val context: Context) {

    fun sendSms(phoneNumber: String, textMessage: String): SmsResult {
        // 1. Verify SEND_SMS permission
        if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.SEND_SMS) 
            != PackageManager.PERMISSION_GRANTED) {
            return SmsResult(
                success = false,
                message = "Permission Denied",
                error = "SEND_SMS permission has not been granted by user."
            )
        }

        // 2. Validate input parameters
        val cleanPhone = phoneNumber.trim().replace(" ", "").replace("-", "")
        if (cleanPhone.isEmpty() || textMessage.isEmpty()) {
            return SmsResult(
                success = false,
                message = "Invalid Parameters",
                error = "Recipient phone number or message body is empty."
            )
        }

        try {
            // 3. Obtain appropriate SmsManager instance
            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                context.getSystemService(SmsManager::class.java) ?: SmsManager.getDefault()
            } else {
                @Suppress("DEPRECATION")
                SmsManager.getDefault()
            }

            // 4. Handle multi-part SMS if message exceeds 160 GSM-7 characters
            val parts = smsManager.divideMessage(textMessage)
            if (parts.size > 1) {
                smsManager.sendMultipartTextMessage(cleanPhone, null, parts, null, null)
            } else {
                smsManager.sendTextMessage(cleanPhone, null, textMessage, null, null)
            }

            return SmsResult(
                success = true,
                message = "SMS dispatched to SIM radio successfully.",
                partsCount = parts.size
            )

        } catch (e: SecurityException) {
            return SmsResult(
                success = false,
                message = "Security Exception",
                error = "Permission revoked or restricted: ${e.localizedMessage}"
            )
        } catch (e: Exception) {
            return SmsResult(
                success = false,
                message = "Send Failure",
                error = e.localizedMessage ?: "Unknown hardware/radio error"
            )
        }
    }
}
