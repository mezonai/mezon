import { useEscapeKeyClose } from '@mezon/core';
import { ChannelStatusEnum, IChannel } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useRef } from 'react';
import Button from '../Button';
import { Hashtag, HashtagLocked, Speaker, SpeakerLocked } from '../Icons';

export type ModalProps = {
	children: React.ReactNode;
	showModal: boolean;
	title?: string;
	onClose: () => void;
	confirmButton?: () => void;
	classNameBox?: string;
	subTitleBox?: string;
	classSubTitleBox?: string;
	borderBottomTitle?: string;
	classNameWrapperChild?: string;
	hasChannel?: IChannel;
	isInviteModal?: boolean;
	className?: string;
	classNameHeader?: string
};

const Modal = (props: ModalProps) => {
	const {
		showModal,
		onClose,
		confirmButton,
		title,
		children,
		classNameBox,
		subTitleBox,
		classSubTitleBox,
		classNameWrapperChild,
		hasChannel,
		isInviteModal,
		classNameHeader
	} = props;
	const modalRef = useRef<HTMLDivElement>(null);
	useEscapeKeyClose(modalRef, onClose);

	const handleConfirmClick = async () => {
		if (confirmButton) {
			await confirmButton();
		}
		onClose();
	};
	return (
		showModal && (
			<>
				<div
					ref={modalRef}
					tabIndex={-1}
					className="justify-center items-center flex overflow-x-hidden overflow-y-auto  fixed inset-0 z-50 outline-none focus:outline-none text-theme-primary hide-scrollbar overflow-hidden"
				>
					<div className="fixed inset-0 bg-black opacity-80"></div>
					<div className={`relative w-full ${isInviteModal ? 'max-w-[480px]' : 'max-w-[684px]'} sm:h-auto ${classNameBox}`}>
						<div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-theme-setting-primary outline-none focus:outline-none h-full sm:h-auto">
							<div className={`flex items-start justify-between p-4 border-b-theme-primary rounded-t ${classNameHeader} `}>
								<div>
									<h3 className="text-[22px] font-semibold text-theme-primary-active cursor-default ">{title}</h3>
									{hasChannel && (
										<div className="inline-flex gap-x-2">
											{hasChannel.channel_private === ChannelStatusEnum.isPrivate &&
												hasChannel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE && <SpeakerLocked defaultSize="w-5 h-5" />}
											{hasChannel.channel_private === ChannelStatusEnum.isPrivate &&
												hasChannel.type === ChannelType.CHANNEL_TYPE_CHANNEL && <HashtagLocked defaultSize="w-5 h-5 " />}
											{hasChannel.channel_private === undefined && hasChannel.type === ChannelType.CHANNEL_TYPE_GMEET_VOICE && (
												<Speaker defaultSize="w-5 5-5" />
											)}
											{hasChannel.channel_private === undefined && hasChannel.type === ChannelType.CHANNEL_TYPE_CHANNEL && (
												<Hashtag defaultSize="w-5 h-5" />
											)}
											<p>{hasChannel.channel_label}</p>
										</div>
									)}
									<p className={`${classSubTitleBox}`}>{subTitleBox}</p>
								</div>
								<Button
									className="flex items-center rounded-full aspect-square h-6 text-5xl leading-3 justify-center opacity-50 text-theme-primary-hover "
									onClick={onClose}
								>
									×
								</Button>
							</div>

							{/*body*/}
							<div className="relative px-5 py-4 flex-auto bg-transparent max-h-[500px] overflow-auto hide-scrollbar">
								<div className={`${classNameWrapperChild}`}>{children}</div>
							</div>
							{/*footer*/}
						</div>
					</div>
				</div>
				<div className="opacity-25 fixed inset-0 z-40 "></div>
			</>
		)
	);
};

export default Modal;
