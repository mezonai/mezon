import { useMezon } from '@mezon/transport';
import { getSrcEmoji } from '@mezon/utils';
import { VoiceReactionSend } from 'mezon-js';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { DisplayedEmoji, ReactionCallHandlerProps } from './types';

export const ReactionCallHandler: React.FC<ReactionCallHandlerProps> = memo(({ currentChannel }) => {
	const [displayedEmojis, setDisplayedEmojis] = useState<DisplayedEmoji[]>([]);
	const { socketRef } = useMezon();

	const generatePosition = useCallback(() => {
		const horizontalOffset = (Math.random() - 0.5) * 30;
		const baseLeft = 50;

		const animationVariant = Math.floor(Math.random() * 3) + 1;
		const animationName = `reactionFloatCurve${animationVariant}`;

		const duration = 4.0 + Math.random() * 1.0;

		return {
			left: `${baseLeft + horizontalOffset}%`,
			bottom: '15%',
			duration: `${duration.toFixed(1)}s`,
			animationName
		};
	}, []);

	useEffect(() => {
		if (!socketRef.current || !currentChannel?.channel_id) return;

		const currentSocket = socketRef.current;

		currentSocket.onvoicereactionmessage = (message: VoiceReactionSend) => {
			if (currentChannel?.channel_id === message.channel_id) {
				try {
					const emojis = message.emojis || [];
					const firstEmojiId = emojis[0];

					if (firstEmojiId) {
						Array.from({ length: 1 }).forEach((_, index) => {
							const position = generatePosition();
							const delay = index * 300;

							const baseScale = 1.0 - index * 0.15;

							const newEmoji = {
								id: `${Date.now()}-${firstEmojiId}-${index}-${Math.random()}`,
								emoji: '',
								emojiId: firstEmojiId,
								timestamp: Date.now(),
								position: {
									...position,
									baseScale,
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
				} catch (error) {
					console.error(error);
				}
			}
		};

		return () => {
			if (currentSocket) {
				currentSocket.onvoicereactionmessage = () => { };
			}
		};
	}, [socketRef, currentChannel, generatePosition]);

	if (displayedEmojis.length === 0) {
		return null;
	}

	return (
		<div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
			{displayedEmojis.map((item) => (
				<div
					key={item.id}
					className="text-5xl"
					style={{
						position: 'absolute',
						bottom: item.position?.bottom || '15%',
						left: item.position?.left || '50%',
						animation: `${item.position?.animationName || 'reactionFloatCurve1'} ${item.position?.duration || '4.5s'} linear forwards`,
						animationDelay: item.position?.delay || '0ms',
						width: '36px',
						height: '36px',
						transform: `scale(${item.position?.baseScale || 1})`,
						transformOrigin: 'center center',
						willChange: 'transform, opacity',
						backfaceVisibility: 'hidden',
						perspective: '1000px'
					}}
				>
					<img
						src={getSrcEmoji(item.emojiId)}
						alt={''}
						className="w-full h-full object-contain"
						style={{
							filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
							willChange: 'transform',
							backfaceVisibility: 'hidden'
						}}
					/>
				</div>
			))}
		</div>
	);
});