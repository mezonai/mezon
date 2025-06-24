import { useCallback, useRef } from 'react';


export const useAudioPlayer = () => {
    const audioRefs = useRef<HTMLAudioElement[]>([]);
    const urlCache = useRef<Record<string, boolean>>({});


    const testAudioUrl = useCallback((url: string): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!url) {
                resolve(false);
                return;
            }

            if (urlCache.current[url] !== undefined) {
                resolve(urlCache.current[url]);
                return;
            }

            const audio = new Audio();

            const onCanPlay = () => {
                cleanup();
                urlCache.current[url] = true;

                resolve(true);
            };

            const onError = () => {
                cleanup();
                urlCache.current[url] = false;

                resolve(false);
            };

            const cleanup = () => {
                audio.removeEventListener('canplaythrough', onCanPlay);
                audio.removeEventListener('error', onError);
                clearTimeout(timeoutId);
            };

            audio.addEventListener('canplaythrough', onCanPlay);
            audio.addEventListener('error', onError);

            const timeoutId = setTimeout(() => {
                cleanup();
                urlCache.current[url] = false;

                resolve(false);
            }, 1500);

            try {
                audio.crossOrigin = "anonymous";
                audio.preload = "auto";
                audio.volume = 0;
                audio.src = url;
                audio.load();
            } catch (error) {
                clearTimeout(timeoutId);
                cleanup();
                urlCache.current[url] = false;
                console.error('[AudioPlayer] error when load url:', url, error);
                resolve(false);
            }
        });
    }, []);


    const generateFallbackUrls = useCallback((stickerId: string, primaryUrl?: string): string[] => {
        const formats = ['mp3', 'wav', 'ogg'];
        const urls: string[] = [];

        if (primaryUrl) {
            urls.push(primaryUrl);
        }

        urls.push(
            `/assets/sounds/${stickerId}.mp3`,
            `https://mezon-assets.s3.amazonaws.com/sounds/${stickerId}.mp3`,
            `/public/assets/sounds/${stickerId}.mp3`,
            `/sounds/${stickerId}.mp3`,
            `/assets/audio/${stickerId}.mp3`
        );

        formats.forEach(format => {
            if (format !== 'mp3') {
                urls.push(
                    `/assets/sounds/${stickerId}.${format}`,
                    `https://mezon-assets.s3.amazonaws.com/sounds/${stickerId}.${format}`,
                    `/public/assets/sounds/${stickerId}.${format}`,
                    `/sounds/${stickerId}.${format}`,
                    `/assets/audio/${stickerId}.${format}`
                );
            }
        });

        if (primaryUrl && primaryUrl.includes('?')) {
            urls.push(primaryUrl.split('?')[0]);
        }

        return [...new Set(urls)];
    }, []);


    const playSound = useCallback(async (stickerId: string, primaryUrl?: string): Promise<boolean> => {

        const urlsToTry = generateFallbackUrls(stickerId, primaryUrl);
        const audio = new Audio();

        audio.onended = () => {
            audioRefs.current = audioRefs.current.filter(a => a !== audio);
        };

        audio.volume = 0.5;
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";

        for (const url of urlsToTry) {
            try {

                const canPlay = await testAudioUrl(url);
                if (canPlay) {
                    audio.src = url;

                    try {
                        await audio.play();

                        audioRefs.current.push(audio);
                        return true;
                    } catch (playError) {
                        console.warn('[AudioPlayer] error when play sound, try with mute:', url, playError);
                        try {
                            audio.muted = true;
                            await audio.play();
                            audio.muted = false;

                            audioRefs.current.push(audio);
                            return true;
                        } catch (autoplayError) {
                            console.error('[AudioPlayer] cant play sound after mute:', url, autoplayError);
                            continue;
                        }
                    }
                }
            } catch (error) {
                console.error('[AudioPlayer] error when process url:', url, error);
            }
        }

        console.warn('[AudioPlayer] sent try all url but cant play sound for sticker:', stickerId);
        return false;
    }, [testAudioUrl, generateFallbackUrls]);


    const previewSound = useCallback((url: string, stickerId: string): void => {
        if (!url && !stickerId) {
            console.warn('[AudioPlayer] cant preview sound: url and stickerId are empty');
            return;
        }

        playSound(stickerId, url)
            .catch(error => {
                console.error('[AudioPlayer] error when preview sound:', error);
            });
    }, [playSound]);


    const stopAllSounds = useCallback(() => {

        audioRefs.current.forEach(audio => {
            try {
                audio.pause();
                audio.src = '';
            } catch (e) {
                console.error('[AudioPlayer] error when stop sound:', e);
            }
        });
        audioRefs.current = [];
    }, []);

    return {
        playSound,
        previewSound,
        testAudioUrl,
        stopAllSounds,
        generateFallbackUrls
    };
}; 