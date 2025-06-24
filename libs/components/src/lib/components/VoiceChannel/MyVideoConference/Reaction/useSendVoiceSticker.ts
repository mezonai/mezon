import { useRoomContext } from '@livekit/components-react';
import { useCallback } from 'react';
import { UseSendReactionParams } from './types';
import { useAudioPlayer } from './useAudioPlayer';
import { useVoiceStickerContext } from './VoiceStickerContext';

export const useSendVoiceSticker = ({ currentChannel }: UseSendReactionParams) => {
    const room = useRoomContext();
    const { playSound } = useAudioPlayer();
    const { setStickerSender } = useVoiceStickerContext();

    const sendVoiceSticker = useCallback(
        async (stickerId: string, stickerUrl?: string) => {
            if (!room || !currentChannel?.channel_id) {
                return;
            }

            try {

                const eventPayload = {
                    type: 'voice_sticker',
                    channel_id: currentChannel.channel_id,
                    stickerId,
                    stickerUrl,
                    timestamp: Date.now()
                };

                const data = new TextEncoder().encode(JSON.stringify(eventPayload));

                room.localParticipant.publishData(data, { reliable: true });

                const localIdentity = room.localParticipant.identity;
                setStickerSender(localIdentity, 3000);

                try {
                    const success = await playSound(stickerId, stickerUrl);
                    if (!success) {
                        console.warn(`[SendVoiceSticker] cant play sound for sticker: ${stickerId}`);
                    }
                } catch (audioError) {
                    console.error(`[SendVoiceSticker] error when play sound:`, audioError);
                }
            } catch (error) {
                console.error(`[SendVoiceSticker] error when send sticker:`, error);
            }
        },
        [room, currentChannel?.channel_id, playSound, setStickerSender]
    );

    return sendVoiceSticker;
}; 