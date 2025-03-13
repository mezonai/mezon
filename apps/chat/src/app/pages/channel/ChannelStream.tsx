import { AvatarImage } from '@mezon/components';
import { useAuth } from '@mezon/core';
import {
	appActions,
	ChannelsEntity,
	selectCurrentClan,
	selectGotifyToken,
	selectIsJoin,
	selectIsShowChatStream,
	selectMemberClanByGoogleId,
	selectMemberClanByUserId2,
	selectRemoteVideoStream,
	selectStatusStream,
	selectStreamMembersByChannelId,
	selectTheme,
	useAppDispatch,
	useAppSelector,
	usersStreamActions,
	videoStreamActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, getAvatarForPrioritize, IChannelMember, IStreamInfo } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

interface MediaPlayerProps {
	videoRef: RefObject<HTMLVideoElement>;
}

function HLSPlayer({ videoRef }: MediaPlayerProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [isMuted, setIsMuted] = useState(false);
	const [volume, setVolume] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showControls, setShowControls] = useState(false);
	const [errorLimitReached, setErrorLimitReached] = useState(false);
	const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isRemoteVideoStream = useSelector(selectRemoteVideoStream);

	const handleToggleMute = () => {
		if (videoRef.current) {
			videoRef.current.muted = !isMuted;
			setIsMuted(videoRef.current.muted);
		}
	};

	const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(event.target.value);
		if (videoRef.current) {
			videoRef.current.volume = newVolume;
			setVolume(newVolume);
			if (newVolume > 0) {
				videoRef.current.muted = false;
				setIsMuted(false);
			} else {
				videoRef.current.muted = true;
				setIsMuted(true);
			}
		}
	};

	const handleFullscreen = () => {
		const containerElement = containerRef.current;
		if (containerElement) {
			if (!document.fullscreenElement) {
				containerElement
					.requestFullscreen()
					.then(() => {
						setIsFullscreen(true);
					})
					.catch((err) => {
						console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
					});
			} else {
				document.exitFullscreen().then(() => {
					setIsFullscreen(false);
				});
			}
		}
	};

	const handleMouseEnter = () => {
		setShowControls(true);
		resetHideControlsTimer();
	};

	const handleMouseLeave = () => {
		setShowControls(false);
		resetHideControlsTimer();
	};

	const handleMouseMoveOrClick = () => {
		setShowControls(true);
		resetHideControlsTimer();
	};

	const resetHideControlsTimer = () => {
		if (hideControlsTimeoutRef.current) {
			clearTimeout(hideControlsTimeoutRef.current);
		}
		hideControlsTimeoutRef.current = setTimeout(() => {
			setShowControls(false);
		}, 3000);
	};

	return (
		<div
			ref={containerRef}
			className="relative w-full h-full overflow-hidden rounded-lg"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onMouseMove={handleMouseMoveOrClick}
			onClick={handleMouseMoveOrClick}
		>
			<div className="custom-video-container w-full h-full" style={{ position: 'relative' }}>
				{!isRemoteVideoStream && (
					<img
						src="http://do78x13wq0td.cloudfront.net/prod/Uploads/images/imsv2/1734066191951-145%20(14).png"
						alt="background"
						className="w-full h-full object-cover"
					/>
				)}
				<video
					className="custom-video w-full h-full object-contain"
					ref={videoRef}
					autoPlay
					playsInline
					controls={false}
					style={{
						display: isRemoteVideoStream ? 'block' : 'none'
					}}
				/>
			</div>

			{/* {isLoading && (
				<div className="absolute top-0 left-0 w-full h-full bg-gray-400 flex justify-center items-center text-white text-xl z-50">
					Loading...
				</div>
			)} */}
			{errorLimitReached && (
				<div className="absolute top-0 left-0 w-full h-full bg-gray-400 flex justify-center items-center text-white text-xl z-50">
					Cannot play video. Please try again later.
				</div>
			)}

			<div
				className={`bg-black bg-opacity-50 absolute bottom-0 flex items-center w-full justify-between p-2 transition-transform duration-300 ease-in-out ${showControls ? 'translate-y-0' : 'translate-y-full'}`}
			>
				<div className="flex items-center gap-1">
					<button onClick={handleToggleMute} className="p-1">
						{isMuted || volume === 0 ? (
							<Icons.MutedVolume className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
						) : volume < 0.5 ? (
							<Icons.LowVolume className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
						) : (
							<Icons.LoudVolume className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
						)}
					</button>

					<div className="flex items-center">
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							value={isMuted ? 0 : volume}
							onChange={handleVolumeChange}
							className="cursor-pointer w-[100px] h-[5px]"
						/>
					</div>
				</div>
				<button onClick={handleFullscreen} className="p-1">
					{isFullscreen ? (
						<Icons.ExitFullScreen className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
					) : (
						<Icons.FullScreen className="dark:text-[#AEAEAE] text-[#535353] dark:hover:text-white hover:text-black" />
					)}
				</button>
			</div>
		</div>
	);
}

export type UserListStreamChannelProps = {
	readonly memberJoin: IChannelMember[];
	readonly memberMax?: number;
	readonly isShowChat?: boolean;
};

export function UserListStreamChannel({ memberJoin = [], memberMax, isShowChat }: UserListStreamChannelProps) {
	const [displayedMembers, setDisplayedMembers] = useState<IChannelMember[]>(memberJoin);
	const [remainingCount, setRemainingCount] = useState(0);

	const handleSizeWidth = useCallback(() => {
		const membersToShow = [...memberJoin];
		let maxMembers = memberMax ?? 7;

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
		setRemainingCount(extraMembers > 0 ? extraMembers : 0);
	}, [memberJoin, memberMax, isShowChat]);

	useEffect(() => {
		handleSizeWidth();
		window.addEventListener('resize', handleSizeWidth);

		return () => {
			window.removeEventListener('resize', handleSizeWidth);
		};
	}, [handleSizeWidth]);

	return (
		<div className="flex items-center gap-2">
			{displayedMembers.map((item: IChannelMember) => (
				<div key={item.id} className="flex items-center">
					<UserItem user={item} />
				</div>
			))}
			{remainingCount > 0 && (
				<div className="w-14 h-14 rounded-full bg-gray-300 text-black font-medium flex items-center justify-center">+{remainingCount}</div>
			)}
		</div>
	);
}

function UserItem({ user }: { user: IChannelMember }) {
	const member = useAppSelector((state) => selectMemberClanByGoogleId(state, user.user_id ?? ''));
	const userStream = useAppSelector((state) => selectMemberClanByUserId2(state, user.user_id ?? ''));
	const username = member ? member?.user?.username : userStream?.user?.username;
	const clanAvatar = member ? member?.clan_avatar : userStream?.clan_avatar;
	const avatarUrl = member ? member?.user?.avatar_url : userStream?.user?.avatar_url;
	const avatar = getAvatarForPrioritize(clanAvatar, avatarUrl);

	return (
		<div className="w-14 h-14 rounded-full">
			<div className="w-14 h-14">
				{member || userStream ? (
					<AvatarImage
						alt={username || ''}
						username={username}
						className="min-w-14 min-h-14 max-w-14 max-h-14"
						srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 300, height: 300, resizeType: 'fit' })}
						src={avatar}
					/>
				) : (
					<Icons.AvatarUser />
				)}
			</div>
		</div>
	);
}

type ChannelStreamProps = {
	currentStreamInfo: IStreamInfo | null;
	currentChannel: ChannelsEntity | null;
	handleChannelClick: (clanId: string, channelId: string, userId: string, streamId: string, username: string, gotifyToken: string) => void;
	streamVideoRef: RefObject<HTMLVideoElement>;
	disconnect: () => void;
	isStream: boolean;
};

// TODO: improve later

export default function ChannelStream({
	currentStreamInfo,
	currentChannel,
	handleChannelClick,
	streamVideoRef,
	disconnect,
	isStream
}: ChannelStreamProps) {
	const memberJoin = useAppSelector((state) => selectStreamMembersByChannelId(state, currentChannel?.channel_id || ''));
	const streamPlay = useSelector(selectStatusStream);
	const isJoin = useSelector(selectIsJoin);
	const appearanceTheme = useSelector(selectTheme);
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const [showMembers, setShowMembers] = useState(true);
	const [showEndCallButton, setShowEndCallButton] = useState(true);
	const [showMembersButton, setShowMembersButton] = useState(true);
	const hideButtonsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isShowChatStream = useSelector(selectIsShowChatStream);
	const gotifyToken = useSelector(selectGotifyToken);

	const currentClan = useSelector(selectCurrentClan);

	useEffect(() => {
		if (!currentChannel || !currentClan || !currentStreamInfo) return;
		if (currentChannel.type !== ChannelType.CHANNEL_TYPE_STREAMING) return;
		if (currentStreamInfo.streamId !== currentChannel.id || (!streamPlay && currentStreamInfo?.streamId === currentChannel.id)) {
			dispatch(appActions.setIsShowChatStream(false));
		}
	}, [currentChannel, currentStreamInfo, currentClan]);

	const handleLeaveChannel = async () => {
		if (currentStreamInfo) {
			dispatch(videoStreamActions.stopStream());
		}
		dispatch(videoStreamActions.setIsJoin(false));
		disconnect();
		const idStreamByMe = memberJoin?.find((member) => member?.user_id === userProfile?.user?.id)?.id;
		dispatch(usersStreamActions.remove(idStreamByMe || ''));
		dispatch(appActions.setIsShowChatStream(false));
		setShowMembers(true);
	};

	const handleJoinChannel = async () => {
		if (!currentChannel || !currentClan) return;
		if (currentChannel.type !== ChannelType.CHANNEL_TYPE_STREAMING) return;
		dispatch(
			videoStreamActions.startStream({
				clanId: currentClan.id as string,
				clanName: currentClan.clan_name as string,
				streamId: currentChannel.channel_id as string,
				streamName: currentChannel.channel_label as string,
				parentId: currentChannel.parent_id as string
			})
		);
		dispatch(videoStreamActions.setIsJoin(true));
		disconnect();
		handleChannelClick(
			currentClan?.id as string,
			currentChannel?.channel_id as string,
			userProfile?.user?.id as string,
			currentChannel?.channel_id as string,
			userProfile?.user?.username as string,
			gotifyToken as string
		);
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
				<div className="w-full h-full bg-black flex justify-center items-center">
					<div className="flex flex-col justify-center items-center gap-4 w-full">
						<div className="w-full flex gap-2 justify-center p-2">
							{memberJoin.length > 0 && <UserListStreamChannel memberJoin={memberJoin} memberMax={3}></UserListStreamChannel>}
						</div>
						<div className="max-w-[350px] text-center text-3xl font-bold">
							{currentChannel?.channel_label && currentChannel.channel_label.length > 20
								? `${currentChannel.channel_label.substring(0, 20)}...`
								: currentChannel?.channel_label}
						</div>
						{memberJoin.length > 0 ? <div>Everyone is waiting for you inside</div> : <div>No one is currently in stream</div>}
						<button
							disabled={!memberJoin.length}
							className={`bg-green-700 rounded-3xl p-2 ${memberJoin.length > 0 ? 'hover:bg-green-600' : 'opacity-50'}`}
							onClick={handleJoinChannel}
						>
							Join stream
						</button>
					</div>
				</div>
			)}
			<div
				className={`${currentStreamInfo?.streamId !== currentChannel?.channel_id || !isJoin ? 'w-0 h-0 overflow-hidden' : 'w-full h-full'} flex relative group`}
				onMouseMove={handleMouseMoveOrClick}
				onClick={handleMouseMoveOrClick}
			>
				<div className="flex flex-col justify-center gap-2 w-full bg-black">
					<div className={`relative min-h-40 h-fit items-center flex justify-center ${memberJoin.length > 0 && showMembers ? 'mt-6' : ''}`}>
						{isStream ? (
							<div
								className={`transition-all duration-300 h-full max-sm:w-full w-${showMembers && !isShowChatStream ? '[70%]' : '[100%]'}`}
							>
								<HLSPlayer videoRef={streamVideoRef} />
							</div>
						) : (
							<div className="sm:h-[250px] md:h-[350px] lg:h-[450px] xl:h-[550px] w-[70%] dark:text-[#AEAEAE] text-colorTextLightMode dark:bg-bgSecondary600 bg-channelTextareaLight text-5xl flex justify-center items-center text-center">
								<span>No stream today</span>
							</div>
						)}
						{memberJoin.length > 0 && (
							<div
								className={`absolute z-50 opacity-0 transition-opacity duration-300 ${showMembers ? '-bottom-10' : `${isShowChatStream ? 'bottom-20' : 'bottom-20 max-[1700px]:bottom-2'}`} group-hover:opacity-100`}
							>
								<div
									title={showMembers ? 'Hide Members' : 'Show Members'}
									onClick={toggleMembers}
									className={`flex gap-1 items-center cursor-pointer bg-neutral-700 hover:bg-bgSecondary600 rounded-3xl px-2 py-[6px] ${showMembersButton ? 'opacity-100' : 'opacity-0'}`}
								>
									<Icons.ArrowDown
										defaultFill="white"
										defaultSize={`size-6 transition-all duration-300 ${showMembers ? '' : '-rotate-180'}`}
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
