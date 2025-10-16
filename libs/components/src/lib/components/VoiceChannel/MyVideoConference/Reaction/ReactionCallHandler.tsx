import { getStoreAsync, selectMemberClanByUserId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { getSrcEmoji, getSrcSound } from '@mezon/utils';
import type { VoiceReactionSend } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import type { DisplayedEmoji, ReactionCallHandlerProps } from './types';

export const ReactionCallHandler: React.FC<ReactionCallHandlerProps> = memo(({ currentChannel, onSoundReaction }) => {
	const [displayedEmojis, setDisplayedEmojis] = useState<DisplayedEmoji[]>([]);
	const { socketRef } = useMezon();
	const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

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
		if (!socketRef.current || !currentChannel?.channel_id) return;

		const currentSocket = socketRef.current;

		currentSocket.onvoicereactionmessage = (message: VoiceReactionSend) => {
			if (currentChannel?.channel_id === message.channel_id) {
				try {
					const emojis = message.emojis || [];
					const firstEmojiId = emojis[0];
					const senderId = message.sender_id;

					if (firstEmojiId) {
						if (firstEmojiId.startsWith('sound:')) {
							const soundId = firstEmojiId.replace('sound:', '');
							const soundUrl = getSrcSound(soundId);

							playSound(soundUrl, soundId);
							if (onSoundReaction && senderId) {
								onSoundReaction(senderId, soundId);
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
			audioRefs.current.forEach((audio) => {
				audio.pause();
			});
			audioRefs.current?.clear();
		};
	}, [socketRef, currentChannel, generatePosition, playSound, onSoundReaction]);

	if (displayedEmojis.length === 0) {
		return null;
	}

	return (
		<div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
			{displayedEmojis.map((item) => (
				<div
					key={item.id}
					className="text-5xl flex flex-col gap-2 items-center"
					style={{
						position: 'absolute',
						bottom: item.position?.bottom || '15%',
						left: item.position?.left || '50%',
						animation: `${item.position?.animationName || 'reactionFloatCurve1'} ${item.position?.duration || '3.5s'} linear forwards`,
						animationDelay: item.position?.delay || '0ms',
						height: '60px',
						transformOrigin: 'center center',
						willChange: 'transform, opacity',
						backfaceVisibility: 'hidden',
						contain: 'layout style paint'
					}}
				>
					<img
						src={getSrcEmoji(item.emojiId)}
						alt={''}
						className="w-10 h-10 object-contain"
						style={{
							filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
							willChange: 'transform',
							backfaceVisibility: 'hidden'
						}}
					/>
					{item.displayName && (
						<div className="w-full rounded-full h-3 text-theme-primary-active bg-theme-setting-nav text-[10px] flex items-center justify-center px-2 py-1">
							{item.displayName}
						</div>
					)}
				</div>
			))}
		</div>
	);
});
