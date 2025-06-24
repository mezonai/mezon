import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface VoiceStickerContextType {
    stickerSenderId: string | null;
    setStickerSender: (senderId: string, duration?: number) => void;
    clearStickerSender: () => void;
    isPlayingSticker: (participantId: string) => boolean;
}

const defaultContext: VoiceStickerContextType = {
    stickerSenderId: null,
    setStickerSender: () => { },
    clearStickerSender: () => { },
    isPlayingSticker: () => false
};

export const VoiceStickerContext = createContext<VoiceStickerContextType>(defaultContext);

export const useVoiceStickerContext = () => useContext(VoiceStickerContext);

export const VoiceStickerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stickerSenderId, setStickerSenderId] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<number | null>(null);

    const clearStickerSender = useCallback(() => {
        setStickerSenderId(null);
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            setTimeoutId(null);
        }
    }, [timeoutId]);

    const setStickerSender = useCallback((senderId: string, duration: number = 3000) => {
        setStickerSenderId(senderId);

        if (timeoutId) {
            window.clearTimeout(timeoutId);
        }

        const id = window.setTimeout(() => {
            setStickerSenderId(null);
        }, duration);

        setTimeoutId(Number(id));
    }, [timeoutId]);

    const isPlayingSticker = useCallback((participantId: string) => {
        return stickerSenderId === participantId;
    }, [stickerSenderId]);



    useEffect(() => {
        return () => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    const value = {
        stickerSenderId,
        setStickerSender,
        clearStickerSender,
        isPlayingSticker
    };

    return (
        <VoiceStickerContext.Provider value={value}>
            {children}
        </VoiceStickerContext.Provider>
    );
}; 