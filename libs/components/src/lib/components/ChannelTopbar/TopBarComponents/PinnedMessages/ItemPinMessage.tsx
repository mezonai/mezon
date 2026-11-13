import { usePinnedSenderDisplay } from '@mezon/core';
import type { PinMessageEntity } from '@mezon/store';
import {
	appActions,
	messagesActions,
	selectCurrentClanId,
	selectIsShowCanvas,
	selectMemberClanByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import {
	NX_CHAT_APP_ANNONYMOUS_USER_ID,
	convertTimeString,
	convertTimestampToTimeRemainingI18n,
	generateE2eId,
	getShareContactInfo,
	isImageFileType,
	isVideoFileType
} from '@mezon/utils';
import type { ApiMessageAttachment } from 'mezon-js';
import { ChannelStreamMode, decodeAttachments, safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { UnpinMessageObject } from '.';
import BaseProfile from '../../../MemberProfile/BaseProfile';
import MessageAttachment from '../../../MessageWithUser/MessageAttachment';
import { MessageLine } from '../../../MessageWithUser/MessageLine';
import { PollMessage } from '../../../MessageWithUser/PollMessage';
import ShareContactCard from '../../../ShareContact/ShareContactCard';
type ItemPinMessageProps = {
	pinMessage: PinMessageEntity;
	contentString: string | undefined;
	handleUnPinMessage: (unpinValue: UnpinMessageObject) => void;
	onClose: () => void;
	mode?: number;
};

const getPinAttachments = (rawAttachments: unknown): ApiMessageAttachment[] => {
	if (Array.isArray(rawAttachments)) {
		return rawAttachments.filter((att): att is ApiMessageAttachment => !!att && typeof att === 'object' && Object.keys(att).length > 0);
	}
	if (!rawAttachments) return [];

	let decoded: unknown;
	try {
		decoded = decodeAttachments(rawAttachments as Parameters<typeof decodeAttachments>[0]);
	} catch {
		const parsed = safeJSONParse(String(rawAttachments));
		decoded = parsed?.t ? [] : parsed?.attachments || parsed || [];
	}

	const attachments = Array.isArray(decoded)
		? decoded
		: decoded && typeof decoded === 'object'
			? (decoded as { attachments?: unknown }).attachments
			: [];
	return Array.isArray(attachments)
		? attachments.filter((att): att is ApiMessageAttachment => !!att && typeof att === 'object' && Object.keys(att).length > 0)
		: [];
};

const ItemPinMessage = (props: ItemPinMessageProps) => {
	const { t } = useTranslation('channelTopbar');
	const { pinMessage, contentString, handleUnPinMessage, onClose, mode } = props;
	const senderId = String(pinMessage.sender_id || '');
	const checkAnonymous = pinMessage?.sender_id === NX_CHAT_APP_ANNONYMOUS_USER_ID;

	const isShowCanvas = useSelector(selectIsShowCanvas);
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const clanUser = useAppSelector((state) => selectMemberClanByUserId(state, pinMessage.sender_id || ''));
	const messageContentObject = useMemo(() => {
		try {
			return safeJSONParse(pinMessage.content || '{}') || {};
		} catch (e) {
			console.error({ e });
		}
		return {};
	}, [pinMessage.content]);
	const validCreateTime = useMemo(() => {
		const createTimeSeconds = pinMessage?.create_time_seconds;
		if (createTimeSeconds) return new Date(createTimeSeconds * 1000).toISOString();
		return '';
	}, [pinMessage?.create_time_seconds]);
	const messageTime = validCreateTime ? convertTimeString(validCreateTime) : '';

	const { displayName: nameToShow, displayAvatar: avatarToShow } = usePinnedSenderDisplay({
		senderId,
		channelId: String(pinMessage?.channel_id || ''),
		mode,
		pinAvatar: clanUser?.clan_avatar || clanUser?.user?.avatar_url || pinMessage.avatar,
		pinUsername: clanUser?.clan_nick || clanUser?.user?.display_name || clanUser?.user?.username || pinMessage.username,
		isAnonymous: checkAnonymous
	});

	const attachmentsList = useMemo(() => getPinAttachments(pinMessage.attachment), [pinMessage.attachment]);
	const firstAttachment = attachmentsList[0];
	const remainingCount = Math.max(0, attachmentsList.length - 1);
	const isImageOrVideo = isImageFileType(firstAttachment?.filetype) || isVideoFileType(firstAttachment?.filetype);
	const pollData = useMemo(() => {
		const contentObj = messageContentObject as Record<string, unknown>;
		if (!contentObj || !('id' in contentObj || 'question' in contentObj || 'answer_counts' in contentObj)) return null;
		return contentObj;
	}, [messageContentObject]);

	const isPollMessage = Boolean(pollData && ('question' in pollData || 'answer_counts' in pollData));

	const pollDuration = useMemo(() => {
		if (!pollData?.expire_at) return '';
		return convertTimestampToTimeRemainingI18n(Number(pollData.expire_at), t);
	}, [pollData?.expire_at, t]);

	const { isShareContact, shareContactEmbed } = useMemo(() => {
		const embeds = messageContentObject?.embed || [];
		return getShareContactInfo(embeds);
	}, [messageContentObject]);

	const handleJumpMess = () => {
		if (pinMessage.message_id && pinMessage.channel_id) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: currentClanId || '0',
					messageId: String(pinMessage.message_id),
					channelId: String(pinMessage.channel_id)
				})
			);
		}

		if (isShowCanvas) {
			dispatch(appActions.setIsShowCanvas(false));
		}
		onClose();
	};

	const handleUnpinConfirm = () => {
		handleUnPinMessage({
			pinMessage,
			contentString: contentString || '',
			attachments: attachmentsList
		});
	};

	return (
		<div
			key={pinMessage.id}
			className="relative flex flex-row justify-between  py-3 px-3 mx-2 w-widthPinMess cursor-default rounded overflow-hidden border-theme-primary bg-item-theme group/item-pinMess"
			data-e2e={generateE2eId('common.pin_message')}
		>
			<div className="flex items-start gap-2 w-full ">
				<div className="pointer-events-none">
					<BaseProfile avatar={avatarToShow || ''} name={nameToShow} hideIcon={true} hideName={true} isAnonymous={checkAnonymous} />
				</div>

				<div className="relative flex flex-col gap-1 text-left w-[85%] enableSelectText cursor-text">
					<div className="flex items-center gap-4">
						<div className="font-medium ">{nameToShow}</div>
						<div className=" text-[10px]">{messageTime}</div>
					</div>
					<div className="leading-6">
						{isShareContact && shareContactEmbed ? (
							<ShareContactCard embed={shareContactEmbed} />
						) : isPollMessage && pollData ? (
							<div className="mt-1">
								<PollMessage
									question={String(pollData.question || '')}
									answers={
										(pollData.answers as Array<string | { label?: string }> | undefined)?.map((a) =>
											typeof a === 'string' ? a : ((a as { label?: string })?.label as string) || ''
										) ?? []
									}
									duration={pollDuration}
									allowMultipleAnswers={pollData.type === 1}
									messageId={String(pinMessage.message_id || '')}
									channelId={String(pinMessage.channel_id || '')}
									interactionDisabled
									isDirect={mode === ChannelStreamMode.STREAM_MODE_DM || mode === ChannelStreamMode.STREAM_MODE_GROUP}
								/>
							</div>
						) : (
							contentString && (
								<MessageLine
									isInPinMsg={true}
									isEditted={false}
									content={messageContentObject}
									isAnonymous={checkAnonymous}
									isJumMessageEnabled={false}
									isTokenClickAble={false}
									messageId={String(pinMessage.message_id || '')}
									isSearchMessage={true}
								/>
							)
						)}
					</div>
					{firstAttachment && (
						<div className="flex items-end gap-1">
							<div
								className={
									isImageOrVideo
										? 'relative w-[120px] h-[120px] overflow-hidden rounded cursor-default [&_*]:cursor-default [&_*]:hover:!scale-100 [&_*]:hover:!bg-transparent [&_*]:hover:!opacity-100'
										: 'relative cursor-default'
								}
							>
								<div
									className={
										isImageOrVideo
											? 'w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_div]:w-full [&_div]:h-full'
											: ''
									}
								>
									<MessageAttachment
										mode={mode as ChannelStreamMode}
										message={
											{
												...pinMessage,
												attachments: [firstAttachment],
												create_time: validCreateTime,
												sender_id: senderId,
												message_id: String(pinMessage.message_id || '0')
											} as unknown as IMessageWithUser
										}
										defaultMaxWidth={50}
									/>
								</div>
							</div>

							{remainingCount > 0 && (
								<div className="bg-theme-setting-primary text-theme-primary text-md px-1.5 py-0.5 rounded-full flex items-center justify-center min-h-[35px] min-w-[35px]">
									+{remainingCount}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			<div className="absolute h-fit flex gap-x-2 items-center opacity-0 right-2 top-2 group-hover/item-pinMess:opacity-100">
				<button
					onClick={handleJumpMess}
					className="text-xs border-theme-primary rounded-lg p-1 h-fit text-theme-primary-hover"
					data-e2e={generateE2eId('common.pin_message.button.jump')}
				>
					{t('tooltips.jump')}
				</button>
				<button
					className=" mr-1 bg-theme-input bg-secondary-button-hover text-theme-primary-hover rounded-full w-6 h-6 items-center justify-center text-[10px] px-3 py-2 flex"
					onClick={handleUnpinConfirm}
					data-e2e={generateE2eId('common.pin_message.button.remove_pin')}
				>
					✕
				</button>
			</div>
		</div>
	);
};

export const ListPinAttachment = ({ attachments }: { attachments: ApiMessageAttachment[] }) => {
	const gridClass = useMemo(() => {
		let classGridParent = '';
		let classGridChild = '';
		if (attachments.length >= 5) {
			classGridParent = `grid-cols-6`;
			if (attachments.length % 3 === 1) {
				classGridChild = `${classGridChild} col-span-2 first:col-span-6`;
			}
			if (attachments.length % 3 === 2) {
				classGridChild = `${classGridChild}col-span-2 first:col-span-3 [&:nth-child(2)]:col-span-3`;
			} else {
				classGridChild = `${classGridChild} col-span-2 `;
			}
			return {
				classGridParent,
				classGridChild
			};
		}
		if (attachments.length < 5) {
			classGridParent = `grid-cols-2`;
			if (attachments.length % 2 === 1) {
				classGridChild = `${classGridChild}col-span-1 first:col-span-2`;
			} else {
				classGridChild = `${classGridChild}col-span-1`;
			}
			return {
				classGridParent,
				classGridChild
			};
		}
	}, [attachments]);
	return (
		<div className={`grid ${gridClass?.classGridParent} gap-1`}>
			{attachments.map((attach) => {
				return <img src={attach.url} alt="" className={`${gridClass?.classGridChild}`} key={attach.url} />;
			})}
		</div>
	);
};

export default ItemPinMessage;
