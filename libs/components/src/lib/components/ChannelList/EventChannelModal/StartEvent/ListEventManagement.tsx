import type { EventManagementEntity } from '@mezon/store';
import { selectAllAccount, selectAllTextChannel } from '@mezon/store';
import { OptionEvent, generateE2eId } from '@mezon/utils';
import { useSelector } from 'react-redux';
import ItemEventManagement from '../ModalCreate/itemEventManagement';

type ListEventManagementProps = {
	allEventManagement: EventManagementEntity[];
	openModelUpdate: () => void;
	onUpdateEventId: (id: string) => void;
	onClose: () => void;
};

const ListEventManagement = (props: ListEventManagementProps) => {
	const { allEventManagement, openModelUpdate, onUpdateEventId, onClose } = props;
	const allThreadChannelPrivate = useSelector(selectAllTextChannel);
	const userId = useSelector(selectAllAccount)?.user?.id;

	const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel.channel_id);
	return allEventManagement
		.filter(
			(event) =>
				(!event?.is_private || event.creator_id === userId) &&
				(!event.channel_id || event.channel_id === '0' || allThreadChannelPrivateIds.includes(event.channel_id))
		)
		.map((event, index) => {
			return (
				<div key={index} data-e2e={generateE2eId('clan_page.modal.create_event.event_management.item')}>
					<ItemEventManagement
						topic={event.title || ''}
						voiceChannel={event.channel_voice_id || ''}
						titleEvent={event.title || ''}
						address={event.address}
						option={event.address ? OptionEvent.OPTION_LOCATION : OptionEvent.OPTION_SPEAKER}
						logoRight={event.logo}
						event={event}
						createTime={event.create_time}
						openModelUpdate={openModelUpdate}
						onEventUpdateId={onUpdateEventId}
						textChannelId={event.channel_id}
						onClose={onClose}
					/>
				</div>
			);
		});
};

export default ListEventManagement;
