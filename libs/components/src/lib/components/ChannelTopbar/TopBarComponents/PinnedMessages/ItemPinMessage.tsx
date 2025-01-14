import { useGetPriorityNameFromUserClan } from '@mezon/core';
import {
	PinMessageEntity,
	messagesActions,
	pinMessageActions,
	selectCurrentClanId,
	selectMessageByMessageId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { convertTimeString } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import { ApiMessageAttachment } from 'mezon-js/api.gen';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { UnpinMessageObject } from '.';
import { MemberProfile } from '../../../MemberProfile';
import { MessageLine } from '../../../MessageWithUser/MessageLine';

type ItemPinMessageProps = {
	pinMessage: PinMessageEntity;
	contentString: string | undefined;
	handleUnPinMessage: (unpinValue: UnpinMessageObject) => void;
	onClose: () => void;
};

const ItemPinMessage = (props: ItemPinMessageProps) => {
	const { pinMessage, contentString, handleUnPinMessage, onClose } = props;
	const messageTime = convertTimeString(pinMessage?.create_time as string);
	const { priorityAvatar, namePriority } = useGetPriorityNameFromUserClan(pinMessage.sender_id || '');
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();

	const handleJumpMess = () => {
		dispatch(pinMessageActions.setJumpPinMessageId(pinMessage.message_id));
		onClose();

		if (pinMessage.message_id && pinMessage.channel_id) {
			dispatch(
				messagesActions.jumpToMessage({
					clanId: currentClanId || '',
					messageId: pinMessage.message_id ?? '',
					channelId: pinMessage.channel_id ?? ''
				})
			);
		}
	};
	const message = useAppSelector((state) => selectMessageByMessageId(state, pinMessage?.channel_id, pinMessage?.message_id as string));
	const messageContentObject = useMemo(() => {
		try {
			return safeJSONParse(pinMessage.content || '{}');
		} catch (e) {
			console.error({ e });
		}
		return {};
	}, [pinMessage.content]);

	const handleUnpinConfirm = () => {
		handleUnPinMessage({
			pinMessage: pinMessage,
			contentString: contentString || '',
			attachments: message?.attachments ? message?.attachments : []
		});
	};

	return (
		<div
			key={pinMessage.id}
			className="relative flex flex-row justify-between dark:bg-bgPrimary bg-white dark: py-3 px-3 mx-2 w-widthPinMess cursor-default rounded overflow-hidden border dark:border-bgTertiary border-gray-300 group/item-pinMess"
		>
			<div className="flex items-start gap-2 w-full cursor-default ">
				<div className="pointer-events-none">
					{' '}
					<MemberProfile
						isHideUserName={true}
						avatar={priorityAvatar ? priorityAvatar : pinMessage.avatar || ''}
						name={namePriority ? namePriority : pinMessage.username || ''}
						isHideStatus={true}
						isHideIconStatus={true}
						textColor="#fff"
					/>
				</div>

				<div className="flex flex-col gap-1 text-left w-[85%] enableSelectText cursor-text">
					<div className="flex items-center gap-4">
						<div className="font-medium dark:text-textDarkTheme text-textLightTheme">
							{namePriority ? namePriority : pinMessage.username || ''}
						</div>
						<div className="dark:text-zinc-400 text-colorTextLightMode text-[10px] cursor-default">{messageTime}</div>
					</div>
					<div className="leading-6">
						<MessageLine
							isInPinMsg={true}
							isEditted={false}
							content={messageContentObject}
							isJumMessageEnabled={false}
							isTokenClickAble={false}
							messageId={message?.message_id}
						/>
					</div>
					{message?.attachments?.length ? <ListPinAttachment attachments={message?.attachments} /> : <></>}
				</div>
			</div>
			<div className="absolute h-fit flex gap-x-2 items-center opacity-0 right-2 top-2 group-hover/item-pinMess:opacity-100">
				<button
					onClick={handleJumpMess}
					className="text-xs dark:bg-bgTertiary bg-bgLightModeButton rounded p-1 h-fit dark:text-white text-colorTextLightMode"
				>
					Jump
				</button>
				<button
					className="dark:bg-bgTertiary bg-bgLightModeButton mr-1 dark:text-contentPrimary text-colorTextLightMode rounded-full w-6 h-6 items-center justify-center text-[10px] px-3 py-2 flex"
					onClick={handleUnpinConfirm}
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
				classGridChild = classGridChild + ` col-span-2 first:col-span-6`;
			}
			if (attachments.length % 3 === 2) {
				classGridChild = classGridChild + `col-span-2 first:col-span-3 [&:nth-child(2)]:col-span-3`;
			} else {
				classGridChild = classGridChild + ` col-span-2 `;
			}
			return {
				classGridParent: classGridParent,
				classGridChild: classGridChild
			};
		}
		if (attachments.length < 5) {
			classGridParent = `grid-cols-2`;
			if (attachments.length % 2 === 1) {
				classGridChild = classGridChild + `col-span-1 first:col-span-2`;
			} else {
				classGridChild = classGridChild + `col-span-1`;
			}
			return {
				classGridParent: classGridParent,
				classGridChild: classGridChild
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
