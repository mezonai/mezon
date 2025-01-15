import { useSFU, useWebRTC } from '@mezon/components';
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
	const { setClanId, setChannelId } = useWebRTC();
	const { startJoinSFU } = useSFU();

	return appChannel?.url ? (
		<div
			onLoad={() => {
				setClanId(appChannel.clan_id || '');
				setChannelId(appChannel.channel_id || '');
				startJoinSFU();
			}}
			onContextMenu={(e) => e.preventDefault()}
		>
			<iframe ref={miniAppRef} title={appChannel?.url} src={`${appChannel?.url}#${miniAppDataHash}`} className="w-full h-full"></iframe>
		</div>
	) : (
		<div className="w-full h-full flex items-center justify-center">
			<Loading />
		</div>
	);
}
