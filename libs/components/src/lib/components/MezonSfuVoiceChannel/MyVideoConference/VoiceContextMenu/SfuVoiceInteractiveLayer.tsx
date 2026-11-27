import { useSfuVoiceInteractiveListener } from '../../ControlBar/hooks/useSfuVoiceInteractiveListener';
import { GiveFlowersVoiceHandle } from '../Reaction';

interface SfuVoiceInteractiveLayerProps {
	channelId?: string;
	sinkId?: string;
}

export const SfuVoiceInteractiveLayer = ({ channelId, sinkId }: SfuVoiceInteractiveLayerProps) => {
	const { currentSender, senderQueueRef, playerRef, isShowingSenderRef, senderTimeoutRef } = useSfuVoiceInteractiveListener(channelId, sinkId);
	return (
		<GiveFlowersVoiceHandle
			currentSender={currentSender}
			playerRef={playerRef}
			isShowingSenderRef={isShowingSenderRef}
			senderTimeoutRef={senderTimeoutRef}
			senderQueueRef={senderQueueRef}
		/>
	);
};
