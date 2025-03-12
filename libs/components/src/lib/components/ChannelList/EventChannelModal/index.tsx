import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import DetailItemEvent from '../DetailItemEvent';
import ModalCreate from './ModalCreate';
import { StartEventModal } from './StartEvent';

export type EventModalProps = {
	onClose: () => void;
	openModalDetail: boolean;
	setOpenModalDetail: Dispatch<SetStateAction<boolean>>;
};

const EventModal = (props: EventModalProps) => {
	const { onClose, openModalDetail, setOpenModalDetail } = props;
	const [openModal, setOpenModal] = useState(false);
	const [eventUpdateId, setEventUpdatedId] = useState<string>('');

	const handleModalDetail = useCallback((status: boolean) => {
		setOpenModalDetail(status);
	}, []);
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
			className="outline-none justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-10 outline-none focus:outline-none bg-black bg-opacity-80 dark:text-white text-black hide-scrollbar overflow-hidden"
		>
			{!openModalDetail ? (
				<div className={`relative w-full sm:h-auto rounded-lg ${openModal ? 'max-w-[472px]' : 'max-w-[600px]'}`}>
					{!openModal ? (
						<div className="rounded-lg text-sm overflow-hidden">
							<StartEventModal
								rootRef={modalRef}
								onClose={onClose}
								onOpenCreate={() => setOpenModal(true)}
								onOpenDetailItem={handleModalDetail}
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
			) : (
				<DetailItemEvent setOpenModalDetail={handleModalDetail} />
			)}
		</div>
	);
};

export default EventModal;
