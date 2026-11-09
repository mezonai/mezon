import { getStore, getStoreAsync, selectMemberClanByUserId, selectVoiceInfo } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import { MezonIcon, MzIcons20, MzIcons32 } from '@mezon/ui';
import { createImgproxyUrl, getSrcEmoji, sinkIdForHtmlMediaElement } from '@mezon/utils';
import type { VoiceReactionSend } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { soundReactionsService } from './soundReactionsService';
import type { DisplayedEmoji, DisplayedHand } from './types';

const MAX_EMOJIS_DISPLAYED = 20;
const EMOJI_RATE_LIMIT_MS = 150;

type AudioWithSink = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };

interface ReactionCallHandlerProps {
	sinkId?: string;
}

const applyOutputSink = async (audio: HTMLAudioElement, sinkId?: string) => {
	if (sinkId === undefined) return;
	const el = audio as AudioWithSink;
	if (typeof el.setSinkId !== 'function') return;
	const targetSinkId = sinkIdForHtmlMediaElement(sinkId);
	try {
		await el.setSinkId(targetSinkId);
	} catch (err) {
		console.warn('[ReactionCallHandler] failed to setSinkId', err);
		if (targetSinkId !== '') {
			try {
				await el.setSinkId('');
			} catch (fallbackErr) {
				console.warn('[ReactionCallHandler] fallback to default speaker failed', fallbackErr);
			}
		}
	}
};

export const ReactionCallHandler = memo(({ sinkId }: ReactionCallHandlerProps = {}) => {
	const [displayedEmojis, setDisplayedEmojis] = useState<DisplayedEmoji[]>([]);
	const [raisingList, setRaisingList] = useState<DisplayedHand[]>([]);
	const timeoutsRef = useRef<Map<string, number>>(new Map());

	const { clientRef } = useMezon();
	const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
	const emojiQueueRef = useRef<DisplayedEmoji[]>([]);
	const lastEmojiTimestampRef = useRef<number>(0);
	const voiceInfo = useSelector(selectVoiceInfo);
	const channelId = voiceInfo?.channelId;
	const rafRef = useRef<number>();
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		if (sinkId === undefined) return;
		const elements: HTMLAudioElement[] = [];
		if (audioRef.current) elements.push(audioRef.current);
		audioRefs.current.forEach((audio) => elements.push(audio));
		elements.forEach((audio) => {
			void applyOutputSink(audio, sinkId);
		});
	}, [sinkId]);

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

	const playSound = useCallback(
		(soundUrl: string, soundId: string, senderId: string) => {
			try {
				let audio = audioRefs.current.get(soundId);
				const isNewAudio = !audio;
				if (audio) {
					audio.pause();
					audio.currentTime = 0;
				} else {
					audio = new Audio(soundUrl);
					audio.volume = 0.3;
					audioRefs.current.set(soundId, audio);
					audio.onended = () => {
						soundReactionsService.removeActiveSoundParticipant(senderId);
					};
				}

				const triggerPlay = () => {
					audio.play().catch((error) => {
						console.error('Failed to play sound reaction:', error);
					});
				};

				if (isNewAudio) {
					void applyOutputSink(audio, sinkId).finally(triggerPlay);
				} else {
					triggerPlay();
				}
			} catch (error) {
				console.error('Error playing sound reaction:', error);
			}
		},
		[sinkId]
	);

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
		if (!clientRef.current || !channelId) return;

		const currentSocket = clientRef.current;
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
							if (senderId) {
								soundReactionsService.handleSoundReaction(senderId, soundUrl);
							}
							return;
						}
						if (firstEmojiId.startsWith('raising-up:')) {
							const state = getStore().getState();
							const members = selectMemberClanByUserId(state, senderId);
							if (!members) {
								return;
							}
							setRaisingList((prev) => [
								...prev,
								{
									id: senderId,
									avatar: members?.clan_avatar || members?.user?.avatar_url || '',
									name: members?.clan_nick || members?.user?.display_name || members?.user?.username || ''
								}
							]);

							const timeoutId = window.setTimeout(() => {
								setRaisingList((list) => list.filter((i) => i.id !== senderId));
								timeoutsRef.current.delete(senderId);
							}, 10000);

							timeoutsRef.current.set(senderId, timeoutId);
							if (audioRef.current) {
								audioRef.current.play().catch((error) => {
									console.error(error);
								});
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
			soundReactionsService.clearAllSound();
			audioMap.clear();
		};
	}, [clientRef, channelId, generatePosition, playSound]);

	const shouldRender = displayedEmojis.length !== 0 || raisingList.length !== 0;
	return (
		<>
			<audio ref={audioRef} src="/assets/audio/raising-hand.mp3" preload="auto" className="hidden" />
			{shouldRender && (
				<>
					<div className="absolute z-30 flex items-center justify-center inset-0 pointer-events-none ">
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
					</div>
					{!!raisingList.length && (
						<div className="absolute z-30 flex items-center justify-center w-fit right-0">
							<div className="absolute w-80 right-2 top-[68px] flex flex-col gap-1 items-end">
								{raisingList.map((item) => (
									<div
										className="w-40 h-9 bg-white rounded-full flex gap-2 items-center justify-center p-1 hover:w-fit"
										key={item.id}
									>
										{item.avatar ? (
											<img
												src={createImgproxyUrl(item.avatar, { width: 100, height: 100, resizeType: 'fill-down' })}
												className="w-8 h-8 rounded-full"
											/>
										) : (
											<div className="size-8 rounded-full bg-bgDisable flex items-center justify-center">
												<MezonIcon icon={MzIcons20.mzUser} className="text-[var(--mz-icon)]" />
											</div>
										)}
										<div className="text-sm text-black flex-1 truncate font-semibold">{item.name}</div>
										<MezonIcon icon={MzIcons32.mzHandRaise} className="text-[#efbc39] drop-shadow-lg" />
									</div>
								))}
							</div>
						</div>
					)}
				</>
			)}
		</>
	);
});
