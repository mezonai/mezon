import { useGetPriorityNameFromUserClan } from '@mezon/core';
import { IMentionOnMessage, IMessageWithUser, INotification, TOPBARS_MAX_WIDTH, addMention, createImgproxyUrl } from '@mezon/utils';
import { ChannelStreamMode, safeJSONParse } from 'mezon-js';
import { AvatarImage } from '../AvatarImage/AvatarImage';
import MessageAttachment from '../MessageWithUser/MessageAttachment';
import MessageHead from '../MessageWithUser/MessageHead';
import { MessageLine } from '../MessageWithUser/MessageLine';
export type NotifyClanWebhookProps = {
	readonly notify: INotification;
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
function NotificationWebhookClanItem({ notify }: NotifyClanWebhookProps) {
	const parseNotify = convertContentToObject(notify);
	return <div className=" bg-transparent rounded-[8px] relative group">{<MentionTabContent message={parseNotify.content} />}</div>;
}

export default NotificationWebhookClanItem;

interface IMentionTabContent {
	message: IMessageWithUser;
}

function MentionTabContent({ message }: IMentionTabContent) {
	const contentUpdatedMention = addMention(message?.content, message?.mentions as IMentionOnMessage[]);
	const { priorityAvatar } = useGetPriorityNameFromUserClan(message.senderId);

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg ">
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
					{message?.content && (
						<MessageLine
							messageId={message.messageId}
							isEditted={false}
							content={contentUpdatedMention}
							isTokenClickAble={false}
							isJumMessageEnabled={false}
						/>
					)}
					{Array.isArray(message.attachments) && (
						<MessageAttachment mode={ChannelStreamMode.STREAM_MODE_CHANNEL} message={message} defaultMaxWidth={TOPBARS_MAX_WIDTH} />
					)}
				</div>
			</div>
		</div>
	);
}
