import {
	getStoreAsync,
	selectAllStickerSuggestion,
	selectCurrentChannelId,
	selectEmojiSuggestionEntities,
	selectMemberClanByUserId
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { IEmoji } from '@mezon/utils';
import { getEmojiUrl, getIdSaleItemFromSource, getSrcSound } from '@mezon/utils';
import type { VoiceReactionSend } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { DisplayedEmoji, ReactionCallHandlerProps } from './types';

export const ReactionCallHandler: React.FC<ReactionCallHandlerProps> = memo(({ onSoundReaction }) => {
	const [displayedEmojis, setDisplayedEmojis] = useState<DisplayedEmoji[]>([]);
	const { socketRef } = useMezon();
	const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
	const channelId = useSelector(selectCurrentChannelId);
	const emojiEntities = useSelector(selectEmojiSuggestionEntities);
	const allStickers = useSelector(selectAllStickerSuggestion);

	const generatePosition = useCallback(() => {
		const horizontalOffset = (Math.random() - 0.5) * 40;
		const baseLeft = 50;

		const animationVariant = Math.floor(Math.random() * 6) + 1;
		const animationName = `reactionFloatCurve${animationVariant}`;

		const duration = 2.5 + Math.random() * 3.5;

		return {
			left: `${baseLeft + horizontalOffset}%`,
			bottom: '15%',
			duration: `${duration.toFixed(1)}s`,
			animationName
		};
	}, []);

	const playSound = useCallback((soundUrl: string, soundId: string) => {
		try {
			const currentAudio = audioRefs.current.get(soundId);
			if (currentAudio) {
				currentAudio.pause();
				currentAudio.currentTime = 0;
			}

			const audio = new Audio(soundUrl);
			audio.volume = 0.3;
			audioRefs.current.set(soundId, audio);

			audio.play().catch((error) => {
				console.error('Failed to play sound reaction:', error);
			});

			audio.addEventListener('ended', () => {
				audioRefs.current.delete(soundId);
			});
		} catch (error) {
			console.error('Error playing sound reaction:', error);
		}
	}, []);

	useEffect(() => {
		if (!socketRef.current || !channelId) return;

		const currentSocket = socketRef.current;
		const currentAudioRefs = audioRefs.current;

		currentSocket.onvoicereactionmessage = (message: VoiceReactionSend) => {
			if (channelId === message.channel_id) {
				try {
					const emojis = message.emojis || [];
					const firstEmojiId = emojis[0];
					const senderId = message.sender_id;

					if (firstEmojiId) {
						if (firstEmojiId.startsWith('sound:')) {
							const soundId = firstEmojiId.replace('sound:', '');
							const sound = allStickers.find((s) => s.id === soundId);
							const soundUrl = sound?.source ? sound?.source : getSrcSound(sound?.id as string, sound?.creator_id);

							if (soundUrl) {
								playSound(soundUrl, soundId);
								if (onSoundReaction && senderId) {
									onSoundReaction(senderId, soundId);
								}
							} else {
								console.warn('Sound not found in store:', soundId);
							}
						} else {
							Array.from({ length: 1 }).forEach(async (_, index) => {
								const position = generatePosition();
								const delay = index * 300;
								const state = (await getStoreAsync()).getState();
								const members = selectMemberClanByUserId(state, senderId);
								const newEmoji = {
									id: `${Date.now()}-${firstEmojiId}-${index}-${Math.random()}`,
									emoji: '',
									emojiId: firstEmojiId,
									timestamp: Date.now(),
									displayName: members?.clan_nick || members?.user?.display_name || members?.user?.username || '',
									position: {
										...position,
										delay: `${delay}ms`
									}
								};

								setTimeout(() => {
									setDisplayedEmojis((prev) => [...prev, newEmoji]);
								}, delay);

								const durationMs = parseFloat(position.duration) * 1000 + delay + 500;
								setTimeout(() => {
									setDisplayedEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
								}, durationMs);
							});
						}
					}
				} catch (error) {
					console.error(error);
				}
			}
		};

		return () => {
			if (currentSocket) {
				currentSocket.onvoicereactionmessage = () => {};
			}
			currentAudioRefs.forEach((audio) => {
				audio.pause();
			});
			currentAudioRefs.clear();
		};
	}, [socketRef, channelId, generatePosition, playSound, onSoundReaction, allStickers]);

	if (displayedEmojis.length === 0) {
		return null;
	}

	return (
		<div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
			{displayedEmojis.map((item) => {
				let emojiMetadata: IEmoji | undefined = emojiEntities[item.emojiId];

				if (!emojiMetadata) {
					emojiMetadata = Object.values(emojiEntities).find((e) => {
						if (e.is_for_sale && e.src) {
							const extractedId = getIdSaleItemFromSource(e.src);
							return extractedId === item.emojiId;
						}
						return false;
					});
				}

				const emojiData = emojiMetadata
					? {
							src: emojiMetadata.src,
							id: emojiMetadata.id,
							emojiId: item.emojiId,
							creator_id: emojiMetadata.creator_id
						}
					: { id: item.emojiId, creator_id: item.creator_id };

				return (
					<div
						key={item.id}
						className="text-5xl flex flex-col gap-2 items-center absolute h-[60px] origin-center will-change-[transform,opacity] backface-hidden contain-[layout_style_paint]"
						style={{
							bottom: item.position?.bottom || '15%',
							left: item.position?.left || '50%',
							animation: `${item.position?.animationName || 'reactionFloatCurve1'} ${item.position?.duration || '3.5s'} linear forwards`,
							animationDelay: item.position?.delay || '0ms'
						}}
					>
						<img
							src={getEmojiUrl(emojiData)}
							alt={''}
							className="w-10 h-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] will-change-transform backface-hidden"
						/>
						{item.displayName && (
							<div className="w-full rounded-full h-3 text-theme-primary-active bg-theme-setting-nav text-[10px] flex items-center justify-center px-2 py-1">
								{item.displayName}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
});
