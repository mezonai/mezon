#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AudioModule, NSObject)

RCT_EXTERN_METHOD(playDialtone:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopDialtone:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
