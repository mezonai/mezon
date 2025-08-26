#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ImageClipboardModule, NSObject)

RCT_EXTERN_METHOD(setImage:(NSString *)base64String
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(copyImageFromPath:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
