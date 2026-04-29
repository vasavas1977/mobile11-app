package com.mobile11.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.mobile11.esiminstaller.EsimInstallerPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Register custom plugins before super.onCreate
        registerPlugin(EsimInstallerPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
