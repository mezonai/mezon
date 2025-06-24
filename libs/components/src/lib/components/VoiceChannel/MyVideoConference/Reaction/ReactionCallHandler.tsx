import { getSrcEmoji } from '@mezon/utils';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { DisplayedEmoji, ReactionCallHandlerProps } from './types';

export const ReactionCallHandler: React.FC<ReactionCallHandlerProps> = memo(

	({ currentChannel, emojiReactions = [], onEmojiProcessed }) => {
		const [displayedEmojis, setDisplayedEmojis] = useState<DisplayedEmoji[]>([]);

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
			if (emojiReactions.length === 0) return;

			const firstEmojiId = emojiReactions[0];
			if (firstEmojiId) {
				const position = generatePosition();
				const delay = 0;
				const baseScale = 1.0;

				const newEmoji = {
					id: `${Date.now()}-${firstEmojiId}-${Math.random()}`,
					emoji: '',
					emojiId: firstEmojiId,
					timestamp: Date.now(),
					position: {
						...position,
						baseScale,
						delay: `${delay}ms`
					}
				};

				setDisplayedEmojis((prev) => [...prev, newEmoji]);

				const durationMs = parseFloat(position.duration) * 1000 + delay + 500;
				setTimeout(() => {
					setDisplayedEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
				}, durationMs);
			}

			if (onEmojiProcessed) {
				onEmojiProcessed();
			}
		}, [emojiReactions, generatePosition, onEmojiProcessed]);

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
	}
);
