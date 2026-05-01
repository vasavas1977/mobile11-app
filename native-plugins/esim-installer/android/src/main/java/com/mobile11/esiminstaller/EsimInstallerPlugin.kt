package com.mobile11.esiminstaller

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.euicc.DownloadableSubscription
import android.telephony.euicc.EuiccManager
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "EsimInstaller")
class EsimInstallerPlugin : Plugin() {

    companion object {
        private const val TAG = "EsimInstaller"
        private const val ACTION_DOWNLOAD_SUBSCRIPTION =
            "com.mobile11.esiminstaller.DOWNLOAD_SUBSCRIPTION"
        private const val REQUEST_CODE_DOWNLOAD = 1001
        private const val REQUEST_CODE_RESOLUTION = 1002

        // Stable error codes — these are the JS-facing contract
        private const val CODE_INVALID_ACTIVATION_CODE = "INVALID_ACTIVATION_CODE"
        private const val CODE_EUICC_UNAVAILABLE = "EUICC_UNAVAILABLE"
        private const val CODE_RESOLUTION_FAILED = "RESOLUTION_FAILED"
        private const val CODE_USER_CANCELED = "USER_CANCELED"
        private const val CODE_UNKNOWN = "UNKNOWN"
    }

    private var pendingCall: PluginCall? = null

    /**
     * Security: never log the full activation code.
     * Only the first 8 characters are safe to surface in any log level.
     */
    private fun safeCodePrefix(code: String): String {
        return if (code.length > 8) code.substring(0, 8) + "\u2026" else code
    }

    // ── BroadcastReceiver for download result ────────────────────────
    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != ACTION_DOWNLOAD_SUBSCRIPTION) return

            val resultCode = getResultCode()
            val call = pendingCall ?: return

            when (resultCode) {
                EuiccManager.EMBEDDED_SUBSCRIPTION_RESULT_OK -> {
                    Log.d(TAG, "Download intent handoff successful")
                    val ret = JSObject()
                    ret.put("success", true)
                    call.resolve(ret)
                    pendingCall = null
                }

                EuiccManager.EMBEDDED_SUBSCRIPTION_RESULT_RESOLVABLE_ERROR -> {
                    // System needs user confirmation — show the resolution UI
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        try {
                            val euicc = context.getSystemService(Context.EUICC_SERVICE) as EuiccManager
                            euicc.startResolutionActivity(
                                activity,
                                REQUEST_CODE_RESOLUTION,
                                intent,
                                PendingIntent.getBroadcast(
                                    context,
                                    REQUEST_CODE_RESOLUTION,
                                    Intent(ACTION_DOWNLOAD_SUBSCRIPTION).setPackage(context.packageName),
                                    PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
                                )
                            )
                        } catch (e: Exception) {
                            Log.w(TAG, "startResolutionActivity failed: ${e.message}")
                            rejectWithCode(call, CODE_RESOLUTION_FAILED, "Android refused to start the resolution intent")
                            pendingCall = null
                        }
                    } else {
                        rejectWithCode(call, CODE_EUICC_UNAVAILABLE, "API level too low for resolution")
                        pendingCall = null
                    }
                }

                EuiccManager.EMBEDDED_SUBSCRIPTION_RESULT_ERROR -> {
                    val detailedCode = intent.getIntExtra(
                        EuiccManager.EXTRA_EMBEDDED_SUBSCRIPTION_DETAILED_CODE, -1
                    )
                    Log.w(TAG, "Download error, detailed code: $detailedCode")

                    // Detailed code 2 typically means user canceled on some OEMs
                    if (detailedCode == 2) {
                        rejectWithCode(call, CODE_USER_CANCELED, "User dismissed the eSIM install prompt")
                    } else {
                        rejectWithCode(call, CODE_UNKNOWN, "eSIM download failed (detailed code: $detailedCode)")
                    }
                    pendingCall = null
                }

                else -> {
                    Log.w(TAG, "Unexpected result code: $resultCode")
                    rejectWithCode(call, CODE_UNKNOWN, "Unexpected result: $resultCode")
                    pendingCall = null
                }
            }
        }
    }

    override fun load() {
        super.load()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(
                downloadReceiver,
                IntentFilter(ACTION_DOWNLOAD_SUBSCRIPTION),
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            context.registerReceiver(
                downloadReceiver,
                IntentFilter(ACTION_DOWNLOAD_SUBSCRIPTION)
            )
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        try {
            context.unregisterReceiver(downloadReceiver)
        } catch (_: Exception) {
            // Receiver may already be unregistered
        }
    }

    // ── install() ────────────────────────────────────────────────────
    @PluginMethod
    fun install(call: PluginCall) {
        val activationCode = call.getString("activationCode")

        // Validate presence
        if (activationCode.isNullOrBlank()) {
            rejectWithCode(call, CODE_INVALID_ACTIVATION_CODE, "Missing required parameter: activationCode")
            return
        }

        // Validate LPA format
        if (!activationCode.startsWith("LPA:1\$")) {
            Log.w(TAG, "Invalid format: ${safeCodePrefix(activationCode)}")
            rejectWithCode(call, CODE_INVALID_ACTIVATION_CODE, "Activation code must match LPA:1\$<smdp>\$<matchingId>")
            return
        }

        Log.d(TAG, "install() initiated: ${safeCodePrefix(activationCode)}")

        // Gate on API 28+
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            Log.d(TAG, "API ${Build.VERSION.SDK_INT} < 28")
            rejectWithCode(call, CODE_EUICC_UNAVAILABLE, "Requires Android 9 (API 28) or higher")
            return
        }

        // Check EuiccManager availability and enabled state
        val euicc = context.getSystemService(Context.EUICC_SERVICE) as? EuiccManager
        if (euicc == null || !euicc.isEnabled) {
            Log.d(TAG, "EuiccManager null=${euicc == null}, enabled=${euicc?.isEnabled}")
            rejectWithCode(call, CODE_EUICC_UNAVAILABLE, "Device does not have eSIM capability or eUICC is disabled")
            return
        }

        // Store pending call for async resolution
        pendingCall = call

        // Build downloadable subscription — pass the full LPA string unmodified
        val subscription = DownloadableSubscription.forActivationCode(activationCode)

        // Create callback PendingIntent
        val callbackIntent = Intent(ACTION_DOWNLOAD_SUBSCRIPTION).setPackage(context.packageName)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            REQUEST_CODE_DOWNLOAD,
            callbackIntent,
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Initiate download — this build uses the system resolution UI.
        // switchAfterDownload = true so the profile activates after user confirmation.
        euicc.downloadSubscription(subscription, true, pendingIntent)
    }

    // ── isSupported() ────────────────────────────────────────────────
    @PluginMethod
    fun isSupported(call: PluginCall) {
        val ret = JSObject()
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            ret.put("supported", false)
            call.resolve(ret)
            return
        }
        val euicc = context.getSystemService(Context.EUICC_SERVICE) as? EuiccManager
        ret.put("supported", euicc?.isEnabled == true)
        call.resolve(ret)
    }

    // ── Helper: reject with a stable code string ─────────────────────
    private fun rejectWithCode(call: PluginCall, code: String, message: String) {
        val data = JSObject()
        data.put("code", code)
        call.reject(message, code, null, data)
    }
}
