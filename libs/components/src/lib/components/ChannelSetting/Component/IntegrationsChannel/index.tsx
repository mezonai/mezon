import { fetchWebhooks, useAppDispatch } from '@mezon/store';
import { IChannel } from '@mezon/utils';
import { useEffect } from 'react';
import Integrations from '../../../ClanSettings/Integrations';

interface IIntegrationsChannelProps {
	currentChannel?: IChannel;
}

const IntegrationsChannel = ({ currentChannel }: IIntegrationsChannelProps) => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(fetchWebhooks({ channelId: currentChannel?.channel_id as string, clanId: currentChannel?.clan_id as string }));
	}, []);

	return (
		<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary text-theme-primary  w-1/2 pt-[94px] sbm:pb-7 sbm:pr-[10px] sbm:pl-[40px] p-4 overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar">
			<Integrations currentChannel={currentChannel} />
		</div>
	);
};

export default IntegrationsChannel;
