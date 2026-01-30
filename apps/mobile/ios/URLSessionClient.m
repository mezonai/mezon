#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(URLSessionClient, NSObject)

RCT_EXTERN_METHOD(get:(NSString *)url
                  headers:(NSDictionary *)headers
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(post:(NSString *)url
                  body:(NSString *)body
                  headers:(NSDictionary *)headers
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(request:(NSString *)method
                  url:(NSString *)url
                  body:(NSString *)body
                  headers:(NSDictionary *)headers
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(requestBinary:(NSString *)method
                  url:(NSString *)url
                  bodyBase64:(NSString *)bodyBase64
                  headers:(NSDictionary *)headers
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
