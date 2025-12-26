import { selectShowModelDetailEvent } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ModalLayout } from '../../../components';
import ModalCreate from './ModalCreate';
import ModalDetailItemEvent from './ModalCreate/modalDetailItemEvent';
import { StartEventModal } from './StartEvent';

export type EventModalProps = {
	onClose: () => void;
};

const EventModal = (props: EventModalProps) => {
	const { onClose } = props;
	const [openModal, setOpenModal] = useState(false);
	const [eventUpdateId, setEventUpdatedId] = useState<string>('');
	const showModalDetailEvent = useSelector(selectShowModelDetailEvent);

	const onEventUpdateId = (id: string) => {
		setEventUpdatedId(id);
	};

	const clearEventId = () => {
		setEventUpdatedId('');
	};
	useEffect(() => {
		setEventUpdatedId(eventUpdateId || '');
	}, [eventUpdateId]);
	return (
		<ModalLayout onClose={onClose}>
			<div className={`relative w-full px-2 sm:px-0 sm:h-auto rounded-lg ${openModal ? 'max-w-[472px]' : 'max-w-[600px]'}`}>
				{!openModal ? (
					<div
						className="rounded-lg text-sm overflow-hidden bg-theme-setting-primary text-theme-primary"
						data-e2e={generateE2eId('clan_page.modal.create_event.start_modal')}
					>
						<StartEventModal onClose={onClose} onOpenCreate={() => setOpenModal(true)} onEventUpdateId={onEventUpdateId} />
					</div>
				) : (
					<div className="rounded-lg text-sm px-2 md:px-0" data-e2e={generateE2eId('clan_page.modal.create_event')}>
						<ModalCreate
							onClose={() => setOpenModal(false)}
							onCloseEventModal={onClose}
							eventId={eventUpdateId}
							clearEventId={clearEventId}
						/>
					</div>
				)}
			</div>
			{showModalDetailEvent && <ModalDetailItemEvent onCloseAll={onClose} />}
		</ModalLayout>
	);
};

export default EventModal;
