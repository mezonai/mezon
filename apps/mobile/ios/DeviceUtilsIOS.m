#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DeviceUtilsIOS, NSObject)

RCT_EXTERN_METHOD(isTablet:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
