import { Loading } from '@mezon/ui';
import { ApiChannelAppResponse } from 'mezon-js/api.gen';
import { RefObject } from 'react';

export function ChannelApps({
	appChannel,
	miniAppRef,
	miniAppDataHash
}: {
	appChannel: ApiChannelAppResponse;
	miniAppRef: RefObject<HTMLIFrameElement>;
	miniAppDataHash: string;
}) {
	// const { setClanId, setChannelId, startLocalStream } = useWebRTC();

	// useEffect(() => {
	// 	if (appChannel) {
	// 		setClanId(appChannel.clan_id || '');
	// 		setChannelId(appChannel.channel_id || '');

	// 		startLocalStream().catch((err) => {
	// 			console.error('Failed to start local WebRTC stream:', err);
	// 		});
	// 	}
	// }, [appChannel, setClanId, setChannelId, startLocalStream]);

	return appChannel?.url ? (
		<iframe ref={miniAppRef} title={appChannel?.url} src={`${appChannel?.url}#${miniAppDataHash}`} className="w-full h-full"></iframe>
	) : (
		<div className="w-full h-full flex items-center justify-center">
			<Loading />
		</div>
	);
}
