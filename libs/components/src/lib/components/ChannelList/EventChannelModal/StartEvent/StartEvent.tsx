import { useEscapeKeyClose, useEventManagementQuantity } from '@mezon/core';
import { selectShowModelDetailEvent } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ListEventManagement from './ListEventManagement';

type StartEventModalProps = {
	onClose: () => void;
	onOpenCreate: () => void;
	onEventUpdateId: (eventId: string) => void;
};

export const StartEventModal = (props: StartEventModalProps) => {
	const { onClose, onOpenCreate, onEventUpdateId } = props;
	const { numberEventManagement, eventsByUser } = useEventManagementQuantity();
	const { t } = useTranslation(['eventCreator']);
	const modalRef = useRef<HTMLDivElement>(null);
	const showModalDetailEvent = useSelector(selectShowModelDetailEvent);
	useEscapeKeyClose(modalRef, onClose);

	useEffect(() => {
		if (!showModalDetailEvent && modalRef.current) {
			modalRef.current.focus();
		}
	}, [showModalDetailEvent]);

	return (
		<div ref={modalRef} tabIndex={-1} className="outline-none">
			<div className=" flex justify-between items-center p-4 border-b-theme-primary">
				<div className="flex items-center gap-x-4">
					<div className="gap-x-2 flex items-center">
						<Icons.IconEvents />
						<h4 className="font-bold">
							{numberEventManagement === 0 && t('actions.noEvent')}
							{numberEventManagement === 1 && t('actions.event_one')}
							{numberEventManagement > 1 && t('actions.event_other', { count: numberEventManagement })}
						</h4>
					</div>
					<div className="w-[0.1px] h-4 bg-gray-400"></div>
					<div
						className="btn-primary btn-primary-hover  px-2 py-1 rounded-lg text-white font-medium cursor-pointer"
						onClick={onOpenCreate}
						data-e2e={generateE2eId('clan_page.modal.create_event.button_create')}
					>
						{t('actions.create')}
					</div>
				</div>
				<span
					className="text-5xl leading-3 text-theme-primary-hover cursor-pointer"
					onClick={onClose}
					data-e2e={generateE2eId('clan_page.modal.create_event.button_close')}
				>
					×
				</span>
			</div>

			{eventsByUser.length !== 0 ? (
				<div className=" h-fit min-h-80 max-h-[80vh]  overflow-y-scroll hide-scrollbar p-4 gap-y-4 flex flex-col">
					<ListEventManagement
						allEventManagement={eventsByUser}
						openModelUpdate={onOpenCreate}
						onUpdateEventId={onEventUpdateId}
						onClose={onClose}
					/>
				</div>
			) : (
				<div className="h-80 flex flex-col justify-center items-center text-center px-8">
					<div className="relative mb-4">
						<Icons.IconEvents defaultSize="size-[60px]" />
						<span className="absolute -bottom-2 -left-2 text-yellow-400 text-lg">✦</span>
						<span className="absolute -top-1 -right-3 text-cyan-400 text-xs">✦</span>
						<span className="absolute top-0 right-0 w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
						<span className="absolute -bottom-1 right-2 w-1 h-1 bg-cyan-400 rounded-full"></span>
					</div>
					<h3 className="text-theme-primary-active font-semibold text-lg mb-2">{t('emptyState.title')}</h3>
					<p className="text-theme-primary text-sm mb-1">
						{t('emptyState.description1')} <span className=" text-sm text-theme-primary">{t('emptyState.clan')}</span>.
					</p>
					<p className="text-theme-primary text-sm">{t('emptyState.description2')}</p>
				</div>
			)}
		</div>
	);
};
