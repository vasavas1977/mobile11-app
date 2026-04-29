import Foundation
import Capacitor

@objc(EsimInstallerPlugin)
public class EsimInstallerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "EsimInstallerPlugin"
    public let jsName = "EsimInstaller"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "install", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isSupported", returnType: CAPPluginReturnPromise)
    ]

    // MARK: - install()
    @objc func install(_ call: CAPPluginCall) {
        guard let activationCode = call.getString("activationCode") else {
            call.reject("Missing required parameter: activationCode")
            return
        }

        // ── Default path: Apple universal-link eSIM provisioning ──
        // Works on all iOS 12.1+ devices without carrier entitlement.
        guard let encoded = activationCode.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=\(encoded)") else {
            call.reject("Failed to build eSIM provisioning URL")
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:]) { success in
                if success {
                    call.resolve(["success": true])
                } else {
                    call.reject("Failed to open eSIM provisioning URL")
                }
            }
        }

        // ── Future entitled path (requires com.apple.CommCenter.fine-grained) ──
        // Uncomment when Apple grants the carrier entitlement.
        //
        // import CoreTelephony
        //
        // private func installWithCoretelephony(activationCode: String, call: CAPPluginCall) {
        //     let parts = activationCode
        //         .replacingOccurrences(of: "LPA:1$", with: "")
        //         .components(separatedBy: "$")
        //     guard parts.count >= 2 else {
        //         call.reject("Invalid LPA activation code format")
        //         return
        //     }
        //     let smdp = parts[0]
        //     let matchingID = parts[1]
        //
        //     let provisioning = CTCellularPlanProvisioning()
        //     guard provisioning.supportsCellularPlan() else {
        //         call.reject("Device does not support eSIM provisioning")
        //         return
        //     }
        //
        //     let req = CTCellularPlanProvisioningRequest()
        //     req.address = smdp
        //     req.matchingID = matchingID
        //
        //     provisioning.addPlan(with: req) { result in
        //         switch result {
        //         case .success:
        //             call.resolve(["success": true])
        //         case .fail:
        //             call.reject("eSIM provisioning failed")
        //         case .unknown:
        //             call.reject("eSIM provisioning returned unknown result")
        //         @unknown default:
        //             call.reject("eSIM provisioning returned unexpected result")
        //         }
        //     }
        // }
    }

    // MARK: - isSupported()
    @objc func isSupported(_ call: CAPPluginCall) {
        // Universal-link path works on all iOS 12.1+ devices.
        if #available(iOS 12.1, *) {
            call.resolve(["supported": true])
        } else {
            call.resolve(["supported": false])
        }
    }
}
