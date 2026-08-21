import { selectCurrentUserId, selectMemberClanByUserId, selectVoiceInfo, useAppSelector } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { VoiceInteractiveEvent } from 'mezon-js';
import type { MutableRefObject } from 'react';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { FlowerCelebrationHandle } from './flowerCelebration';
import { attachFlowerCelebration } from './flowerCelebration';

type GiveFlowersVoiceType = {
	senderQueueRef: MutableRefObject<VoiceInteractiveEvent[]>;
	playerRef: MutableRefObject<FlowerCelebrationHandle | null>;
	senderTimeoutRef: MutableRefObject<number | null>;
	isShowingSenderRef: MutableRefObject<boolean>;
	currentSender: VoiceInteractiveEvent | null;
};

export const GiveFlowersVoiceHandle = memo(
	({ currentSender, senderQueueRef, playerRef, senderTimeoutRef, isShowingSenderRef }: GiveFlowersVoiceType) => {
		const canvasRef = useRef<HTMLCanvasElement>(null);

		const { clientRef } = useMezon();
		const voiceInfo = useSelector(selectVoiceInfo);
		const channelId = voiceInfo?.channelId;

		useEffect(() => {
			const currentSocket = clientRef.current;

			if (!currentSocket || !channelId) {
				return;
			}

			const canvas = canvasRef.current;

			if (!canvas) return;

			const player = attachFlowerCelebration(canvas);

			playerRef.current = player;

			return () => {
				player.destroy();
				playerRef.current = null;
				if (senderTimeoutRef.current !== null) {
					clearTimeout(senderTimeoutRef.current);
					senderTimeoutRef.current = null;
				}

				senderQueueRef.current = [];
				isShowingSenderRef.current = false;
			};
		}, []);

		return (
			<div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
				<canvas ref={canvasRef} className="h-full w-full" />

				{currentSender && (
					<div className="pointer-events-none absolute left-1/2 bottom-[70px] z-[41] -translate-x-1/2">
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
	}
);

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
