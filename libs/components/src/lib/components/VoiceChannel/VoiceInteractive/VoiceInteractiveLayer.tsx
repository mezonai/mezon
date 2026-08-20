import { useVoiceInteractiveListener } from '../ControlBar/hooks/useVoiceInteractiveListener';
import { GiveFlowersVoiceHandle } from '../MyVideoConference/Reaction';
import VoiceInteractiveWindow from './VoiceInteractiveWindow';

interface VoiceInteractiveLayerProps {
	channelId?: string;
}

const VoiceInteractiveLayer = ({ channelId }: VoiceInteractiveLayerProps) => {
	const { activeApps, closeApp, currentSender, senderQueueRef, playerRef, isShowingSenderRef, senderTimeoutRef, showNextSender } =
		useVoiceInteractiveListener(channelId);

	return (
		<>
			{activeApps.map((app) => (
				<VoiceInteractiveWindow key={app.id} url={app.url} title={app.title} onClose={() => closeApp(app.id)} />
			))}
			<GiveFlowersVoiceHandle
				currentSender={currentSender}
				playerRef={playerRef}
				isShowingSenderRef={isShowingSenderRef}
				senderTimeoutRef={senderTimeoutRef}
				senderQueueRef={senderQueueRef}
			/>
		</>
	);
};

export default VoiceInteractiveLayer;
