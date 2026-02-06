import React, { memo } from 'react';
import ChannelMessageListener from '../../screens/home/homedrawer/ChannelMessageListener';
import ChannelMessageReactionListener from '../../screens/home/homedrawer/ChannelMessageReactionListener';
import ChannelVoicePopup from '../../screens/home/homedrawer/components/ChannelVoicePopup';
import StreamingWrapper from '../../screens/home/homedrawer/components/StreamingWrapper';

export const ListenerLoader = memo(() => {
	const [showListeners, setShowListeners] = React.useState(false);

	React.useEffect(() => {
		const timer = setTimeout(() => {
			setShowListeners(true);
		}, 1000);

		return () => clearTimeout(timer);
	}, []);
	if (!showListeners) return null;
	return (
		<>
			<StreamingWrapper />
			<ChannelVoicePopup />
			<ChannelMessageListener />
			<ChannelMessageReactionListener />
		</>
	);
});
