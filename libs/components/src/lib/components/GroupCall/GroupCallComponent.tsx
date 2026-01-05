import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import { useAppParams, useAuth } from '@mezon/core';
import {
	DMCallActions,
	appActions,
	generateMeetToken,
	selectDmGroupCurrent,
	selectGroupCallJoined,
	selectIsShowChatVoice,
	selectIsShowSettingFooter,
	selectShowCamera,
	selectShowMicrophone,
	selectShowModelEvent,
	selectStatusMenu,
	selectTokenJoinVoice,
	selectVoiceFullScreen,
	selectVoiceInfo,
	selectVoiceOpenPopOut,
	useAppDispatch,
	voiceActions
} from '@mezon/store';
import { GroupVideoConference } from '../VoiceChannel/MyVideoConference/GroupVideoConference';

import { ChannelType } from 'mezon-js';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import PreCallInterface from './PreCallInterface';
import { useGroupCall } from './hooks/useGroupCall';
import type { CallSignalingData } from './utils/callDataUtils';
import {
	createCallSignalingData,
	createCancelData,
	createParticipantJoinedData,
	createParticipantLeftData,
	createQuitData
} from './utils/callDataUtils';

const GroupCallComponent = memo(
	() => {
		const dispatch = useAppDispatch();
		const { directId } = useAppParams();
		const { userProfile } = useAuth();
		const containerRef = useRef<HTMLDivElement | null>(null);

		const currentDmGroup = useSelector(selectDmGroupCurrent(directId ?? ''));

		const groupCall = useGroupCall({ currentGroup: currentDmGroup });

		const isJoined = useSelector(selectGroupCallJoined);
		const token = useSelector(selectTokenJoinVoice);
		const voiceInfo = useSelector(selectVoiceInfo);
		const showMicrophone = useSelector(selectShowMicrophone);
		const showCamera = useSelector(selectShowCamera);
		const isVoiceFullScreen = useSelector(selectVoiceFullScreen);
		const isShowChatVoice = useSelector(selectIsShowChatVoice);
		const isShowSettingFooter = useSelector(selectIsShowSettingFooter);
		const showModalEvent = useSelector(selectShowModelEvent);
		const isOpenPopOut = useSelector(selectVoiceOpenPopOut);
		const isOnMenu = useSelector(selectStatusMenu);

		const serverUrl = process.env.NX_CHAT_APP_MEET_WS_URL;

		const isDmGroup = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP;
		const isDm = currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM;

		const handleJoinRoom = async (isVideoCallParam = false) => {
			const videoEnabled = isVideoCallParam || groupCall.state.isVideoCall;

			dispatch(voiceActions.setOpenPopOut(false));
			dispatch(DMCallActions.setIsShowMeetDM(videoEnabled));
			groupCall.state.setLoading(true);

			const storedCallData = groupCall.state.storedCallData;
			const baseParticipants = storedCallData?.participants ?? currentDmGroup?.userIds ?? [];

			const callGroup: any = storedCallData
				? {
						channelId: storedCallData.groupId,
						meetingCode: storedCallData.meetingCode,
						clanId: storedCallData.clanId,
						channelLabel: storedCallData.groupName,
						clanName: storedCallData.groupName
					}
				: currentDmGroup;

			if (!callGroup?.meetingCode) return;

			const callerId = userProfile?.user?.id || '';
			const participants = [...baseParticipants, callerId.toString()];

			// Create call data using utility
			const callData = createCallSignalingData({
				isVideo: videoEnabled,
				groupId: callGroup?.channelId,
				groupName: callGroup?.channelLabel || callGroup?.usernames?.join(','),
				groupAvatar: callGroup?.channelAvatar?.[0],
				callerId,
				callerName: userProfile?.user?.displayName || userProfile?.user?.username || '',
				callerAvatar: userProfile?.user?.avatarUrl,
				meetingCode: callGroup?.meetingCode,
				clanId: callGroup?.clanId,
				participants
			});

			// Send signaling using hook
			if (!groupCall.state.isAnsweringCall) {
				// Play dial tone and send offer
				groupCall.audio.playDialTone();
				groupCall.signaling.sendGroupCallOffer(baseParticipants, callData, callGroup?.channelId as string, userProfile?.user?.id as string);
			} else {
				// Stop ring tone and send answer
				groupCall.audio.stopAllAudio();
				groupCall.signaling.sendGroupCallAnswer(
					groupCall.state.storedCallData?.participants || [],
					callData,
					callGroup?.channelId as string,
					userProfile?.user?.id as string
				);
			}

			try {
				const result = await dispatch(
					generateMeetToken({
						channelId: callGroup?.channelId as string,
						roomName: callGroup?.meetingCode as string
					})
				).unwrap();

				if (result) {
					if (isJoined && voiceInfo) {
						// handleLeaveRoom();
					}

					// await participantMeetState(ParticipantMeetState.JOIN, callGroup?.clanId as string, callGroup?.channelId as string);

					dispatch(voiceActions.setShowMicrophone(true));
					dispatch(voiceActions.setShowCamera(videoEnabled));

					dispatch(voiceActions.setGroupCallJoined(true));
					dispatch(voiceActions.setToken(result));
					dispatch(
						voiceActions.setVoiceInfo({
							clanId: callGroup?.clanId as string,
							clanName: callGroup?.clanName as string,
							channelId: callGroup?.channelId as string,
							channelLabel: callGroup?.channelLabel as string,
							channelPrivate: callGroup?.channelPrivate as number
						})
					);

					if (groupCall.state.isAnsweringCall) {
						groupCall.audio.stopAllAudio();
					}
					groupCall.state.startGroupCall();

					if (groupCall.state.isAnsweringCall && groupCall.state.storedCallData) {
						groupCall.state.clearStoredCallData();
					}

					const joinedData = createParticipantJoinedData({
						participantId: userProfile?.user?.id || '',
						participantName: userProfile?.user?.displayName || userProfile?.user?.username || '',
						participantAvatar: userProfile?.user?.avatarUrl
					});

					groupCall.signaling.sendParticipantJoined(
						callGroup?.userId || [],
						joinedData,
						callGroup?.channelId as string,
						userProfile?.user?.id as string
					);

					if (!groupCall.state.isAnsweringCall && isDm) {
						groupCall.chat.sendStartCallMessage(videoEnabled);
					}
				} else {
					dispatch(voiceActions.setToken(''));
					groupCall.audio.stopAllAudio();
				}
			} catch {
				dispatch(voiceActions.setToken(''));
				groupCall.audio.stopAllAudio();
			} finally {
				groupCall.state.setLoading(false);
			}
		};

		useEffect(() => {
			if (groupCall.state.shouldAutoJoinRoom) {
				handleJoinRoom(groupCall.state.isVideoCall);
			}
		}, [groupCall.state.shouldAutoJoinRoom, directId, groupCall.state.currentGroupId, groupCall.state.isVideoCall]);

		const handleLeaveRoom = useCallback(
			async (trackLength?: number) => {
				if (!voiceInfo?.clanId || !voiceInfo?.channelId) return;

				if (trackLength && trackLength === 1) {
					groupCall.chat.sendEndCallMessage(showCamera);
				}

				const leftData = createParticipantLeftData({
					participantId: userProfile?.user?.id || '',
					participantName: userProfile?.user?.displayName || userProfile?.user?.username || ''
				});

				groupCall.signaling.sendParticipantLeft(
					currentDmGroup?.userIds || [],
					leftData,
					currentDmGroup?.channelId as string,
					userProfile?.user?.id as string
				);

				const quitData = createQuitData({
					isVideo: showCamera,
					groupId: currentDmGroup?.channelId || '',
					callerId: userProfile?.user?.id || '',
					callerName: userProfile?.user?.displayName || userProfile?.user?.username || '',
					action: 'leave'
				}) as CallSignalingData;

				groupCall.signaling.sendGroupCallQuit(
					currentDmGroup?.userIds || [],
					quitData,
					currentDmGroup?.channelId as string,
					userProfile?.user?.id as string
				);

				groupCall.state.endGroupCall();
				dispatch(voiceActions.resetVoiceControl());
				groupCall.audio.stopAllAudio();

				// await participantMeetState(ParticipantMeetState.LEAVE, voiceInfo.clanId, voiceInfo.channelId);
			},
			[dispatch, voiceInfo, currentDmGroup, showCamera, userProfile, groupCall]
		);

		const handleFullScreen = useCallback(() => {
			if (!containerRef.current) return;

			if (!document.fullscreenElement) {
				containerRef.current
					.requestFullscreen()
					.then(() => dispatch(voiceActions.setFullScreen(true)))
					.catch(() => {});
			} else {
				document.exitFullscreen().then(() => dispatch(voiceActions.setFullScreen(false)));
			}
		}, [dispatch]);

		useEffect(() => {
			const handleFullscreenChange = () => {
				if (!document.fullscreenElement) {
					dispatch(voiceActions.setFullScreen(false));
				}
			};
			document.addEventListener('fullscreenchange', handleFullscreenChange);
			return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
		}, [dispatch]);

		const isShow = isJoined && voiceInfo?.channelId === currentDmGroup?.channelId;

		const toggleChat = () => {
			dispatch(appActions.setIsShowChatVoice(!isShowChatVoice));
		};

		const handleCancelPreCall = () => {
			handleLeaveRoom();

			const cancelData = createCancelData({
				isVideo: groupCall.state.isVideoCall,
				groupId: currentDmGroup?.channelId || '',
				callerId: userProfile?.user?.id || '',
				callerName: userProfile?.user?.displayName || userProfile?.user?.username || '',
				reason: 'cancelled'
			}) as CallSignalingData;

			groupCall.signaling.sendGroupCallCancel(
				currentDmGroup?.userIds || [],
				cancelData,
				currentDmGroup?.channelId as string,
				userProfile?.user?.id as string
			);

			// Send cancel call message with proper UX
			groupCall.chat.sendCancelCallMessage(groupCall.state.isVideoCall);

			groupCall.audio.playEndTone();
			groupCall.state.hidePreCallInterface();
		};

		const shouldShowComponent = (isDmGroup || isDm) && !showModalEvent && !isShowSettingFooter?.status && directId;

		const isActiveForCurrentGroup = directId === groupCall.state.currentGroupId;

		return (
			<>
				{groupCall.state.isShowPreCallInterface && isActiveForCurrentGroup && !groupCall.state.isAnsweringCall && (
					<div
						className={`w-widthThumnailAttachment  absolute top-0 right-0 ${!isOnMenu ? ' max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]' : ''} z-50 h-[240px]`}
					>
						<PreCallInterface
							directId={directId || ''}
							onJoinCall={handleJoinRoom}
							onCancel={handleCancelPreCall}
							loading={groupCall.state.isLoading}
						/>
					</div>
				)}

				<div
					className={`w-widthThumnailAttachment ${!shouldShowComponent || !isActiveForCurrentGroup || !isJoined ? 'hidden' : ''} absolute top-0 right-0 ${!isOnMenu ? ' max-sbm:left-0 max-sbm:!w-full max-sbm:!h-[calc(100%_-_50px)]' : ''} z-30 h-[240px]`}
				>
					{/* LiveKit Room when in call */}
					{token !== '' && serverUrl && isJoined && (
						<LiveKitRoom
							ref={containerRef}
							id="livekitRoom"
							key={token}
							className={`${!isShow || isOpenPopOut ? '!hidden' : ''} ${isVoiceFullScreen ? '!fixed !inset-0 !z-50 !w-screen !h-screen' : ''} flex`}
							audio={showMicrophone}
							video={showCamera}
							token={token}
							serverUrl={serverUrl}
							data-lk-theme="default"
						>
							<div className="flex-1 relative flex">
								<GroupVideoConference
									channelLabel={currentDmGroup?.channelLabel as string}
									onLeaveRoom={handleLeaveRoom}
									onFullScreen={handleFullScreen}
									isShowChatVoice={isShowChatVoice}
									onToggleChat={toggleChat}
								/>
							</div>
						</LiveKitRoom>
					)}
				</div>
			</>
		);
	},
	() => true
);

GroupCallComponent.displayName = 'GroupCallComponent';

export default GroupCallComponent;
