#import <React/RCTViewManager.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(FastNativeImageViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, NSString)

RCT_EXPORT_VIEW_PROPERTY(onLoadStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)

RCT_EXTERN_METHOD(getCacheSize:(RCTPromiseResolveBlock)resolve
				  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearCache:(nonnull NSNumber *)sizeToRemoveInMB
				  resolve:(RCTPromiseResolveBlock)resolve
				  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearAllCache:(RCTPromiseResolveBlock)resolve
				  reject:(RCTPromiseRejectBlock)reject)

@end
