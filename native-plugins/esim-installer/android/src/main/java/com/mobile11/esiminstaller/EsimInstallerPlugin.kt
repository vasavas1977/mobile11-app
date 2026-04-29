package com.mobile11.esiminstaller

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.euicc.DownloadableSubscription
import android.telephony.euicc.EuiccManager
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "EsimInstaller")
class EsimInstallerPlugin : Plugin() {

    companion object {
        private const val ACTION_DOWNLOAD_SUBSCRIPTION =
            "com.mobile11.app.ACTION_DOWNLOAD_SUBSCRIPTION"
        private const val REQUEST_CODE_DOWNLOAD = 1001
        private const val REQUEST_CODE_RESOLUTION = 1002
    }

    private var pendingCall: PluginCall? = null

    // ── BroadcastReceiver for download result ──────────────────────────
    private val downloadReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            if (intent.action != ACTION_DOWNLOAD_SUBSCRIPTION) return

            val resultCode = getResultCode()
            val call = pendingCall ?: return

            when (resultCode) {
                EuiccManager.EMBEDDED_SUBSCRIPTION_RESULT_OK -> {
                    val ret = JSObject()
                    ret.put("success", true)
                    call.resolve(ret)
                    pendingCall = null
                }

                EuiccManager.EMBEDDED_SUBSCRIPTION_RESULT_RESOLVABLE_ERROR -> {
                    // The system needs to show a confirmation dialog
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
                        call.reject("Failed to start resolution activity: ${e.message}")
                        pendingCall = null
                    }
                }

                EuiccManager.EMBEDDED_SUBSCRIPTION_RESULT_ERROR -> {
                    val detailedCode = intent.getIntExtra(
                        EuiccManager.EXTRA_EMBEDDED_SUBSCRIPTION_DETAILED_CODE, -1
                    )
                    call.reject("eSIM download failed. Error code: $detailedCode")
                    pendingCall = null
                }

                else -> {
                    call.reject("eSIM download returned unknown result: $resultCode")
                    pendingCall = null
                }
            }
        }
    }

    override fun load() {
        super.load()
        // Register the broadcast receiver
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(
                downloadReceiver,
                IntentFilter(ACTION_DOWNLOAD_SUBSCRIPTION),
                Context.RECEIVER_NOT_EXPORTED
            )
        } else {
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
            // Receiver may not be registered
        }
    }

    // ── install() ──────────────────────────────────────────────────────
    @PluginMethod
    fun install(call: PluginCall) {
        val activationCode = call.getString("activationCode")
        if (activationCode.isNullOrBlank()) {
            call.reject("Missing required parameter: activationCode")
            return
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            call.reject("eSIM not supported on this Android version (requires API 28+)")
            return
        }

        val euicc = context.getSystemService(Context.EUICC_SERVICE) as? EuiccManager
        if (euicc == null || !euicc.isEnabled) {
            call.reject("eSIM not supported on this device")
            return
        }

        pendingCall = call

        val subscription = DownloadableSubscription.forActivationCode(activationCode)
        val callbackIntent = Intent(ACTION_DOWNLOAD_SUBSCRIPTION).setPackage(context.packageName)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            REQUEST_CODE_DOWNLOAD,
            callbackIntent,
            PendingIntent.FLAG_MUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        euicc.downloadSubscription(subscription, true, pendingIntent)
    }

    // ── isSupported() ──────────────────────────────────────────────────
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
}
