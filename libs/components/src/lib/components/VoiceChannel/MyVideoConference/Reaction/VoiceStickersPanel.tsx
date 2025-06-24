import {
    MediaType,
    selectAllStickerSuggestion,
    useAppDispatch,
    useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAudioPlayer } from './useAudioPlayer';

interface VoiceSticker {
    id?: string;
    shortname?: string;
    source?: string;
    clan_name?: string;
    media_type?: string;
}

export type VoiceStickersPanelProps = {
    onSelect: (stickerId: string, stickerUrl?: string) => void;
    onClose?: () => void;
};

export const VoiceStickersPanel: React.FC<VoiceStickersPanelProps> = ({ onSelect, onClose }) => {
    const dispatch = useAppDispatch();
    const panelRef = useRef<HTMLDivElement>(null);
    const { previewSound } = useAudioPlayer();

    const allStickersInStore = useAppSelector(selectAllStickerSuggestion);
    const allSoundsInStore = allStickersInStore.filter((sticker: any) => sticker.media_type === MediaType.AUDIO);

    const voiceStickers = useMemo(() => {
        return allSoundsInStore.map((sound: any) => ({
            id: sound.id || '',
            shortname: sound.shortname || 'Sound',
            source: sound.source || '',
            clan_name: sound.clan_name || 'Voice Stickers',
        }));
    }, [allSoundsInStore]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                onClose && onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose && onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleStickerSelect = useCallback((stickerId: string, stickerUrl?: string) => {
        if (stickerId) {
            onSelect(stickerId, stickerUrl);
        }
    }, [onSelect]);

    const handlePreviewSound = useCallback((e: React.MouseEvent, stickerId: string, stickerUrl?: string) => {
        e.stopPropagation();
        if (stickerId) {
            previewSound(stickerUrl || '', stickerId);
        }
    }, [previewSound]);

    return (
        <div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="voice-stickers-panel w-[370px] sbm:w-[430px] h-fit min-h-[350px] max-h-[500px] bg-white dark:bg-[#2B2D31] rounded-lg shadow-lg flex flex-col overflow-hidden z-30"
        >
            <div className="sticky top-0 z-10 bg-white dark:bg-[#2B2D31] border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center px-4 py-3">
                    <h3 className="font-semibold text-black dark:text-white text-lg">Voice Stickers</h3>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <Icons.Close className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {voiceStickers.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 dark:text-gray-400">No voice stickers found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
                        {voiceStickers.map((sticker) => (
                            <div
                                key={sticker.id}
                                onClick={() => handleStickerSelect(sticker.id || '', sticker.source)}
                                className="flex items-center gap-3 bg-gray-50 dark:bg-[#313338] p-3 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-[#383A40] transition-colors"
                            >
                                <div
                                    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                                    onClick={(e) => handlePreviewSound(e, sticker.id || '', sticker.source)}
                                    title="Thử nghe"
                                >
                                    <Icons.Speaker defaultSize="w-5 h-5" />
                                </div>
                                <span className="truncate text-gray-800 dark:text-gray-200 font-medium flex-1">{sticker.shortname}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}; 