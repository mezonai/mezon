import { EVoiceInteractEvent } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { VoiceInteractiveEvent } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlowerCelebrationHandle } from '../../../VoiceChannel/MyVideoConference/Reaction/flowerCelebration';
import { GiveFlowersVoiceHandle } from '../Reaction';

interface SfuVoiceInteractiveLayerProps {
	channelId: string;
}

export const SfuVoiceInteractiveLayer = ({ channelId }: SfuVoiceInteractiveLayerProps) => {
	const { clientRef } = useMezon();
	const senderQueueRef = useRef<VoiceInteractiveEvent[]>([]);
	const playerRef = useRef<FlowerCelebrationHandle | null>(null);
	const senderTimeoutRef = useRef<number | null>(null);
	const isShowingSenderRef = useRef(false);
	const [currentSender, setCurrentSender] = useState<VoiceInteractiveEvent | null>(null);

	const showNextSender = useCallback(() => {
		if (isShowingSenderRef.current) return;
		const event = senderQueueRef.current.shift();
		if (!event) {
			setCurrentSender(null);
			return;
		}

		isShowingSenderRef.current = true;
		setCurrentSender(event);
		senderTimeoutRef.current = window.setTimeout(() => {
			senderTimeoutRef.current = null;
			isShowingSenderRef.current = false;
			setCurrentSender(null);
			showNextSender();
		}, 2000);
	}, []);

	useEffect(() => {
		let activeSocket: typeof clientRef.current;
		let activeHandler: ((event: VoiceInteractiveEvent) => void) | undefined;

		const attachListener = () => {
			const socket = clientRef.current;
			if (!socket || (socket === activeSocket && socket.onvoiceinteractiveevent === activeHandler)) return;
			if (activeSocket && activeHandler && activeSocket.onvoiceinteractiveevent === activeHandler) {
				activeSocket.onvoiceinteractiveevent = () => undefined;
			}

			const handler = (event: VoiceInteractiveEvent) => {
				if (event.voice_channel_id !== channelId || event.event_type !== EVoiceInteractEvent.SENT_FLOWERS) return;
				playerRef.current?.play();
				senderQueueRef.current.push(event);
				showNextSender();
			};

			socket.onvoiceinteractiveevent = handler;
			activeSocket = socket;
			activeHandler = handler;
		};

		attachListener();
		const intervalId = window.setInterval(attachListener, 500);
		return () => {
			window.clearInterval(intervalId);
			if (activeSocket && activeHandler && activeSocket.onvoiceinteractiveevent === activeHandler) {
				activeSocket.onvoiceinteractiveevent = () => undefined;
			}
		};
	}, [channelId, clientRef, showNextSender]);

	useEffect(() => {
		const handleFlowerReaction = (rawEvent: Event) => {
			const event = (rawEvent as CustomEvent<VoiceInteractiveEvent>).detail;
			if (event.voice_channel_id !== channelId) return;
			playerRef.current?.play();
			senderQueueRef.current.push(event);
			showNextSender();
		};
		window.addEventListener('mezon-sfu-flower', handleFlowerReaction);
		return () => window.removeEventListener('mezon-sfu-flower', handleFlowerReaction);
	}, [channelId, showNextSender]);

	return (
		<GiveFlowersVoiceHandle
			currentSender={currentSender}
			containerClassName="absolute inset-0"
			playerRef={playerRef}
			isShowingSenderRef={isShowingSenderRef}
			senderTimeoutRef={senderTimeoutRef}
			senderQueueRef={senderQueueRef}
		/>
	);
};
