import { useMezon } from '@mezon/transport';
import { getSrcEmoji } from '@mezon/utils';
import { VoiceReactionSend } from 'mezon-js';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { DisplayedEmoji, ReactionCallHandlerProps } from './types';

export const ReactionCallHandler: React.FC<ReactionCallHandlerProps> = memo(({ currentChannel }) => {
	const [displayedEmojis, setDisplayedEmojis] = useState<DisplayedEmoji[]>([]);
	const { socketRef } = useMezon();
	const lastPositionRef = useRef<number>(Math.floor(Math.random() * 40));

	const generatePosition = useCallback(() => {
		const newPosition = (lastPositionRef.current + 10 + Math.floor(Math.random() * 20)) % 40;
		lastPositionRef.current = newPosition;

		const bottomOffset = 35 + Math.floor(Math.random() * 10);
		const duration = 2.5 + Math.random() * 1;

		return {
			left: `${30 + newPosition}%`,
			bottom: `${bottomOffset}%`,
			duration: `${duration.toFixed(1)}s`
		};
	}, []);

	useEffect(() => {
		if (!socketRef.current || !currentChannel?.channel_id) return;

		const currentSocket = socketRef.current;

		currentSocket.onVoiceReactionMessage = (message: VoiceReactionSend) => {
			if (currentChannel?.channel_id === message.channel_id) {
				try {
					const emojis = message.emojis || [];
					const newEmojis: DisplayedEmoji[] = [];

					emojis.forEach((emojiId, index) => {
						if (emojiId) {
							const position = generatePosition();

							const newEmoji = {
								id: `${Date.now()}-${index}`,
								emoji: '',
								emojiId: emojiId,
								timestamp: Date.now(),
								position
							};

							newEmojis.push(newEmoji);

							const durationMs = parseFloat(position.duration) * 1000 + 100;
							setTimeout(() => {
								setDisplayedEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
							}, durationMs);
						}
					});
				} catch (error) {
					console.error(error);
				}
			}
		};

		return () => {
			if (currentSocket) {
				currentSocket.onVoiceReactionMessage = () => {};
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
						bottom: item.position?.bottom || '40%',
						left: item.position?.left || `${30 + Math.random() * 40}%`,
						animation: `floatUp ${item.position?.duration || '3s'} ease-out forwards`,
						opacity: 0.8,
						height: '64px'
					}}
				>
					<img src={getSrcEmoji(item.emojiId)} alt={item.emoji} className="w-full h-full object-cover" />
				</div>
			))}
		</div>
	);
});
