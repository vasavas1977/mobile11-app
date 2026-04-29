#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(EsimInstallerPlugin, "EsimInstaller",
    CAP_PLUGIN_METHOD(install, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isSupported, CAPPluginReturnPromise);
)
