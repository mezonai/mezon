import { EventManagementEntity, selectAllTextChannel } from '@mezon/store';
import { OptionEvent } from '@mezon/utils';
import { useSelector } from 'react-redux';
import ItemEventManagement from '../ModalCreate/itemEventManagement';

type ListEventManagementProps = {
	allEventManagement: EventManagementEntity[];
	onOpenDetailItem: (status: boolean) => void;
	openModelUpdate: () => void;
	onUpdateEventId: (id: string) => void;
	onClose: () => void;
};

const ListEventManagement = (props: ListEventManagementProps) => {
	const { allEventManagement, onOpenDetailItem, openModelUpdate, onUpdateEventId, onClose } = props;
	const allThreadChannelPrivate = useSelector(selectAllTextChannel);
	const allThreadChannelPrivateIds = allThreadChannelPrivate.map((channel) => channel.channel_id);

	return allEventManagement
		.filter((event) => !event.channel_id || event.channel_id === '0' || allThreadChannelPrivateIds.includes(event.channel_id))
		.map((event, index) => {
			return (
				<div key={index}>
					<ItemEventManagement
						topic={event.title || ''}
						voiceChannel={event.channel_voice_id || ''}
						titleEvent={event.title || ''}
						address={event.address}
						option={event.address ? OptionEvent.OPTION_LOCATION : OptionEvent.OPTION_SPEAKER}
						logoRight={event.logo}
						start={event.start_time || ''}
						end={event.end_time || ''}
						event={event}
						setOpenModalDetail={onOpenDetailItem}
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
