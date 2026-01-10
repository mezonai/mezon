import { useGetPriorityNameFromUserClan } from '@mezon/core';
import { IMentionOnMessage, IMessageWithUser, INotification, TOPBARS_MAX_WIDTH, TypeMessage, addMention, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationJump } from '../../hooks/useNotificationJump';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import MessageAttachment from '../MessageWithUser/MessageAttachment';
import MessageHead from '../MessageWithUser/MessageHead';
import { MessageLine } from '../MessageWithUser/MessageLine';
import MessageReply from '../MessageWithUser/MessageReply/MessageReply';
export type NotifyMentionProps = {
	readonly notify: INotification;
	readonly isUnreadTab?: boolean;
};
function convertContentToObject(notify: any) {
	if (notify && notify.content && typeof notify.content === 'object') {
		try {
			const parsedContent = {
				...notify.content,
				content: notify.content.content ? safeJSONParse(notify.content.content) : null,
				mentions: notify.content.mentions ? safeJSONParse(notify.content.mentions) : null,
				reactions: notify.content.reactions ? safeJSONParse(notify.content.reactions) : null,
				references: notify.content.references ? safeJSONParse(notify.content.references) : null,
				attachments: notify.content.attachments ? safeJSONParse(notify.content.attachments) : null
			};

			return {
				...notify,
				content: parsedContent
			};
		} catch (error) {
			return notify;
		}
	}
	return notify;
}
function NotifyMentionItem({ notify, isUnreadTab }: NotifyMentionProps) {
	const { t } = useTranslation('channelTopbar');
	const parseNotify = convertContentToObject(notify);

	const messageId = useMemo(() => {
		if (parseNotify.content) {
			return parseNotify.content.messageId;
		}
	}, [parseNotify.content.messageId]);

	const channelId = useMemo(() => {
		if (parseNotify.content) {
			return parseNotify.content.channelId;
		}
	}, [parseNotify.content.channelId]);

	const clanId = useMemo(() => {
		if (parseNotify.content) {
			return parseNotify.content.clanId;
		}
	}, [parseNotify.content.clanId]);

	const topicId = parseNotify?.content?.topicId;

	const isTopic = Number(topicId) !== 0 || parseNotify?.content?.code === TypeMessage.Topic || parseNotify?.message?.code === TypeMessage.Topic;

	const { handleClickJump } = useNotificationJump({
		messageId,
		channelId,
		clanId,
		topicId,
		isTopic,
		mode: (parseNotify?.content?.mode ?? 1) - 1
	});

	return (
		<div className=" bg-transparent rounded-[8px] relative group">
			<button
				className="absolute py-1 px-2 top-[10px] z-50 right-3 text-[10px] rounded-[6px] transition-all duration-300 group-hover:block hidden"
				onClick={handleClickJump}
			>
				{t('tooltips.jump')}
			</button>
			{<MentionTabContent message={parseNotify.content} />}
		</div>
	);
}

export default NotifyMentionItem;

interface IMentionTabContent {
	message: IMessageWithUser;
}

function MentionTabContent({ message }: IMentionTabContent) {
	const contentUpdatedMention = addMention(message?.content, message?.mentions as IMentionOnMessage[]);
	const { priorityAvatar } = useGetPriorityNameFromUserClan(message.senderId);
	const checkMessageHasReply = useMemo(() => {
		return message.references && message.references?.length > 0;
	}, [message.references]);

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg ">
			{checkMessageHasReply && (
				<div className="max-w-full overflow-hidden">
					<MessageReply message={message} />
				</div>
			)}

			<div className="flex flex-row p-1 w-full gap-4  rounded-lg bg-item-theme">
				<AvatarImage
					alt="user avatar"
					className="w-10 h-10 min-w-10"
					username={message?.username}
					srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : message.avatar) ?? '', {
						width: 300,
						height: 300,
						resizeType: 'fit'
					})}
					src={priorityAvatar ? priorityAvatar : message.avatar}
				/>

				<div className="h-full w-full">
					<MessageHead message={message} mode={ChannelStreamMode.STREAM_MODE_CHANNEL} />
					<MessageLine
						messageId={message.messageId}
						isEditted={false}
						content={contentUpdatedMention}
						isTokenClickAble={false}
						isJumMessageEnabled={false}
					/>
					{Array.isArray(message.attachments) && (
						<MessageAttachment mode={ChannelStreamMode.STREAM_MODE_CHANNEL} message={message} defaultMaxWidth={TOPBARS_MAX_WIDTH} />
					)}
				</div>
			</div>
		</div>
	);
}
