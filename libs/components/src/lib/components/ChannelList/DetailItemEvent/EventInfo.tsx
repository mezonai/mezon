import { EventManagementEntity, selectChannelById, selectCurrentClan, selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { timeFomat } from '../EventChannelModal/timeFomatEvent';

type EventInfoDetailProps = {
	event: EventManagementEntity | null;
};

const EventInfoDetail = (props: EventInfoDetailProps) => {
	const { event } = props;

	const channelVoice = useAppSelector((state) => selectChannelById(state, event?.channel_id ?? '')) || {};

	const currentClan = useSelector(selectCurrentClan);
	const userCreate = useSelector(selectMemberClanByUserId(event?.creator_id || ''));
	const time = useMemo(() => timeFomat(event?.start_time || ''), [event?.start_time]);

	return (
		<div className="px-4 py-8 space-y-2 dark:text-zinc-400 text-colorTextLightMode max-h-[370px] h-fit hide-scrollbar overflow-auto">
			<h4 className="font-semibold inline-flex gap-x-3">
				<Icons.IconEvents />
				{time}
			</h4>
			<p className="font-bold dark:text-white text-black text-lg">{event?.title}</p>
			<div className="flex items-center gap-x-3">
				<img src={currentClan?.logo} alt={currentClan?.clan_name} className="size-5 rounded-full" />
				<p className="hover:underline">{currentClan?.clan_name}</p>
			</div>
			<div className="flex items-center gap-x-3 ">
				{event?.channel_id === '0' ? (
					<>
						<Icons.Location />
						<p>{event?.address}</p>
					</>
				) : (
					<>
						<Icons.Speaker />
						<p>{channelVoice?.channel_label}</p>
					</>
				)}
			</div>
			<div className="flex items-center gap-x-3">
				<Icons.MemberList />
				<p>1 person is interested</p>
			</div>
			<div className="flex items-center gap-x-3">
				<img src={userCreate?.user?.avatar_url} alt={userCreate?.user?.avatar_url} className="size-5 rounded-full" />
				<p>
					Created by <span className="hover:underline">{userCreate?.user?.username}</span>
				</p>
			</div>
			<div className="break-all">{event?.description}</div>
		</div>
	);
};

export default EventInfoDetail;
