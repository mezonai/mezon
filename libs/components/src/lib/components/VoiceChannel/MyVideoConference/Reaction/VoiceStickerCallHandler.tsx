import { useRoomContext } from '@livekit/components-react';
import { useCallback, useEffect, useRef } from 'react';
import { useAudioPlayer } from './useAudioPlayer';
import { useVoiceStickerContext } from './VoiceStickerContext';

export const VoiceStickerCallHandler = ({ currentChannel }: { currentChannel: any }) => {
    const room = useRoomContext();
    const { playSound } = useAudioPlayer();
    const { setStickerSender } = useVoiceStickerContext();
    const initializedRef = useRef(false);


    const handleDataReceived = useCallback(async (payload: Uint8Array, participant: any) => {
        try {
            const dataString = new TextDecoder().decode(payload);
            const message = JSON.parse(dataString);

            if (message.type !== 'voice_sticker') {
                return;
            }


            if (!message) {
                console.warn('[VoiceStickerCallHandler] Message empty');
                return;
            }

            if (!currentChannel?.channel_id || message.channel_id !== currentChannel.channel_id) {
                console.warn(`[VoiceStickerCallHandler] not match channel id: received ${message.channel_id}, current ${currentChannel?.channel_id}`);
                return;
            }

            if (!message.stickerId) {
                console.warn('[VoiceStickerCallHandler] Thiếu stickerId trong message');
                return;
            }

            setStickerSender(participant.identity, 3000);

            for (let attempt = 1; attempt <= 2; attempt++) {
                const success = await playSound(message.stickerId, message.stickerUrl);

            }
        } catch (error) {
            console.error('[VoiceStickerCallHandler] error when process data:', error);
        }
    }, [currentChannel?.channel_id, playSound, setStickerSender]);

    useEffect(() => {
        if (!room || !currentChannel?.channel_id) {
            return;
        }

        if (initializedRef.current) return;
        initializedRef.current = true;

        room.on('dataReceived', handleDataReceived);

        return () => {
            room.off('dataReceived', handleDataReceived);
            initializedRef.current = false;
        };
    }, [room, currentChannel?.channel_id, handleDataReceived]);

    return null;
}; 