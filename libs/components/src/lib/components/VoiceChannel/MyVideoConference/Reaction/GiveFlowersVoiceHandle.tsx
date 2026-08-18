import { EVoiceInteractEvent, selectCurrentUserId, selectMemberClanByUserId, selectVoiceInfo, useAppSelector } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { VoiceInteractiveEvent } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { FlowerCelebrationHandle } from './flowerCelebration';
import { attachFlowerCelebration } from './flowerCelebration';

export const GiveFlowersVoiceHandle = memo(() => {
	const [currentSender, setCurrentSender] = useState<VoiceInteractiveEvent | null>(null);

	const senderQueueRef = useRef<VoiceInteractiveEvent[]>([]);
	const senderTimeoutRef = useRef<number | null>(null);
	const isShowingSenderRef = useRef(false);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const playerRef = useRef<FlowerCelebrationHandle | null>(null);

	const { clientRef } = useMezon();
	const voiceInfo = useSelector(selectVoiceInfo);
	const channelId = voiceInfo?.channelId;

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
		const canvas = canvasRef.current;

		if (!canvas) return;

		const player = attachFlowerCelebration(canvas);

		playerRef.current = player;

		return () => {
			player.destroy();
			playerRef.current = null;
		};
	}, []);

	useEffect(() => {
		const currentSocket = clientRef.current;

		if (!currentSocket || !channelId) {
			return;
		}

		currentSocket.onvoiceinteractiveevent = (event: VoiceInteractiveEvent) => {
			if (event.voice_channel_id !== channelId || event.event_type !== EVoiceInteractEvent.SENT_FLOWERS) {
				return;
			}

			playerRef.current?.play();
			senderQueueRef.current.push(event);
			showNextSender();
		};

		return () => {
			if (senderTimeoutRef.current !== null) {
				clearTimeout(senderTimeoutRef.current);
				senderTimeoutRef.current = null;
			}

			senderQueueRef.current = [];
			isShowingSenderRef.current = false;

			if (currentSocket?.onvoiceinteractiveevent) {
				currentSocket.onvoiceinteractiveevent = () => {};
			}
		};
	}, [clientRef, channelId, showNextSender]);

	return (
		<div className="pointer-events-none fixed inset-0 z-[999999]">
			<canvas ref={canvasRef} className="h-full w-full" />

			{currentSender && (
				<div
					className="
					pointer-events-none
					fixed
					left-1/2
					bottom-[70px]
					z-[1000000]"
				>
					<div
						className="
						rounded-full
						bg-black
						px-3
						py-2
						text-sm
						text-white
						shadow-[0_4px_12px_rgba(255,255,255,0.3)]
						w-full
					"
					>
						<FlowerDetail event={currentSender} />
					</div>
				</div>
			)}
		</div>
	);
});

const FlowerDetail = ({ event }: { event: VoiceInteractiveEvent }) => {
	const { t } = useTranslation('token');
	const currentUserId = useAppSelector((state) => selectCurrentUserId(state));

	const sender = useAppSelector((state) => selectMemberClanByUserId(state, event.sender_id));
	const receiver = useAppSelector((state) => selectMemberClanByUserId(state, event.receiver_id));

	if (currentUserId === receiver?.id) {
		return (
			<div className="flex gap-1">
				<p>{t('flowers.received')}</p>
				{sender?.clan_nick || sender?.prioritizeName || sender?.user?.display_name || sender?.user?.username}
			</div>
		);
	}

	return (
		<div className="flex gap-1">
			{sender?.clan_nick || sender?.prioritizeName || sender?.user?.display_name || sender?.user?.username}
			<p>{t('flowers.someoneReceived')}</p>
			{receiver?.clan_nick || receiver?.prioritizeName || receiver?.user?.display_name || receiver?.user?.username}
		</div>
	);
};
