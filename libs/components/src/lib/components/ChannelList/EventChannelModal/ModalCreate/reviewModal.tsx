import { useEscapeKeyClose } from '@mezon/core';
import { EventManagementEntity } from '@mezon/store';
import { ContenSubmitEventProps } from '@mezon/utils';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { handleTimeISO } from '../timeFomatEvent';
import ItemEventManagement from './itemEventManagement';

export type ReviewModalProps = {
	contentSubmit: ContenSubmitEventProps;
	option: string;
	onClose: () => void;
	event?: EventManagementEntity | undefined;
};

const ReviewModal = (props: ReviewModalProps) => {
	const { option, contentSubmit, onClose, event } = props;
	const { t } = useTranslation('eventCreator');
	const time = useMemo(() => handleTimeISO(contentSubmit.selectedDateStart, contentSubmit.timeStart), []);
	const modalRef = useRef<HTMLDivElement>(null);

	useEscapeKeyClose(modalRef, onClose);
	return (
		<div ref={modalRef} className="">
			<ItemEventManagement
				topic={contentSubmit.topic}
				voiceChannel={contentSubmit.voiceChannel || ''}
				titleEvent={contentSubmit.address || ''}
				option={option}
				logo={contentSubmit.logo}
				start={time}
				isReviewEvent
				reviewDescription={contentSubmit.description}
				textChannelId={contentSubmit?.textChannelId}
				address={contentSubmit?.address}
				onClose={onClose}
				isPrivate={contentSubmit.isPrivate}
				event={event}
			/>
			<div className="mt-8">
				<h3 className="text-center font-semibold text-xl">{t('screens.eventPreview.title')}</h3>
				<p className="text-center ">{t('screens.eventPreview.subtitle')}</p>
			</div>
		</div>
	);
};

export default ReviewModal;
