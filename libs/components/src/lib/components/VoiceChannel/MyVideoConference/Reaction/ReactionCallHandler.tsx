import { getStore, getStoreAsync, selectCurrentChannelId, selectMemberClanByUserId } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { getSrcEmoji } from '@mezon/utils';
import type { VoiceReactionSend } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import type { DisplayedEmoji, DisplayedHand, ReactionCallHandlerProps } from './types';

const MAX_EMOJIS_DISPLAYED = 20;
const EMOJI_RATE_LIMIT_MS = 150;

export const ReactionCallHandler: React.FC<ReactionCallHandlerProps> = memo(({ onSoundReaction, onEndSound }) => {
	const [displayedEmojis, setDisplayedEmojis] = useState<DisplayedEmoji[]>([]);
	const [raisingList, setRaisingList] = useState<DisplayedHand[]>([]);
	const timeoutsRef = useRef<Map<string, number>>(new Map());

	const { socketRef } = useMezon();
	const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
	const emojiQueueRef = useRef<DisplayedEmoji[]>([]);
	const lastEmojiTimestampRef = useRef<number>(0);
	const channelId = useSelector(selectCurrentChannelId);
	const rafRef = useRef<number>();
	const audioRef = useRef<HTMLAudioElement>(null);
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

	const playSound = useCallback((soundUrl: string, soundId: string, senderId: string) => {
		try {
			let audio = audioRefs.current.get(soundId);
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			} else {
				audio = new Audio(soundUrl);
				audio.volume = 0.3;
				audioRefs.current.set(soundId, audio);
				audio.onended = () => {
					if (onEndSound) {
						onEndSound(senderId);
					}
				};
			}

			audio.play().catch((error) => {
				console.error('Failed to play sound reaction:', error);
			});
		} catch (error) {
			console.error('Error playing sound reaction:', error);
		}
	}, []);

	useEffect(() => {
		const handleAnimationFrame = () => {
			if (emojiQueueRef.current.length) {
				setDisplayedEmojis((prev) => {
					const merged = [...prev, ...emojiQueueRef.current];
					emojiQueueRef.current = [];
					return merged.slice(-MAX_EMOJIS_DISPLAYED);
				});
			}
			rafRef.current = requestAnimationFrame(handleAnimationFrame);
		};

		rafRef.current = requestAnimationFrame(handleAnimationFrame);

		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!socketRef.current || !channelId) return;

		const currentSocket = socketRef.current;
		const audioMap = audioRefs.current;

		currentSocket.onvoicereactionmessage = (message: VoiceReactionSend) => {
			if (channelId === message.channel_id) {
				try {
					const emojis = message.emojis || [];
					const firstEmojiId = emojis[0];
					const senderId = message.sender_id;

					if (firstEmojiId) {
						if (firstEmojiId.startsWith('sound:')) {
							const soundUrl = firstEmojiId.replace('sound:', '');

							playSound(soundUrl, soundUrl, senderId);
							if (onSoundReaction && senderId) {
								onSoundReaction(senderId, soundUrl);
							}
							return;
						}
						if (firstEmojiId.startsWith('raising-up:')) {
							const state = getStore().getState();
							const members = selectMemberClanByUserId(state, senderId);
							setRaisingList((prev) => [
								...prev,
								{
									id: senderId,
									avatar: members?.clan_avatar || members?.user?.avatar_url || '',
									name: members.clan_nick || members.user?.display_name || members.user?.username || ''
								}
							]);

							const timeoutId = window.setTimeout(() => {
								setRaisingList((list) => list.filter((i) => i.id !== senderId));
								timeoutsRef.current.delete(senderId);
							}, 10000);

							timeoutsRef.current.set(senderId, timeoutId);
							if (audioRef.current) {
								audioRef.current.play();
							}

							return;
						}
						if (firstEmojiId.startsWith('raising-down:')) {
							const timeoutId = timeoutsRef.current.get(senderId);

							if (timeoutId) {
								clearTimeout(timeoutId);
								timeoutsRef.current.delete(senderId);
							}

							setRaisingList((list) => list.filter((i) => i.id !== senderId));

							return;
						}
						const now = Date.now();
						if (now - lastEmojiTimestampRef.current < EMOJI_RATE_LIMIT_MS) {
							return;
						}
						lastEmojiTimestampRef.current = now;

						(async () => {
							const position = generatePosition();
							const state = (await getStoreAsync()).getState();
							const members = selectMemberClanByUserId(state, senderId);
							const newEmoji: DisplayedEmoji = {
								id: `${now}-${firstEmojiId}-${Math.random()}`,
								emoji: '',
								emojiId: firstEmojiId,
								timestamp: now,
								displayName: members?.clan_nick || members?.user?.display_name || members?.user?.username || '',
								position
							};

							emojiQueueRef.current.push(newEmoji);

							const durationMs = parseFloat(position.duration) * 1000 + 500;
							setTimeout(() => {
								setDisplayedEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
							}, durationMs);
						})();
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
			audioMap.forEach((audio) => {
				audio.pause();
			});
			audioMap.clear();
		};
	}, [socketRef, channelId, generatePosition, playSound, onSoundReaction]);

	const shouldRender = displayedEmojis.length !== 0 || raisingList.length !== 0;
	return (
		<>
			<audio ref={audioRef} src="assets/audio/raising-hand.mp3" preload="auto" className="hidden" />
			{shouldRender && (
				<div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
					{displayedEmojis &&
						displayedEmojis.map((item) => (
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
									src={getSrcEmoji(item.emojiId)}
									alt={''}
									className="w-10 h-10 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] will-change-transform backface-hidden"
								/>
								{item.displayName && (
									<div className="w-full rounded-full h-3 text-theme-primary-active bg-theme-setting-nav text-[10px] flex items-center justify-center px-2 py-1">
										{item.displayName}
									</div>
								)}
							</div>
						))}
					{!!raisingList.length && (
						<div className="absolute w-40 right-2 top-[68px] flex flex-col gap-1">
							{raisingList.map((item) => (
								<div className="w-40 h-9 bg-white rounded-full right-2 flex gap-2 items-center justify-center p-1" key={item.id}>
									{item.avatar ? (
										<img src={item.avatar} className="w-8 h-8 rounded-full" />
									) : (
										<div className="w-10 h-10 rounded-full">{item.name.charAt(0)}</div>
									)}
									<div className="text-sm text-black flex-1 truncate font-semibold">{item.name}</div>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5.0 -10.0 110.0 135.0" className="h-8" fill="#efbc39">
										<defs>
											<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
												<feDropShadow dx="2" dy="2" stdDeviation="5" floodColor="#000000" floodOpacity="1" />
											</filter>
										</defs>
										<path
											d="m50 94.488c-30.781-0.48828-28.59-41.488-28.59-41.488v-21c-0.058594-1.3242 0.42578-2.6172 1.3398-3.5781 0.91797-0.96094 2.1875-1.5039 3.5156-1.5039s2.5977 0.54297 3.5117 1.5039c0.91797 0.96094 1.4023 2.2539 1.3438 3.5781v21h0.51953v-0.12891h1.6016l-0.003907-38.199c-0.058593-1.3281 0.42578-2.6211 1.3438-3.5781 0.91797-0.96094 2.1875-1.5039 3.5117-1.5039 1.3281 0 2.5977 0.54297 3.5156 1.5039 0.91797 0.95703 1.4023 2.25 1.3398 3.5781v36h2.1602v-40.32c0-2.6797 2.1719-4.8516 4.8516-4.8516 2.6758 0 4.8477 2.1719 4.8477 4.8516v40.32h2v-34.922c0-2.7617 2.2383-5 5-5 2.7617 0 5 2.2383 5 5v45.379l2 0.46094v-15.59c0.12109-2.5977 2.2578-4.6406 4.8555-4.6406 2.5977 0 4.7383 2.043 4.8555 4.6406v15.59s2.2188 33.41-28.52 32.898z"
											filter="url(#shadow)"
										/>
									</svg>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</>
	);
});
