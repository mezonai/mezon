/* eslint-disable prettier/prettier */
import { baseColor } from '@mezon/mobile-ui';
import { EBacktickType, getFacebookEmbedUrl, getTikTokEmbedUrl } from '@mezon/utils';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { TextStyle } from 'react-native';
import { ActivityIndicator, Dimensions, Keyboard, Text, View } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import WebviewBase from '../../../../../../../components/WebviewBase';
import { style } from './styles';

interface IRenderSocialVideoProps {
    videoKey: string;
    url: string;
    platform: EBacktickType.LINKFACEBOOK | EBacktickType.LINKTIKTOK;
    contentInElement: string;
    onPress?: () => void;
    onLongPress?: () => void;
    linkStyle?: TextStyle;
};

const PLATFORM_CONFIG = {
    [EBacktickType.LINKFACEBOOK]: {
        getEmbedUrl: getFacebookEmbedUrl,
        borderColor: baseColor.azureBlue,
        defaultRatio: 1
    },
    [EBacktickType.LINKTIKTOK]: {
        getEmbedUrl: getTikTokEmbedUrl,
        borderColor: baseColor.redStrong,
        defaultRatio: 9 / 16
    }
};

const INJECTED_JS = `
  (function() {
    var done = false;

    function post(w, h) {
      if (!done && w > 0 && h > 0) {
        done = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ width: w, height: h }));
      }
    }

    function measure() {
      var v = document.querySelector('video');
      if (v) {
        if (v.videoWidth) post(v.videoWidth, v.videoHeight);
        else v.addEventListener('loadedmetadata', function() { post(v.videoWidth, v.videoHeight); }, { once: true });
      }
    }

    function setViewport() {
      var meta = document.querySelector('meta[name="viewport"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'viewport';
        document.head.appendChild(meta);
      }
     meta.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
    }

    setViewport();
    measure();

    if (!done) {
      var ob = new MutationObserver(function() {
        measure();
        if (done) ob.disconnect();
      });
      ob.observe(document.body, { childList: true, subtree: true });
      setTimeout(function() { ob.disconnect(); }, 10000);
    }
  })();
  true;
`;

const RenderSocialVideo = ({ videoKey, url, platform, contentInElement, onPress, onLongPress, linkStyle }: IRenderSocialVideoProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [facebookEmbedRatio, setFacebookEmbedRatio] = useState<number>(PLATFORM_CONFIG[EBacktickType.LINKFACEBOOK].defaultRatio);
    const [dimension, setDimension] = useState(() => {
        const { width, height } = Dimensions.get('screen');
        return { width, height }
    });

    const checkOrientation = () => {
        const { width, height } = Dimensions.get('screen');
        setDimension({ width, height });
    };

    useEffect(() => {
        checkOrientation();

        const subscription = Dimensions.addEventListener('change', () => {
            checkOrientation();
        });

        return () => subscription?.remove();
    }, []);

    const isLandscape = useMemo(() => {
        return dimension?.width > dimension?.height;
    }, [dimension?.width, dimension?.height]);

    const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event?.nativeEvent?.data);
            if (platform === EBacktickType.LINKFACEBOOK && data?.width > 0 && data?.height > 0) {
                if (data.width < data.height) {
                    setFacebookEmbedRatio(9 / 16);
                } else if (data.width > data.height) {
                    setFacebookEmbedRatio(16 / 9);
                }
            }
        } catch (error) {
            console.error("Failed to parse webview message", error);
        }
    }, [platform]);

    const containerSize = useMemo(() => {
        if (!PLATFORM_CONFIG?.[platform]) return { width: 0, height: 0 };

        const baseWidth = isLandscape ? dimension?.width * 0.3 : dimension?.width * 0.6;
        const isFacebookEmbed = platform === EBacktickType.LINKFACEBOOK;
        return {
            width: baseWidth,
            height: baseWidth / (isFacebookEmbed ? facebookEmbedRatio : PLATFORM_CONFIG[platform].defaultRatio)
        };
    }, [platform, isLandscape, dimension?.width, facebookEmbedRatio]);

    const styles = useMemo(() => {
        return style(containerSize.width, containerSize.height, isLoading);
    }, [containerSize.width, containerSize.height, isLoading]);

    const embedUrl = useMemo(() => {
        if (!PLATFORM_CONFIG?.[platform]) return null;
        return PLATFORM_CONFIG[platform].getEmbedUrl(url);
    }, [platform, url]);

    if (!embedUrl) return null;

    return (
        <View key={videoKey}>
            <Text style={linkStyle} onPress={onPress} onLongPress={onLongPress}>
                {contentInElement}
            </Text>

            <View style={[styles.borderLeftView, { borderLeftColor: PLATFORM_CONFIG?.[platform]?.borderColor ?? baseColor.redStrong }]}>
                <View style={styles.webviewContainer}>
                    {isLoading && (
                        <View style={styles.loadingSpinner}>
                            <ActivityIndicator size="large" color={PLATFORM_CONFIG?.[platform]?.borderColor ?? baseColor.redStrong} />
                        </View>
                    )}
                    <WebviewBase
                        url={embedUrl}
                        style={[styles.webviewContainer, styles.webviewLoading]}
                        androidLayerType='hardware'
                        javaScriptEnabled
                        domStorageEnabled
                        allowsInlineMediaPlayback
                        nestedScrollEnabled
                        allowsFullscreenVideo
                        onLoadEnd={() => setIsLoading(false)}
                        onStartShouldSetResponder={() => true}
                        onTouchStart={() => {
                            Keyboard.dismiss();
                        }}
                        injectedJavaScript={platform === EBacktickType.LINKFACEBOOK ? INJECTED_JS : undefined}
                        onMessage={handleWebViewMessage}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView error: ', nativeEvent);
                            setIsLoading(false);
                        }}
                    />
                </View>
            </View>
        </View>
    );
};

export default memo(RenderSocialVideo);
