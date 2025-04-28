#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BluetoothModule, RCTEventEmitter)

RCT_EXTERN_METHOD(isBluetoothHeadsetConnected:
                  (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startBluetoothListener)
RCT_EXTERN_METHOD(stopBluetoothListener)

// Required for RCTEventEmitter
RCT_EXTERN_METHOD(supportedEvents)

@end
