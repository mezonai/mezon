import { useOnClickOutside } from '@mezon/core';
import { ChannelsEntity } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ButtonCopy } from '@mezon/components';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type ModalShareEventProps = {
	channel: ChannelsEntity;
	setOpenModalShareEvent: React.Dispatch<React.SetStateAction<boolean>>;
	link?: string;
};

const ModalShareEvent = (props: ModalShareEventProps) => {
	const { channel, setOpenModalShareEvent, link } = props;
	const { t } = useTranslation('eventCreator');

	const closeModal = () => {
		setOpenModalShareEvent(false);
	};

	const panelRef = useRef(null);
	const modalRef = useRef<HTMLDivElement>(null);
	useOnClickOutside(panelRef, closeModal);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			closeModal();
		}
	};

	useEffect(() => {
		if (modalRef.current) {
			modalRef.current.focus();
		}
	}, []);

	return (
		<div
			ref={modalRef}
			tabIndex={-1}
			onKeyDown={handleKeyDown}
			className="outline-none w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
		>
			<div
				ref={panelRef}
				className="w-fit h-fit dark:bg-bgPrimary bg-bgLightModeThird rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden"
			>
				<div className="dark:text-white text-black w-[440px] p-4">
					<div className="flex justify-between pb-4 font-bold text-base">
						<h3>{t('eventDetail.inviteFriends')}</h3>
						<button title="Close" onClick={closeModal} className="dark:hover:text-white hover:text-colorTextLightMode transition">
							✕
						</button>
					</div>
					<div className="pb-4 flex gap-x-2">
						<Icons.Speaker />
						<p>{channel.channelLabel}</p>
					</div>
					<p className="pb-4">{t('eventDetail.shareLink')}</p>
					<div className={`flex items-center dark:bg-black bg-gray-300 py-2 px-1 pr-2 rounded-lg border `}>
						<input
							type="text"
							value={link}
							readOnly
							className="bg-transparent dark:text-white text-black flex-1 px-2 outline-none truncate"
						/>
						<ButtonCopy
							copyText={link}
							className={`bg-transparent text-white  py-[6px] px-2 rounded-md text-sm font-medium text-center`}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};
export default ModalShareEvent;
