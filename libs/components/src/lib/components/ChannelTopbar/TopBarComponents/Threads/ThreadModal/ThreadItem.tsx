import { AvatarImage } from '@mezon/components';
import { useAppNavigation } from '@mezon/core';
import type { ChannelsEntity, ThreadsEntity } from '@mezon/store';
import {
	appActions,
	channelsActions,
	selectAllChannelMembers,
	selectLastMessageIdByChannelId,
	selectMemberClanByUserId,
	selectMessageEntityById,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import type { ChannelMembersEntity, IChannelMember } from '@mezon/utils';
import { convertTimeMessage, createImgproxyUrl, generateE2eId } from '@mezon/utils';
import type { MutableRefObject } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AvatarGroup, { AvatarCount } from '../../../../Avatar/AvatarGroup';
import { useMessageSender } from '../../../../MessageWithUser/useMessageSender';
import ThreadModalContent from './ThreadModalContent';

type ThreadItemProps = {
	thread: ThreadsEntity;
	setIsShowThread: () => void;
	isPublicThread?: boolean;
	preventClosePannel: MutableRefObject<boolean>;
};

const ThreadItem = ({ thread, setIsShowThread, isPublicThread = false, preventClosePannel }: ThreadItemProps) => {
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const { toChannelPage } = useAppNavigation();
	const dispatch = useAppDispatch();
	const threadMembers = useSelector((state) => selectAllChannelMembers(state, thread?.channel_id || '0'));

	const messageId = useAppSelector((state) => selectLastMessageIdByChannelId(state, thread.channel_id as string));
	const message = useAppSelector((state) =>
		selectMessageEntityById(state, thread.channel_id as string, messageId || thread?.last_sent_message?.id)
	);
	const user = useAppSelector((state) =>
		selectMemberClanByUserId(state, (message?.user?.id || thread?.last_sent_message?.sender_id || thread?.creator_id) as string)
	) as IChannelMember;
	const { avatarImg, username } = useMessageSender(user);
	const senderDisplayName = user?.clan_nick || user?.user?.display_name || username || user?.user?.username || '';
	const senderAvatarUrl = user?.clan_avatar || user?.user?.avatar_url || avatarImg || '';

	const getRandomElements = (array: ChannelMembersEntity[], count: number) => {
		const result: ChannelMembersEntity[] = [];
		const usedIndices = new Set();

		while (result.length < count && usedIndices.size < array.length) {
			const randomIndex = Math.floor(Math.random() * array.length);
			if (!usedIndices.has(randomIndex)) {
				usedIndices.add(randomIndex);
				result.push(array[randomIndex]);
			}
		}

		return result;
	};

	const previewAvatarList = useMemo(() => {
		if (threadMembers && threadMembers.length > 0) {
			return getRandomElements(threadMembers, 5);
		}
		return [];
	}, [threadMembers]);

	const timeMessage = useMemo(() => {
		if (message && message.create_time_seconds) {
			const lastTime = convertTimeMessage(message.create_time_seconds, i18n.language);
			return lastTime;
		} else {
			if (thread && thread.last_sent_message && thread.last_sent_message.timestamp_seconds) {
				const lastTime = convertTimeMessage(thread.last_sent_message.timestamp_seconds, i18n.language);
				return lastTime;
			}
		}
	}, [message, thread, i18n.language]);

	const handleLinkThread = (channelId: string, clanId: string) => {
		preventClosePannel.current = false;
		dispatch(channelsActions.upsertOne({ clanId, channel: thread as ChannelsEntity }));
		dispatch(appActions.setIsShowCanvas(false));
		navigate(toChannelPage(channelId, clanId));
		setIsShowThread();
	};

	return (
		<div
			onClick={() => handleLinkThread(thread.channel_id as string, thread.clan_id || '0')}
			className="relative overflow-y-hidden p-4 mb-2 cursor-pointer rounded-lg h-[72px] bg-item-theme"
			role="button"
			data-e2e={generateE2eId('chat.channel_message.header.button.thread.item')}
		>
			<div className="flex flex-row justify-between items-center">
				<div className="flex flex-col gap-1">
					<p className="text-base font-semibold leading-5 one-line">{thread?.channel_label}</p>
					<div className="flex flex-row items-center h-6">
						<AvatarImage
							alt={`${senderDisplayName}'s avatar`}
							username={senderDisplayName}
							className="size-4 rounded-md object-cover mr-2"
							srcImgProxy={createImgproxyUrl(senderAvatarUrl, {
								width: 300,
								height: 300,
								resizeType: 'fit'
							})}
							src={senderAvatarUrl}
						/>
						<span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-[#17AC86] text-sm font-semibold leading-4">
							{senderDisplayName}:&nbsp;
						</span>
						<div className="overflow-hidden max-w-[140px]">
							<ThreadModalContent message={message} thread={thread as ChannelsEntity} />
						</div>
						<div className="overflow-x-hidden">
							<p className="text-xs font-medium leading-4 ml-2">
								<span className="truncate text-theme-primary">•&nbsp;{timeMessage}</span>
							</p>
						</div>
					</div>
				</div>
				<div className="w-[120px]">
					{threadMembers && (
						<AvatarGroup className="flex justify-end items-center">
							{previewAvatarList?.map((avatar, index) => (
								<AvatarImage
									key={(avatar.clan_avatar || avatar.user?.avatar_url || avatar.id) + index}
									alt={avatar?.clan_nick || avatar?.user?.display_name || avatar?.user?.username || 'avatar'}
									username={avatar?.clan_nick || avatar?.user?.display_name || avatar?.user?.username || ''}
									src={avatar.clan_avatar || avatar.user?.avatar_url || ''}
									srcImgProxy={createImgproxyUrl(avatar.clan_avatar || avatar.user?.avatar_url || '', {
										width: 24,
										height: 24,
										resizeType: 'fit'
									})}
									className="object-cover h-6 w-6 min-w-6 min-h-6 max-w-6 max-h-6 rounded-full"
								/>
							))}
							{threadMembers && threadMembers.length > 5 && (
								<AvatarCount number={threadMembers?.length - 5 > 50 ? 50 : threadMembers?.length - 5} />
							)}
						</AvatarGroup>
					)}
				</div>
			</div>
		</div>
	);
};

export default ThreadItem;
