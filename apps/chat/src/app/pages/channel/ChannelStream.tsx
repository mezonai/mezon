import { AvatarImage } from '@mezon/components';
import { useAuth } from '@mezon/core';
import type { ChannelsEntity, UsersStreamEntity } from '@mezon/store';
import {
	appActions,
	generateMeetToken,
	selectCurrentClanId,
	selectCurrentClanName,
	selectIsJoin,
	selectIsShowChatStream,
	selectMemberClanByUserId,
	selectStatusStream,
	selectStreamMembersByChannelId,
	selectStreamMuted,
	selectStreamVolume,
	streamMemberEntityId,
	useAppDispatch,
	useAppSelector,
	usersStreamActions,
	videoStreamActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { IStreamInfo } from '@mezon/utils';
import { createImgproxyUrl, getAvatarForPrioritize } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

export type UserListStreamChannelProps = {
	readonly memberJoin: UsersStreamEntity[];
	readonly isShowChat?: boolean;
	readonly maxMember?: number;
};

export function UserListStreamChannel({ memberJoin = [], isShowChat, maxMember }: UserListStreamChannelProps) {
	const [displayedMembers, setDisplayedMembers] = useState<UsersStreamEntity[]>(memberJoin);
	const [remainingCount, setRemainingCount] = useState(0);

	const handleSizeWidth = useCallback(() => {
		const membersToShow = [...memberJoin];
		let maxMembers = maxMember ?? 7;

		if (window.innerWidth < 1000) {
			maxMembers = isShowChat ? 1 : 2;
		} else if (window.innerWidth < 1200) {
			maxMembers = isShowChat ? 2 : 3;
		} else if (window.innerWidth < 1300) {
			maxMembers = isShowChat ? 3 : 4;
		} else if (window.innerWidth < 1400) {
			maxMembers = isShowChat ? 4 : 5;
		} else if (window.innerWidth < 1700) {
			maxMembers = isShowChat ? 5 : 6;
		}

		const extraMembers = membersToShow.length - maxMembers;

		setDisplayedMembers(membersToShow.slice(0, maxMembers));
		setRemainingCount(extraMembers > 99 ? 99 : extraMembers > 0 ? extraMembers : 0);
	}, [memberJoin, isShowChat, maxMember]);

	useEffect(() => {
		handleSizeWidth();
		window.addEventListener('resize', handleSizeWidth);

		return () => {
			window.removeEventListener('resize', handleSizeWidth);
		};
	}, [handleSizeWidth]);

	return (
		<div className="flex items-center gap-2">
			{displayedMembers.map((user) => (
				<div key={user.user_id} className="flex items-center">
					<UserItem id={user.user_id} user_name={user.user_name} user_avatar={user.user_avatar} />
				</div>
			))}
			{remainingCount > 0 && (
				<div className="w-14 h-14 rounded-full bg-item-theme text-theme-primary-active font-medium flex items-center justify-center">
					{remainingCount}+
				</div>
			)}
		</div>
	);
}

function UserItem({ id, user_name, user_avatar }: { id: string; user_name: string; user_avatar: string }) {
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, id ?? '')) || user_name;
	const avatar = getAvatarForPrioritize(userStream?.clan_avatar, userStream?.user?.avatar_url) || user_avatar;

	return (
		<div className="w-14 h-14 rounded-full">
			<div className="w-14 h-14">
				{avatar ? (
					<AvatarImage
						alt={userStream?.user?.username || ''}
						username={userStream?.user?.username}
						className="min-w-14 min-h-14 max-w-14 max-h-14 size-14"
						srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 300, height: 300, resizeType: 'fit' })}
						src={avatar}
					/>
				) : (
					<Icons.AvatarUser className={`w-14 h-14`} />
				)}
			</div>
		</div>
	);
}

type ChannelStreamProps = {
	currentStreamInfo: IStreamInfo | null;
	currentChannel: ChannelsEntity | null;
};

// TODO: improve later

export default function ChannelStream({ currentStreamInfo, currentChannel }: ChannelStreamProps) {
	const { t } = useTranslation('channelStream');
	const memberJoin = useAppSelector((state) => selectStreamMembersByChannelId(state, currentChannel?.channel_id || '0'));
	const streamPlay = useSelector(selectStatusStream);
	const isJoin = useSelector(selectIsJoin);
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const [showMembers, setShowMembers] = useState(true);
	const [showEndCallButton, setShowEndCallButton] = useState(true);
	const [showMembersButton, setShowMembersButton] = useState(true);
	const hideButtonsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isShowChatStream = useSelector(selectIsShowChatStream);

	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanName = useSelector(selectCurrentClanName);
	const sfuServerUrl = process.env.NX_CHAT_APP_SFU_WS_URL;
	const volume = useSelector(selectStreamVolume);
	const muted = useSelector(selectStreamMuted);

	useEffect(() => {
		if (!currentChannel || !currentClanId || !currentStreamInfo) return;
		if (currentChannel.type !== ChannelType.CHANNEL_TYPE_STREAMING) return;
		if (currentStreamInfo.streamId !== currentChannel.id || (!streamPlay && currentStreamInfo?.streamId === currentChannel.id)) {
			dispatch(appActions.setIsShowChatStream(false));
		}
	}, [currentChannel, currentStreamInfo, currentClanId, dispatch, streamPlay]);

	const handleLeaveChannel = async () => {
		const idStreamByMe = memberJoin?.find((user) => user.user_id === userProfile?.user?.id);
		if (idStreamByMe) {
			dispatch(usersStreamActions.remove(streamMemberEntityId(idStreamByMe.user_id, idStreamByMe.streaming_channel_id)));
		}
		dispatch(videoStreamActions.resetPlayback());
		dispatch(appActions.setIsShowChatStream(false));
		setShowMembers(true);
	};

	const handleJoinChannel = async () => {
		if (!currentChannel || !currentClanId) return;
		if (currentChannel.type !== ChannelType.CHANNEL_TYPE_STREAMING) return;
		if (!sfuServerUrl) return;
		if (!memberJoin.length) return;
		let token: string | undefined;
		try {
			token = await dispatch(
				generateMeetToken({
					channelId: currentChannel.channel_id as string,
					roomName: ''
				})
			).unwrap();
		} catch {
			return;
		}
		if (!token) return;
		dispatch(videoStreamActions.setToken(token));
		dispatch(
			videoStreamActions.startStream({
				clanId: currentClanId as string,
				clanName: currentClanName as string,
				streamId: currentChannel.channel_id as string,
				streamName: currentChannel.channel_label as string,
				parentId: currentChannel.parent_id as string
			})
		);
		dispatch(videoStreamActions.setIsJoin(true));
	};

	const handleToggleMute = () => {
		dispatch(videoStreamActions.setMuted(!muted));
	};

	const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
		dispatch(videoStreamActions.setVolume(parseFloat(event.target.value)));
	};

	const toggleMembers = () => {
		setShowMembers((prev) => !prev);
	};

	const resetHideButtonsTimer = () => {
		if (hideButtonsTimeoutRef.current) {
			clearTimeout(hideButtonsTimeoutRef.current);
		}
		setShowEndCallButton(true);
		setShowMembersButton(true);
		hideButtonsTimeoutRef.current = setTimeout(() => {
			setShowEndCallButton(false);
			setShowMembersButton(false);
		}, 3000);
	};

	const handleMouseMoveOrClick = () => {
		resetHideButtonsTimer();
	};

	useEffect(() => {
		resetHideButtonsTimer();

		return () => {
			if (hideButtonsTimeoutRef.current) {
				clearTimeout(hideButtonsTimeoutRef.current);
			}
		};
	}, []);

	return (
		<>
			{(currentStreamInfo?.streamId !== currentChannel?.channel_id || !isJoin) && (
				<div className="w-full h-full bg-gray-300 dark:bg-black flex justify-center items-center">
					<div className="flex flex-col justify-center items-center gap-4 w-full">
						<div className="w-full flex gap-2 justify-center p-2">
							{memberJoin.length > 0 && <UserListStreamChannel memberJoin={memberJoin} maxMember={3}></UserListStreamChannel>}
						</div>
						<div className="max-w-[350px] text-center text-3xl font-bold text-gray-800 dark:text-white">
							{currentChannel?.channel_label && currentChannel.channel_label.length > 20
								? `${currentChannel.channel_label.substring(0, 20)}...`
								: currentChannel?.channel_label}
						</div>
						{memberJoin.length > 0 ? (
							<div className="text-gray-800 dark:text-white">{t('everyoneWaiting')}</div>
						) : (
							<div className="text-gray-800 dark:text-white">{t('noOneInStream')}</div>
						)}
						<button
							disabled={!memberJoin.length}
							className={`bg-green-700 rounded-3xl p-2 ${memberJoin.length > 0 ? 'hover:bg-green-600' : 'opacity-50'}`}
							onClick={handleJoinChannel}
						>
							{t('joinStream')}
						</button>
					</div>
				</div>
			)}
			<div
				className={`${currentStreamInfo?.streamId !== currentChannel?.channel_id || !isJoin ? 'w-0 h-0 overflow-hidden' : 'w-full h-full'} flex relative group`}
				onMouseMove={handleMouseMoveOrClick}
				onClick={handleMouseMoveOrClick}
			>
				<div className="flex flex-col justify-center gap-2 w-full bg-theme-setting-primary border-theme-primary">
					<div className={`relative min-h-40 h-fit items-center flex justify-center ${memberJoin.length > 0 && showMembers ? 'mt-6' : ''}`}>
						<div
							className={`sm:h-[250px] md:h-[350px] lg:h-[450px] xl:h-[550px] w-[70%] text-theme-primary bg-theme-setting-nav flex justify-center items-center text-center border-theme-primary relative overflow-hidden`}
						>
							<img
								src={currentChannel?.channel_avatar || '/assets/images/flahstream.png'}
								alt={currentChannel?.channel_label || t('streamThumbnail')}
								className="w-full h-full object-cover opacity-80"
							/>
							<div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
								<div className="flex items-center gap-1">
									<button onClick={handleToggleMute} className="p-1" type="button">
										{muted || volume === 0 ? (
											<Icons.MutedVolume className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
										) : volume < 0.5 ? (
											<Icons.LowVolume className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
										) : (
											<Icons.LoudVolume className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
										)}
									</button>
									<input
										type="range"
										min="0"
										max="1"
										step="0.01"
										value={muted ? 0 : volume}
										onChange={handleVolumeChange}
										className="cursor-pointer w-[100px] h-[5px]"
									/>
								</div>
							</div>
						</div>
						{memberJoin.length > 0 && (
							<div
								className={`absolute z-50 opacity-0 transition-opacity duration-300 ${showMembers ? '-bottom-10' : `${isShowChatStream ? 'bottom-20' : 'bottom-20 max-[1700px]:bottom-2'}`} group-hover:opacity-100`}
							>
								<div
									title={showMembers ? t('hideMembers') : t('showMembers')}
									onClick={toggleMembers}
									className={`flex gap-1 items-center cursor-pointer bg-neutral-700 hover:bg-bgSecondary600 rounded-3xl px-2 py-[6px] ${showMembersButton ? 'opacity-100' : 'opacity-0'}`}
								>
									<Icons.ArrowDown
										defaultFill="white"
										className={`size-6 transition-all duration-300 ${showMembers ? '' : '-rotate-180'}`}
									/>
									<Icons.MemberList defaultFill="text-white" />
								</div>
							</div>
						)}
					</div>
					{memberJoin.length > 0 && showMembers && (
						<div
							className={`w-full flex gap-2 justify-center p-2 transition-opacity duration-300 ${showMembers ? 'opacity-100' : 'opacity-0'}`}
						>
							<UserListStreamChannel isShowChat={isShowChatStream} memberJoin={memberJoin}></UserListStreamChannel>
						</div>
					)}
					{memberJoin.length > 0 && showMembers && <div className="h-20"></div>}
				</div>
				<div className="absolute z-50 bottom-4 left-1/2 transform -translate-x-1/2 translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
					{showEndCallButton && (
						<button
							onClick={handleLeaveChannel}
							className="bg-red-600 flex justify-center items-center rounded-full p-3 hover:bg-red-500"
						>
							<Icons.EndCall className="w-6 h-6" />
						</button>
					)}
				</div>
			</div>
		</>
	);
}
