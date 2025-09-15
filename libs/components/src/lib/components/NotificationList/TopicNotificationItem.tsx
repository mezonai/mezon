import { useAuth, useGetPriorityNameFromUserClan } from '@mezon/core';
import {
	getFirstMessageOfTopic,
	notificationActions,
	selectAllUserClans,
	selectIsShowInbox,
	selectMemberClanByUserId,
	threadsActions,
	topicsActions,
	useAppDispatch
} from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import { safeJSONParse } from 'mezon-js';
import type { ApiChannelMessageHeader, ApiSdTopic } from 'mezon-js/dist/api.gen';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AvatarImage } from '../AvatarImage/AvatarImage';
export type TopicProps = {
	readonly topic: ApiSdTopic;
};

function TopicNotificationItem({ topic }: TopicProps) {
	const navigate = useNavigate();
	const isShowInbox = useSelector(selectIsShowInbox);
	const [subjectTopic, setSubjectTopic] = useState('');
	const dispatch = useAppDispatch();
	const memberClan = useSelector(selectAllUserClans);
	const { userId } = useAuth();
	const userIds = topic.last_sent_message?.repliers;
	const usernames = useMemo(() => {
		return memberClan
			.filter((profile) => (userIds || []).includes(profile?.user?.id || '') && profile?.user?.id !== userId)
			.map((profile) => profile?.user?.username);
	}, [memberClan, userIds, userId]);
	useEffect(() => {
		if (usernames.length === 0) {
			setSubjectTopic('Topic and you');
		}
		if (usernames.length === 1) {
			setSubjectTopic(`${usernames[0]} and you`);
		}
		if (usernames.length > 1) {
			setSubjectTopic(`${usernames[usernames.length - 1]} and ${usernames.length - 1} others`);
		}
	}, [usernames, userIds]);
	const handleOpenTopic = async () => {
		await navigate(`/chat/clans/${topic.clan_id}/channels/${topic.channel_id}`);
		dispatch(topicsActions.setIsShowCreateTopic(true));
		dispatch(threadsActions.setIsShowCreateThread({ channelId: topic.channel_id as string, isShowCreateThread: false }));
		dispatch(topicsActions.setCurrentTopicId(topic.id || ''));
		dispatch(getFirstMessageOfTopic(topic.id || ''));
		dispatch(notificationActions.setIsShowInbox(!isShowInbox));
	};

	const allTabProps = {
		messageReplied: topic?.message,
		subject: subjectTopic,
		senderId: topic?.last_sent_message?.sender_id,
		lastMessageTopic: topic?.last_sent_message,
		topic
	};

	return (
		<div className=" rounded-[8px] relative group">
			<button
				className="absolute py-1 px-2 bg-item-theme bottom-[10px] z-50 right-3 text-[10px] rounded-[6px] transition-all duration-300 group-hover:block hidden"
				onClick={handleOpenTopic}
			>
				Jump
			</button>
			<AllTabContent {...allTabProps} />
		</div>
	);
}

export default TopicNotificationItem;

interface ITopicTabContent {
	messageReplied?: ApiChannelMessageHeader;
	subject?: string;
	senderId?: string;
	lastMessageTopic?: ApiChannelMessageHeader;
	topic?: ApiSdTopic;
}

function AllTabContent({ messageReplied, subject, lastMessageTopic, topic }: ITopicTabContent) {
	const messageRl = useMemo(() => {
		return messageReplied?.content ? safeJSONParse(messageReplied?.content) : null;
	}, [messageReplied]);
	const lastMsgTopic = useMemo(() => {
		return lastMessageTopic?.content ? safeJSONParse(lastMessageTopic?.content) : null;
	}, [lastMessageTopic]);
	const [senderId, setSubjectTopic] = useState(topic?.last_sent_message?.sender_id ?? '');
	useEffect(() => {
		setSubjectTopic(lastMessageTopic?.sender_id ?? '');
	}, [lastMessageTopic]);

	const { priorityAvatar } = useGetPriorityNameFromUserClan(senderId || '');
	const lastSentUser = useSelector(selectMemberClanByUserId(lastMessageTopic?.sender_id ?? ''));

	return (
		<div className="flex flex-col p-2 bg-item-theme rounded-lg">
			<div className="flex flex-row items-start p-1 w-full gap-4 rounded-lg relative">
				<div className="relative w-11 h-10">
					<AvatarImage
						alt="user avatar"
						className="w-11 h-10 rounded-full border-2 border-color-theme z-10"
						username={lastSentUser?.user?.username}
						srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : lastSentUser?.user?.avatar_url) ?? '', {
							width: 300,
							height: 300,
							resizeType: 'fit'
						})}
						src={priorityAvatar ? priorityAvatar : lastSentUser?.user?.avatar_url}
					/>
					{/* The below component will be used in the future! */}
					{/* <AvatarImage
						alt="second avatar"
						className="w-8 h-8 rounded-lg border-2 border-[#FFFFFF] dark:border-[#313338] absolute -bottom-1 -right-2 z-0"
						username="Second User"
						srcImgProxy={createImgproxyUrl((priorityAvatar ? priorityAvatar : userLastSent?.user?.avatar_url) ?? '', {
							width: 300,
							height: 300,
							resizeType: 'fit'
						})}
						src={priorityAvatar ? priorityAvatar : user?.user?.avatar_url || user?.user?.avatar_url}
					/> */}
				</div>
				<div className="h-full flex-1 max-w-full min-w-0">
					<div>
						<div className="text-[12px] font-bold uppercase">{subject}</div>
					</div>
					<div>
						<div className="text-[12px] w-fit max-w-full break-words whitespace-normal">
							<b className="font-semibold">Replied to</b>: {messageRl ? messageRl?.t : 'Unreachable message'}
						</div>
					</div>
					<div>
						<div className="text-[13px] w-fit max-w-full break-words whitespace-normal">
							<b className="font-semibold">{lastSentUser ? lastSentUser?.user?.username : 'Sender'}</b>:{' '}
							{lastMsgTopic ? lastMsgTopic?.t : 'Unreachable message'}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
