import { AvatarImage } from '@mezon/components';
import { useAuth } from '@mezon/core';
import {
	appActions,
	selectCurrentChannel,
	selectCurrentClan,
	selectIsShowChatStream,
	selectMemberClanByGoogleId,
	selectMemberClanByUserId2,
	selectStatusStream,
	selectTheme,
	useAppDispatch,
	useAppSelector,
	usersStreamActions,
	videoStreamActions
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IChannelMember, IStreamInfo, getAvatarForPrioritize } from '@mezon/utils';
import { Tooltip } from 'flowbite-react';
import Hls from 'hls.js';
import { ChannelType } from 'mezon-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

interface MediaPlayerProps {
	src: string;
}

function HLSPlayer({ src }: MediaPlayerProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const isPlaying = useSelector(selectStatusStream);
	const [isLoading, setIsLoading] = useState(true);
	const [isMuted, setIsMuted] = useState(false);
	const [volume, setVolume] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [mediaError, setMediaError] = useState(false);
	const [showControls, setShowControls] = useState(false);
	const [errorLimitReached, setErrorLimitReached] = useState(false);
	const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const videoElement = videoRef.current;
		let hls: Hls | null = null;
		let retryCount = 0;
		const maxRetries = 10;
		let mediaErrorRetryCount = 0;
		const maxMediaErrorRetries = 5;

		if (isPlaying && videoElement) {
			if (Hls.isSupported()) {
				hls = new Hls({
					enableWorker: true, // Improve performance and avoid lag/frame drops.
					lowLatencyMode: true, // Enable Low-Latency HLS part playlist and segment loading.
					liveSyncDurationCount: 2, // Start from the last few segments.
					liveMaxLatencyDurationCount: 10, // Maximum delay allowed from edge of live.
					maxBufferLength: 8, // Maximum buffer length in seconds.
					maxMaxBufferLength: 10, // The max Maximum buffer length in seconds.
					maxLiveSyncPlaybackRate: 1.2, // Catch up if the latency is large.
					liveDurationInfinity: true // Override current Media Source duration to Infinity for a live broadcast.
				});

				hls.on(Hls.Events.ERROR, (event, data) => {
					if (data.fatal && hls) {
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								if (retryCount < maxRetries) {
									retryCount++;
									setTimeout(() => {
										if (hls) {
											hls.loadSource(src);
											hls.attachMedia(videoElement);
										}
									}, 2000);
								} else {
									setErrorLimitReached(true);
									setIsLoading(false);
								}
								break;
							case Hls.ErrorTypes.MEDIA_ERROR:
								if (mediaErrorRetryCount < maxMediaErrorRetries) {
									mediaErrorRetryCount++;
									if (!mediaError) {
										setMediaError(true);
										videoElement.pause();
										setIsLoading(true);
										setTimeout(() => {
											hls?.recoverMediaError();
											setMediaError(false);
										}, 3000);
									}
								} else {
									setErrorLimitReached(true);
									setIsLoading(false);
								}
								break;
							default:
								if (hls) {
									hls.destroy();
								}
								break;
						}
					}

					if (data.fatal && data.type === Hls.ErrorTypes.MEDIA_ERROR) {
						// videoElement.pause();
						setIsLoading(true);
					}
				});

				hls.loadSource(src);
				hls.attachMedia(videoElement);
				hls.on(Hls.Events.MANIFEST_PARSED, () => {
					videoElement.play().catch((error) => {
						if (error.name === 'NotAllowedError') {
							setIsMuted(true);
							videoElement.muted = true;
						}
					});
					setIsLoading(false);
				});
			} else {
				videoElement.src = src;
				videoElement.addEventListener('loadedmetadata', () => {
					videoElement.play().catch((error) => {
						if (error.name === 'NotAllowedError') {
							setIsMuted(true);
							videoElement.muted = true;
						}
					});
					setIsLoading(false);
				});
			}
		}

		return () => {
			if (hls) {
				hls.destroy();
			}
		};
	}, [isPlaying, mediaError, src]);

	const handleToggleMute = () => {
		const videoElement = videoRef.current;
		if (videoElement) {
			videoElement.muted = !isMuted;
			setIsMuted(videoElement.muted);
		}
	};

	const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(event.target.value);
		const videoElement = videoRef.current;
		if (videoElement) {
			videoElement.volume = newVolume;
			setVolume(newVolume);
			if (newVolume > 0) {
				videoElement.muted = false;
				setIsMuted(false);
			} else {
				videoElement.muted = true;
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
			<video ref={videoRef} autoPlay playsInline controls={false} className="w-full h-full object-contain" />

			{isLoading && (
				<div className="absolute top-0 left-0 w-full h-full bg-gray-400 flex justify-center items-center text-white text-xl z-50">
					Loading...
				</div>
			)}
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

function UserListStreamChannel({ memberJoin = [], memberMax, isShowChat }: UserListStreamChannelProps) {
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
	const userName = member ? member?.user?.username : userStream?.user?.username;
	const clanAvatar = member ? member?.clan_avatar : userStream?.clan_avatar;
	const avatarUrl = member ? member?.user?.avatar_url : userStream?.user?.avatar_url;
	const avatar = getAvatarForPrioritize(clanAvatar, avatarUrl);

	return (
		<div className="w-14 h-14 rounded-full">
			<div className="w-14 h-14">
				{member || userStream ? (
					<AvatarImage alt={userName || ''} userName={userName} className="min-w-14 min-h-14 max-w-14 max-h-14" src={avatar} />
				) : (
					<Icons.AvatarUser />
				)}
			</div>
		</div>
	);
}

type ChannelStreamProps = {
	hlsUrl?: string;
	memberJoin: IChannelMember[];
	currentStreamInfo: IStreamInfo | null;
	channelName?: string;
};

export default function ChannelStream({ hlsUrl, memberJoin, currentStreamInfo, channelName }: ChannelStreamProps) {
	const streamPlay = useSelector(selectStatusStream);
	const appearanceTheme = useSelector(selectTheme);
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();
	const [showMembers, setShowMembers] = useState(true);
	const [showEndCallButton, setShowEndCallButton] = useState(true);
	const [showMembersButton, setShowMembersButton] = useState(true);
	const hideButtonsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isShowChatStream = useSelector(selectIsShowChatStream);

	const channel = useSelector(selectCurrentChannel);
	const currentClan = useSelector(selectCurrentClan);

	useEffect(() => {
		if (!channel || !currentClan || !currentStreamInfo) return;
		if (channel.type !== ChannelType.CHANNEL_TYPE_STREAMING) return;
		if (currentStreamInfo.streamId !== channel.id || (!streamPlay && currentStreamInfo?.streamId === channel.id)) {
			dispatch(
				videoStreamActions.startStream({
					clanId: currentClan.id || '',
					clanName: currentClan.clan_name || '',
					streamId: channel.channel_id || '',
					streamName: channel.channel_label || '',
					parentId: channel.parrent_id || ''
				})
			);
			dispatch(appActions.setIsShowChatStream(false));
		}
	}, [channel, currentStreamInfo, currentClan]);

	const handleLeaveChannel = async () => {
		if (currentStreamInfo) {
			dispatch(videoStreamActions.stopStream());
		}
		const idStreamByMe = memberJoin?.find((member) => member?.user_id === userProfile?.user?.id)?.id;
		dispatch(usersStreamActions.remove(idStreamByMe || ''));
		dispatch(appActions.setIsShowChatStream(false));
		setShowMembers(true);
	};

	const handleJoinChannel = async () => {
		dispatch(videoStreamActions.startStream(currentStreamInfo as IStreamInfo));
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

	return !streamPlay ? (
		<div className="w-full h-full bg-black flex justify-center items-center">
			<div className="flex flex-col justify-center items-center gap-4 w-full">
				<div className="w-full flex gap-2 justify-center p-2">
					{memberJoin.length > 0 && <UserListStreamChannel memberJoin={memberJoin} memberMax={3}></UserListStreamChannel>}
				</div>
				<div className="max-w-[350px] text-center text-3xl font-bold">
					{channelName && channelName.length > 20 ? `${channelName.substring(0, 20)}...` : channelName}
				</div>
				{memberJoin.length > 0 ? <div>Everyone is waiting for you inside</div> : <div>No one is currently in stream</div>}
				<button className="bg-green-700 rounded-3xl p-2 hover:bg-green-600" onClick={handleJoinChannel}>
					Join stream
				</button>
			</div>
		</div>
	) : (
		<div className="w-full h-full flex relative group" onMouseMove={handleMouseMoveOrClick} onClick={handleMouseMoveOrClick}>
			<div className="flex flex-col justify-center gap-2 w-full bg-black">
				<div className={`relative min-h-40 h-fit items-center flex justify-center ${memberJoin.length > 0 && showMembers ? 'mt-6' : ''}`}>
					{hlsUrl ? (
						<div
							className={`transition-all duration-300 h-full max-sm:w-full w-${showMembers && !isShowChatStream ? '[70%]' : '[100%]'}`}
						>
							<HLSPlayer src={hlsUrl} />
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
							<Tooltip
								content={`${showMembers ? 'Hide Members' : 'Show Members'}`}
								trigger="hover"
								animation="duration-500"
								style={appearanceTheme === 'light' ? 'light' : 'dark'}
								className="dark:!text-white !text-black w-max"
							>
								<div
									onClick={toggleMembers}
									className={`flex gap-1 items-center cursor-pointer bg-neutral-700 hover:bg-bgSecondary600 rounded-3xl px-2 py-[6px] ${showMembersButton ? 'opacity-100' : 'opacity-0'}`}
								>
									<Icons.ArrowDown
										defaultFill="white"
										defaultSize={`size-6 transition-all duration-300 ${showMembers ? '' : '-rotate-180'}`}
									/>
									<Icons.MemberList defaultFill="text-white" />
								</div>
							</Tooltip>
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
					<button onClick={handleLeaveChannel} className="bg-red-600 flex justify-center items-center rounded-full p-3 hover:bg-red-500">
						<Icons.EndCall className="w-6 h-6" />
					</button>
				)}
			</div>
		</div>
	);
}
