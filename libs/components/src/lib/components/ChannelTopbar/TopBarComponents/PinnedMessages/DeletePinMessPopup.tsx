import { usePinnedSenderDisplay } from '@mezon/core';
import type { PinMessageEntity } from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { NX_CHAT_APP_ANNONYMOUS_USER_ID, TOPBARS_MAX_WIDTH, generateE2eId, getShareContactInfo } from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseProfile from '../../../MemberProfile/BaseProfile';
import MessageAttachment from '../../../MessageWithUser/MessageAttachment';
import { MessageLine } from '../../../MessageWithUser/MessageLine';
import ShareContactCard from '../../../ShareContact/ShareContactCard';
type ModalDeletePinMessProps = {
	pinMessage: PinMessageEntity;
	contentString: string | undefined;
	closeModal: () => void;
	handlePinMessage: () => void;
	attachments: ApiMessageAttachment[];
	modalref?: React.MutableRefObject<HTMLDivElement | null>;
	mode?: number;
};
export const ModalDeletePinMess = (props: ModalDeletePinMessProps) => {
	const { pinMessage, contentString, closeModal, handlePinMessage, attachments, modalref, mode } = props;
	const { t } = useTranslation('channelTopbar');
	const senderId = String(pinMessage.sender_id || '');
	const checkAnonymous = pinMessage?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;
	const { displayName: nameToShow, displayAvatar: avatarToShow } = usePinnedSenderDisplay({
		senderId,
		channelId: String(pinMessage.channel_id || ''),
		mode,
		pinAvatar: pinMessage.avatar,
		pinUsername: pinMessage.username,
		isAnonymous: checkAnonymous
	});

	const messageContentObject = useMemo(() => {
		return safeJSONParse(pinMessage.content || '{}') || {};
	}, [pinMessage.content]);

	const { isShareContact, shareContactEmbed } = useMemo(() => {
		return getShareContactInfo(messageContentObject?.embed);
	}, [messageContentObject]);

	return (
		<div
			ref={modalref}
			className="outline-none w-[100vw] h-[100vh] overflow-hidden fixed top-0 left-0 z-50 bg-black bg-opacity-80 flex flex-row justify-center items-center"
		>
			<div className="w-fit h-fit bg-theme-setting-primary text-theme-primary rounded-lg flex-col justify-start  items-start gap-3 inline-flex overflow-hidden max-w-[440px]">
				<div className="px-4 py-4">
					<h3 className="font-semibold pb-1 text-xl">{t('pinnedMessages.unpinMessage')}</h3>
					<p>{t('pinnedMessages.unpinConfirmation')}</p>
				</div>
				<div className="px-4 pb-2 max-h-[60vh] overflow-y-auto hide-scrollbar w-full">
					<div className="flex items-start gap-2 p-2 shadow-md rounded bg-theme-setting-secondary">
						<div className="flex-shrink-0">
							<BaseProfile avatar={avatarToShow} name={nameToShow} hideIcon={true} hideName={true} isAnonymous={checkAnonymous} />
						</div>
						<div className="flex text-sm flex-col gap-1 text-left flex-1 min-w-0">
							<div className="font-medium">{nameToShow}</div>
							{isShareContact && shareContactEmbed ? (
								<ShareContactCard embed={shareContactEmbed} />
							) : (
								<div className="pointer-events-none [&_.attachment-actions]:!hidden [&_button]:!hidden">
									{contentString && (
										<MessageLine
											isEditted={false}
											isJumMessageEnabled={false}
											isTokenClickAble={false}
											content={messageContentObject}
											isAnonymous={checkAnonymous}
											isInPinMsg={true}
											messageId={pinMessage.message_id}
											isSearchMessage={true}
										/>
									)}

									{attachments && (
										<MessageAttachment
											mode={ChannelStreamMode.STREAM_MODE_CHANNEL}
											message={{ ...pinMessage, attachments } as IMessageWithUser}
											defaultMaxWidth={TOPBARS_MAX_WIDTH}
										/>
									)}
								</div>
							)}
						</div>
					</div>
				</div>
				<div className="w-full bg-theme-setting-primary p-4 flex justify-end gap-x-4">
					<button
						onClick={closeModal}
						data-e2e={generateE2eId('modal.unpin_message.button.cancel')}
						className="px-4 py-2 hover:underline rounded"
					>
						{t('pinnedMessages.cancel')}
					</button>
					<button
						onClick={() => {
							handlePinMessage();
							closeModal();
						}}
						data-e2e={generateE2eId('modal.unpin_message.button.unpin')}
						className="px-4 py-2 hover:bg-opacity-85 rounded bg-[#DA363C] text-white font-medium"
					>
						{t('pinnedMessages.unpinIt')}
					</button>
				</div>
			</div>
		</div>
	);
};
