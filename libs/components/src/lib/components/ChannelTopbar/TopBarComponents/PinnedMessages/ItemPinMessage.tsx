import { useGetPriorityNameFromUserClan } from '@mezon/core';
import type { PinMessageEntity } from '@mezon/store';
import {
	appActions,
	messagesActions,
	selectCurrentClanId,
	selectIsShowCanvas,
	selectMessageByMessageId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { convertTimeString, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode, decodeAttachments, safeJSONParse } from 'mezon-js';
import type { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { UnpinMessageObject } from '.';
import BaseProfile from '../../../MemberProfile/BaseProfile';
import MessageAttachment from '../../../MessageWithUser/MessageAttachment';
import { MessageLine } from '../../../MessageWithUser/MessageLine';

type ItemPinMessageProps = {
	pinMessage: PinMessageEntity;
	contentString: string | undefined;
	handleUnPinMessage: (unpinValue: UnpinMessageObject) => void;
	onClose: () => void;
	mode?: number;
};

const ItemPinMessage = (props: ItemPinMessageProps) => {
	const { t } = useTranslation('channelTopbar');
	const { pinMessage, contentString, handleUnPinMessage, onClose, mode } = props;

	const getValidCreateTime = () => {
		if (pinMessage?.create_time) return pinMessage.create_time;
		if (pinMessage?.create_time_seconds) return new Date(pinMessage.create_time_seconds * 1000).toISOString();
		return new Date().toISOString();
	};
	const isShowCanvas = useSelector(selectIsShowCanvas);

	const validCreateTime = getValidCreateTime();
	const messageTime = convertTimeString(validCreateTime);
	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(pinMessage.sender_id || '');
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const message = useAppSelector((state) => selectMessageByMessageId(state, pinMessage?.channel_id, pinMessage?.message_id as string));
	const pinMessageAttachments = message?.attachments || pinMessage?.attachment;
	const handleJumpMess = () => {
		if (pinMessage.message_id && pinMessage.channel_id) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: currentClanId || '0',
					messageId: pinMessage.message_id,
					channelId: pinMessage.channel_id
				})
			);
		}

		if (isShowCanvas) {
			dispatch(appActions.setIsShowCanvas(false));
		}
		onClose();
	};
	const messageContentObject = useMemo(() => {
		try {
			return safeJSONParse(pinMessage.content || '{}') || {};
		} catch (e) {
			console.error({ e });
		}
		return {};
	}, [pinMessage.content]);

	const handleUnpinConfirm = () => {
		handleUnPinMessage({
			pinMessage,
			contentString: contentString || '',
			attachments: message?.attachments ? message?.attachments : []
		});
	};

	const avatarToShow =
		(mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL ? priorityAvatar : pinMessage.avatar) || '';
	const nameToShow =
		(mode === ChannelStreamMode.STREAM_MODE_THREAD || mode === ChannelStreamMode.STREAM_MODE_CHANNEL ? namePriority : pinMessage.username) || '';
	return (
		<div
			key={pinMessage.id}
			className="relative flex flex-row justify-between  py-3 px-3 mx-2 w-widthPinMess cursor-default rounded overflow-hidden border-theme-primary bg-item-theme group/item-pinMess"
			data-e2e={generateE2eId('common.pin_message')}
		>
			<div className="flex items-start gap-2 w-full ">
				<div className="pointer-events-none">
					<BaseProfile avatar={avatarToShow || ''} name={nameToShow} hideIcon={true} hideName={true} />
				</div>

				<div className="relative flex flex-col gap-1 text-left w-[85%] enableSelectText cursor-text">
					<div className="flex items-center gap-4">
						<div className="font-medium ">{nameToShow}</div>
						<div className=" text-[10px]">{messageTime}</div>
					</div>
					<div className="leading-6">
						{contentString && (
							<MessageLine
								isInPinMsg={true}
								isEditted={false}
								content={messageContentObject}
								isJumMessageEnabled={false}
								isTokenClickAble={false}
								messageId={message?.id}
								isSearchMessage={true} // to correct size youtube emmbed
							/>
						)}
					</div>
					{pinMessageAttachments &&
						(() => {
							let attachmentsList: ApiMessageAttachment[] = [];
							
							if (Array.isArray(pinMessageAttachments)) {
								attachmentsList = pinMessageAttachments.filter((att) => att && Object.keys(att).length > 0);
							} else {
								let attachment: unknown;
								try {
									attachment = decodeAttachments(pinMessageAttachments);
								} catch (error) {
									const parsed = safeJSONParse(pinMessageAttachments.toString());

									//TODO: In case of invalid attachment data like { t: "string" }
									if (parsed?.t) {
										attachment = [];
									} else {
										attachment = parsed?.attachments || parsed || [];
									}
								}

								attachmentsList = Array.isArray(attachment)
									? (attachment as ApiMessageAttachment[]).filter((att) => att && Object.keys(att).length > 0)
									: ((attachment as any)?.attachments as ApiMessageAttachment[])?.filter(
											(att) => att && Object.keys(att).length > 0
										) || [];
							}

							if (attachmentsList.length === 0) return null;

							const attachmentsToRender = [attachmentsList[0]];
							const remainingCount = Math.max(0, attachmentsList.length - 1);

							return (
								<div className="flex items-end gap-1">
									<div className="relative w-[120px] h-[120px] overflow-hidden rounded cursor-default [&_*]:cursor-default [&_*]:hover:!scale-100 [&_*]:hover:!bg-transparent [&_*]:hover:!opacity-100">
										<div className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_img]:w-full [&_img]:h-full [&_img]:object-cover [&_div]:w-full [&_div]:h-full">
											<MessageAttachment
												mode={mode as ChannelStreamMode}
												message={
													{
														...pinMessage,
														...message,
														attachments: attachmentsToRender,
														create_time: validCreateTime,
														sender_id: pinMessage.sender_id,
														message_id: pinMessage.message_id
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
							);
						})()}
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
				return <img src={attach.url} className={`${gridClass?.classGridChild}`} key={attach.url} />;
			})}
		</div>
	);
};

export default ItemPinMessage;
