import { useEscapeKeyClose } from '@mezon/core';
import { ContenSubmitEventProps } from '@mezon/utils';
import { useMemo, useRef } from 'react';
import { handleTimeISO } from '../timeFomatEvent';
import ItemEventManagement from './itemEventManagement';

export type ReviewModalProps = {
	contentSubmit: ContenSubmitEventProps;
	option: string;
	onClose: () => void;
};

const ReviewModal = (props: ReviewModalProps) => {
	const { option, contentSubmit, onClose } = props;
	const time = useMemo(() => handleTimeISO(contentSubmit.selectedDateStart, contentSubmit.timeStart), []);
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);
	return (
		<div ref={modalRef} className="dark:text-white text-black">
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
			/>
			<div className="mt-8">
				<h3 className="text-center font-semibold text-xl">Here's a preview of your event.</h3>
				<p className="text-center dark:text-slate-400 text-colorTextLightMode">This event will auto-start when it's time.</p>
			</div>
		</div>
	);
};

export default ReviewModal;
