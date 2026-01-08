import { fetchWebhooks, useAppDispatch } from '@mezon/store';
import type { IChannel } from '@mezon/utils';
import { useEffect } from 'react';
import Integrations from '../../../ClanSettings/Integrations';

interface IIntegrationsChannelProps {
	currentChannel?: IChannel;
	menuIsOpen?: boolean;
}

const IntegrationsChannel = ({ currentChannel, menuIsOpen }: IIntegrationsChannelProps) => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(fetchWebhooks({ channelId: currentChannel?.channelId as string, clanId: currentChannel?.clanId as string }));
	}, []);

	return (
		<div
			className={`overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary text-theme-primary  w-1/2 pt-[94px] sbm:pb-7 sbm:pr-[10px] sbm:pl-[40px] p-4 overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar ${!menuIsOpen ? 'sbm:pt-[94px] pt-[70px]' : 'pt-[94px]'}`}
		>
			<Integrations />
		</div>
	);
};

export default IntegrationsChannel;
