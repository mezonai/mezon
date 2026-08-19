import { useVoiceInteractiveListener } from '../ControlBar/hooks/useVoiceInteractiveListener';
import VoiceInteractiveWindow from './VoiceInteractiveWindow';

interface VoiceInteractiveLayerProps {
	channelId?: string;
}

const VoiceInteractiveLayer = ({ channelId }: VoiceInteractiveLayerProps) => {
	const { activeApps, closeApp } = useVoiceInteractiveListener(channelId);

	return (
		<>
			{activeApps.map((app) => (
				<VoiceInteractiveWindow key={app.id} url={app.url} title={app.title} onClose={() => closeApp(app.id)} />
			))}
		</>
	);
};

export default VoiceInteractiveLayer;
