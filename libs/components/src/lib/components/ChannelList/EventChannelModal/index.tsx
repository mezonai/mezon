import { selectShowModelDetailEvent } from '@mezon/store';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
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

	const modalRef = useRef<HTMLDivElement>(null);
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
		<div
			ref={modalRef}
			tabIndex={-1}
			className={`outline-none  justify-center ${!openModal ? 'items-center' : 'pt-[72px]'}  flex overflow-x-hidden overflow-y-auto fixed inset-0 z-10 outline-none focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden`}
		>
			<div className={`relative w-full sm:h-auto rounded-lg ${openModal ? 'max-w-[472px]' : 'max-w-[600px]'}`}>
				{!openModal ? (
					<div className="rounded-lg text-sm overflow-hidden">
						<StartEventModal
							rootRef={modalRef}
							onClose={onClose}
							onOpenCreate={() => setOpenModal(true)}
							onEventUpdateId={onEventUpdateId}
						/>
					</div>
				) : (
					<div className="rounded-lg text-sm">
						<ModalCreate
							onClose={() => setOpenModal(false)}
							onCloseEventModal={onClose}
							eventId={eventUpdateId}
							clearEventId={clearEventId}
						/>
					</div>
				)}
			</div>
			{showModalDetailEvent && <ModalDetailItemEvent />}
		</div>
	);
};

export default EventModal;
