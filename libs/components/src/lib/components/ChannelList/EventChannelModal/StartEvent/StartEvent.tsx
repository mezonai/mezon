import { useEscapeKeyClose, useEventManagementQuantity } from '@mezon/core';
import { selectCurrentClanId, selectEventsByClanId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { RefObject } from 'react';
import { useSelector } from 'react-redux';
import ListEventManagement from './ListEventManagement';

type StartEventModalProps = {
	onClose: () => void;
	onOpenCreate: () => void;
	onOpenDetailItem: (status: boolean) => void;
	onEventUpdateId: (eventId: string) => void;
	rootRef: RefObject<HTMLElement>;
};

export const StartEventModal = (props: StartEventModalProps) => {
	const { onClose, onOpenCreate, onOpenDetailItem, onEventUpdateId } = props;
	const { numberEventManagement } = useEventManagementQuantity();
	const currentClanId = useSelector(selectCurrentClanId);
	const allEventManagement = useAppSelector((state) => selectEventsByClanId(state, currentClanId as string));
	useEscapeKeyClose(props.rootRef, onClose);

	return (
		<>
			<div className="dark:bg-[#1E1F22] bg-bgLightModeSecond dark:text-white text-black flex justify-between items-center p-4">
				<div className="flex items-center gap-x-4">
					<div className="gap-x-2 flex items-center">
						<Icons.IconEvents />
						<h4 className="font-bold">
							{numberEventManagement === 0 && 'Events'}
							{numberEventManagement === 1 && '1 Event'}
							{numberEventManagement > 1 && `${numberEventManagement} Events`}
						</h4>
					</div>
					<div className="w-[0.1px] h-4 bg-gray-400"></div>
					<div className="bg-primary px-2 py-1 rounded-md text-white font-medium" onClick={onOpenCreate}>
						Create Event
					</div>
				</div>
				<span className="text-5xl leading-3 dark:hover:text-white hover:text-black" onClick={onClose}>
					×
				</span>
			</div>

			{allEventManagement.length !== 0 ? (
				<div className="dark:bg-[#313339] bg-white h-fit min-h-80 max-h-[80vh]  overflow-y-scroll hide-scrollbar p-4 gap-y-4 flex flex-col">
					<ListEventManagement
						allEventManagement={allEventManagement}
						onOpenDetailItem={onOpenDetailItem}
						openModelUpdate={onOpenCreate}
						onUpdateEventId={onEventUpdateId}
					/>
				</div>
			) : (
				<div className="dark:bg-[#313339] bg-white h-80 flex justify-center items-center">
					<Icons.IconEvents defaultSize="size-[100px] dark:text-contentTertiary text-colorTextLightMode" />
				</div>
			)}
		</>
	);
};
