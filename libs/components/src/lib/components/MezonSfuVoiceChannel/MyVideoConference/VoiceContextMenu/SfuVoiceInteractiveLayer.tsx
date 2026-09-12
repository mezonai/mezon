import { useSfuVoiceInteractiveListener } from '../../ControlBar/hooks/useSfuVoiceInteractiveListener';
import { SfuVoiceInteractiveWindow } from '../../VoiceInteractive/SfuVoiceInteractiveWindow';
import { GiveFlowersVoiceHandle } from '../Reaction';

interface SfuVoiceInteractiveLayerProps {
	channelId?: string;
}

export const SfuVoiceInteractiveLayer = ({ channelId }: SfuVoiceInteractiveLayerProps) => {
	const { activeApps, closeApp, focusApp, currentSender, senderQueueRef, playerRef, isShowingSenderRef, senderTimeoutRef } =
		useSfuVoiceInteractiveListener(channelId);

	return (
		<>
			{activeApps.map((app) => (
				<SfuVoiceInteractiveWindow
					key={app.id}
					url={app.url}
					title={app.title}
					zIndex={app.zIndex}
					onFocus={() => focusApp(app.id)}
					onClose={() => closeApp(app.id)}
				/>
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
