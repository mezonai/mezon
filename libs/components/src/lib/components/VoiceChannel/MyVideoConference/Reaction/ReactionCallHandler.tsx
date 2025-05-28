import { useMezon } from '@mezon/transport';
import { getSrcEmoji } from '@mezon/utils';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { DisplayedEmoji, ReactionCallHandlerProps, ReactionType } from './types';

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

		const originalOnChannelMessage = socketRef.current.onchannelmessage;

		socketRef.current.onchannelmessage = (message: any) => {
			if (originalOnChannelMessage) {
				originalOnChannelMessage(message);
			}

			if (currentChannel?.channel_id === message.channel_id) {
				try {
					const content = typeof message.content === 'string' ? JSON.parse(message.content) : message.content;

					if (content.vr !== ReactionType.VIDEO) return;

					if (content.ej && content.ej.length > 0) {
						const emojiData = content.ej[0];

						const position = generatePosition();

						const newEmoji = {
							id: message.message_id || Date.now().toString(),
							emoji: content.t.trim(),
							emojiId: emojiData.emojiid,
							timestamp: Date.now(),
							position
						};

						setDisplayedEmojis((prev) => [...prev, newEmoji]);

						const durationMs = parseFloat(position.duration) * 1000 + 100;
						setTimeout(() => {
							setDisplayedEmojis((prev) => prev.filter((item) => item.id !== newEmoji.id));
						}, durationMs);
					}
				} catch (error) {
					console.error(error);
				}
			}
		};

		return () => {
			if (socketRef.current) {
				socketRef.current.onchannelmessage = originalOnChannelMessage;
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
