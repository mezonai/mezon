// eslint-disable-next-line @nx/enforce-module-boundaries
import { useAppParams, useAuth, useMenu } from '@mezon/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	DMCallActions,
	DirectEntity,
	appActions,
	selectCallerId,
	selectChannelCallId,
	selectCloseMenu,
	selectDmGroupCurrent,
	selectIsMuteMicrophone,
	selectIsShowMeetDM,
	selectIsShowMemberListDM,
	selectIsShowShareScreen,
	selectIsUseProfileDM,
	selectListOfCalls,
	selectLocalStream,
	selectPeerConnection,
	selectPinMessageByChannelId,
	selectSignalingDataByUserId,
	selectStatusMenu,
	selectTheme,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { useMezon } from '@mezon/transport';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Icons } from '@mezon/ui';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { AvatarImage } from '@mezon/components';
import { createImgproxyUrl, isMacDesktop } from '@mezon/utils';
import { Tooltip } from 'flowbite-react';
import { ChannelStreamMode, ChannelType, WebrtcSignalingType } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { useSelector } from 'react-redux';
import { HelpButton } from '../../ChannelTopbar';
import PinnedMessages from '../../ChannelTopbar/TopBarComponents/PinnedMessages';
import { MemberProfile } from '../../MemberProfile';
import SearchMessageChannel from '../../SearchMessageChannel';
import CreateMessageGroup from '../CreateMessageGroup';
import LabelDm from './labelDm';

export type ChannelTopbarProps = {
	readonly dmGroupId?: Readonly<string>;
};

// Todo: move to utils
const compress = async (str: string, encoding = 'gzip' as CompressionFormat) => {
	const byteArray = new TextEncoder().encode(str);
	const cs = new CompressionStream(encoding);
	const writer = cs.writable.getWriter();
	writer.write(byteArray);
	writer.close();
	const arrayBuffer = await new Response(cs.readable).arrayBuffer();
	return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
};

// Todo: move to utils
const decompress = async (compressedStr: string, encoding = 'gzip' as CompressionFormat) => {
	const binaryString = atob(compressedStr);
	const byteArray = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		byteArray[i] = binaryString.charCodeAt(i);
	}

	const cs = new DecompressionStream(encoding);
	const writer = cs.writable.getWriter();
	writer.write(byteArray);
	writer.close();

	const arrayBuffer = await new Response(cs.readable).arrayBuffer();
	return new TextDecoder().decode(arrayBuffer);
};

function DmTopbar({ dmGroupId }: ChannelTopbarProps) {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(dmGroupId ?? ''));
	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const appearanceTheme = useSelector(selectTheme);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const listOfCalls = useSelector(selectListOfCalls) ?? [];
	const channelCallId = useSelector(selectChannelCallId) ?? [];
	const avatarImages = currentDmGroup?.channel_avatar || [];
	const isMuteMicrophone = useSelector(selectIsMuteMicrophone);
	const isShowShareScreen = useSelector(selectIsShowShareScreen);
	const isShowMeetDM = useSelector(selectIsShowMeetDM);
	const callerId = useSelector(selectCallerId);
	const localStream = useSelector(selectLocalStream);
	const peerConnection = useSelector(selectPeerConnection);

	const { userId } = useAuth();
	const setIsUseProfileDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsUseProfileDM(status));
		},
		[dispatch]
	);

	function createPeerConnection() {
		return new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19305' }] });
	}

	useEffect(() => {
		if (!peerConnection) {
			dispatch(DMCallActions.setPeerConnection(createPeerConnection()));
		}
	}, [dispatch, peerConnection]);

	const setIsShowMemberListDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsShowMemberListDM(status));
		},
		[dispatch]
	);

	const handleShowShareScreenToggle = () => {
		dispatch(DMCallActions.setIsShowShareScreen(!isShowShareScreen));
	};
	const handleShowMeetDm = () => {
		dispatch(DMCallActions.setIsShowMeetDM(!isShowMeetDM));
	};
	const handleMuteToggle = () => {
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
			}
		}

		dispatch(DMCallActions.setIsMuteMicrophone(!isMuteMicrophone));
	};
	const dmUserId = currentDmGroup?.user_id && currentDmGroup.user_id.length > 0 ? currentDmGroup?.user_id[0] : '';
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const mezon = useMezon();
	const [isCalling, setIsCalling] = useState(false);
	const [isRinging, setIsRinging] = useState(false);

	const dialTone = useRef(new Audio('assets/audio/dialtone.mp3'));
	const ringTone = useRef(new Audio('assets/audio/ringing.mp3'));

	const playAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
			audioRef.current.play().catch((error) => console.error('Audio playback error:', error));
			audioRef.current.loop = true;
		}
	};

	const stopAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
	};

	const endCall = useCallback(async () => {
		const user = userId || '';
		const updatedCalls = { ...listOfCalls };
		if (updatedCalls[user]) {
			updatedCalls[user] = updatedCalls[user].filter((id) => id !== dmGroupId);
		}

		await dispatch(
			DMCallActions.setListOfCalls({
				userId: user,
				event: updatedCalls
			})
		);
	}, [dispatch, listOfCalls, dmGroupId]);

	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));

	const handleEndCall = async () => {
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
			dispatch(DMCallActions.setLocalStream(null));
			peerConnection.getSenders().forEach((sender) => {
				peerConnection.removeTrack(sender);
			});

			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = null;
			}

			await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, 0, '', dmGroupId ?? '', userId ?? '');
			if (
				signalingData?.[signalingData?.length - 1]?.signalingData.data_type === 0 &&
				signalingData?.[signalingData?.length - 1]?.signalingData.json_data === ''
			) {
				endCall();
				await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, 4, '', dmGroupId ?? '', userId ?? '');
				peerConnection.close();
				dispatch(DMCallActions.setPeerConnection(createPeerConnection()));
			}
			dispatch(DMCallActions.setChannelCallId(''));
		}
	};
	const setListOfCalls = useCallback(
		async (dmGroupId: string) => {
			setIsCalling(true);
			playAudio(dialTone);

			startCall();
			await dispatch(DMCallActions.setCallerId(userId));
			await dispatch(DMCallActions.setCalleeId(dmUserId));

			const updatedCalls = JSON.parse(JSON.stringify(listOfCalls));

			if (!updatedCalls[userId || '']) {
				updatedCalls[userId || ''] = [];
			}
			updatedCalls[userId || ''].push(dmGroupId);

			await dispatch(
				DMCallActions.setListOfCalls({
					userId: userId || '',
					event: updatedCalls
				})
			);
		},
		[dispatch, listOfCalls, userId, dmUserId]
	);

	useEffect(() => {
		peerConnection.onicecandidate = async (event: any) => {
			if (event && event.candidate) {
				if (mezon.socketRef.current?.isOpen() === true) {
					await mezon.socketRef.current?.forwardWebrtcSignaling(
						dmUserId,
						WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
						JSON.stringify(event.candidate),
						dmGroupId ?? '',
						userId ?? ''
					);
				}
			}
		};

		peerConnection.ontrack = (event: any) => {
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
		};

		if (!signalingData?.[signalingData?.length - 1]) return;
		const data = signalingData?.[signalingData?.length - 1]?.signalingData;

		switch (signalingData?.[signalingData?.length - 1]?.signalingData.data_type) {
			case WebrtcSignalingType.WEBRTC_SDP_OFFER:
				{
					if (!isCalling) {
						setIsRinging(true);
						playAudio(ringTone);
					} else {
						setIsCalling(false);
						stopAudio(dialTone);
					}
					const processData = async () => {
						const dataDec = await decompress(data?.json_data);
						const objData = JSON.parse(dataDec || '{}');

						await peerConnection.setRemoteDescription(new RTCSessionDescription(objData));
						const answer = await peerConnection.createAnswer();
						await peerConnection.setLocalDescription(answer);

						const answerEn = await compress(JSON.stringify(answer));
						await mezon.socketRef.current?.forwardWebrtcSignaling(
							dmUserId,
							WebrtcSignalingType.WEBRTC_SDP_ANSWER,
							answerEn,
							dmGroupId ?? '',
							userId ?? ''
						);
					};
					processData().catch(console.error);
				}

				break;
			case WebrtcSignalingType.WEBRTC_SDP_ANSWER:
				{
					const processData = async () => {
						const dataDec = await decompress(data.json_data);
						const objData = JSON.parse(dataDec || '{}');
						await peerConnection.setRemoteDescription(new RTCSessionDescription(objData));
					};
					processData().catch(console.error);
				}
				break;
			case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE:
				{
					const processData = async () => {
						const objData = JSON.parse(data?.json_data || '{}');
						await peerConnection.addIceCandidate(new RTCIceCandidate(objData));
					};
					processData().catch(console.error);
				}
				break;
			default:
				break;
		}
	}, [mezon.socketRef, peerConnection, signalingData, channelCallId]);

	const startCall = async () => {
		let newPeerConnection = peerConnection;

		if (peerConnection.connectionState === 'closed') {
			newPeerConnection = createPeerConnection();
		}

		await dispatch(DMCallActions.setCallerId(userId));
		await dispatch(DMCallActions.setChannelCallId(dmGroupId));

		if (isRinging) {
			stopAudio(ringTone);
			setIsRinging(false);
		}

		navigator.mediaDevices
			.getUserMedia({ video: false, audio: true })
			.then(async (stream) => {
				dispatch(DMCallActions.setLocalStream(stream));
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				stream.getTracks().forEach((track) => newPeerConnection.addTrack(track, stream));

				const offer = await newPeerConnection.createOffer({
					iceRestart: true,
					offerToReceiveAudio: true,
					offerToReceiveVideo: true
				});
				await newPeerConnection.setLocalDescription(offer);
				if (offer && mezon.socketRef.current) {
					const offerEn = await compress(JSON.stringify(offer));
					await mezon.socketRef.current?.forwardWebrtcSignaling(
						dmUserId,
						WebrtcSignalingType.WEBRTC_SDP_OFFER,
						offerEn,
						dmGroupId ?? '',
						userId ?? ''
					);
				}
			})
			.catch((err) => console.error('Failed to get local media:', err));
	};

	return (
		<>
			{!listOfCalls[userId || '']?.includes(dmGroupId ?? '') ? (
				<div
					className={`flex h-heightTopBar p-3 min-w-0 items-center dark:bg-bgPrimary bg-bgLightPrimary shadow border-b-[1px] dark:border-bgTertiary border-bgLightTertiary flex-shrink ${isMacDesktop ? 'draggable-area' : ''}`}
				>
					<div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
						<div className="flex flex-row gap-1 items-center flex-1">
							<div onClick={() => setStatusMenu(true)} className={`mx-6 ${closeMenu && !statusMenu ? '' : 'hidden'}`} role="button">
								<Icons.OpenMenu defaultSize={`w-5 h-5`} />
							</div>
							<MemberProfile
								numberCharacterCollapse={22}
								avatar={
									Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP
										? 'assets/images/avatar-group.png'
										: (currentDmGroup?.channel_avatar?.at(0) ?? '')
								}
								name={currentDmGroup?.usernames || `${currentDmGroup?.creator_name}'s Group`}
								status={{ status: currentDmGroup?.is_online?.some(Boolean), isMobile: false }}
								isHideStatus={true}
								isHideIconStatus={Boolean(currentDmGroup?.user_id && currentDmGroup.user_id.length >= 2)}
								key={currentDmGroup?.channel_id}
								isHiddenAvatarPanel={true}
							/>
							<LabelDm dmGroupId={dmGroupId || ''} currentDmGroup={currentDmGroup} />
						</div>

						<div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
							<div className=" items-center gap-2 flex">
								<div className="justify-start items-center gap-[15px] flex">
									<button onClick={() => setListOfCalls(dmGroupId ?? '')}>
										<Tooltip
											content="Start voice call"
											trigger="hover"
											animation="duration-500"
											style={appearanceTheme === 'light' ? 'light' : 'dark'}
										>
											<Icons.IconPhoneDM
												className={`dark:hover:text-white hover:text-black dark:text-[#B5BAC1] text-colorTextLightMode`}
											/>
										</Tooltip>
									</button>
									<div>
										<CallButton
											isLightMode={appearanceTheme === 'light'}
											dmUserId={currentDmGroup?.user_id && currentDmGroup.user_id.length > 0 ? currentDmGroup?.user_id[0] : ''}
										/>
									</div>
									<div>
										<PinButton isLightMode={appearanceTheme === 'light'} />
									</div>
									<AddMemberToGroupDm currentDmGroup={currentDmGroup} appearanceTheme={appearanceTheme} />
									{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
										<button onClick={() => setIsShowMemberListDM(!isShowMemberListDM)}>
											<Tooltip
												content="Show Member List"
												trigger="hover"
												animation="duration-500"
												style={appearanceTheme === 'light' ? 'light' : 'dark'}
											>
												<Icons.MemberList isWhite={isShowMemberListDM} />
											</Tooltip>
										</button>
									)}
									{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
										<button onClick={() => setIsUseProfileDM(!isUseProfileDM)}>
											<Tooltip
												content="Show User Profile"
												trigger="hover"
												animation="duration-500"
												style={appearanceTheme === 'light' ? 'light' : 'dark'}
											>
												<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
											</Tooltip>
										</button>
									)}
								</div>
								<SearchMessageChannel
									mode={
										currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
											? ChannelStreamMode.STREAM_MODE_DM
											: ChannelStreamMode.STREAM_MODE_GROUP
									}
								/>
								<div
									className={`gap-4 relative flex  w-fit h-8 justify-center items-center left-[345px] ssm:left-auto ssm:right-0`}
									id="inBox"
								>
									{/* <InboxButton /> */}
									<HelpButton />
								</div>
							</div>
						</div>
						{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
							<button onClick={() => setIsShowMemberListDM(!isShowMemberListDM)} className="sbm:hidden">
								<Tooltip
									content="Show Member List"
									trigger="hover"
									animation="duration-500"
									style={appearanceTheme === 'light' ? 'light' : 'dark'}
								>
									<Icons.MemberList isWhite={isShowMemberListDM} />
								</Tooltip>
							</button>
						)}
						{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
							<button onClick={() => setIsUseProfileDM(!isUseProfileDM)} className="sbm:hidden">
								<Tooltip
									content="Show User Profile"
									trigger="hover"
									animation="duration-500"
									style={appearanceTheme === 'light' ? 'light' : 'dark'}
								>
									<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
								</Tooltip>
							</button>
						)}
					</div>
				</div>
			) : (
				<div
					className={`flex flex-col min-h-[240px] z-10 relative w-full h-heightTopBar p-3 min-w-0 items-center dark:bg-bgTertiary bg-bgLightPrimary shadow border-b-[1px] dark:border-bgTertiary border-bgLightTertiary flex-shrink ${isMacDesktop ? 'draggable-area' : ''}`}
				>
					<div className="sbm:justify-start justify-between items-center gap-1 flex w-full">
						<div className="flex flex-row gap-1 items-center flex-1">
							<div onClick={() => setStatusMenu(true)} className={`mx-6 ${closeMenu && !statusMenu ? '' : 'hidden'}`} role="button">
								<Icons.OpenMenu defaultSize={`w-5 h-5`} />
							</div>
							<MemberProfile
								numberCharacterCollapse={22}
								avatar={
									Number(currentDmGroup?.type) === ChannelType.CHANNEL_TYPE_GROUP
										? 'assets/images/avatar-group.png'
										: (currentDmGroup?.channel_avatar?.at(0) ?? '')
								}
								name={currentDmGroup?.usernames || `${currentDmGroup?.creator_name}'s Group`}
								status={{ status: currentDmGroup?.is_online?.some(Boolean), isMobile: false }}
								isHideStatus={true}
								isHideIconStatus={Boolean(currentDmGroup?.user_id && currentDmGroup.user_id.length >= 2)}
								key={currentDmGroup?.channel_id}
								isHiddenAvatarPanel={true}
							/>
							<LabelDm dmGroupId={dmGroupId || ''} currentDmGroup={currentDmGroup} />
						</div>

						<div className=" items-center h-full ml-auto hidden justify-end ssm:flex">
							<div className=" items-center gap-2 flex">
								<div className="justify-start items-center gap-[15px] flex">
									<div>
										<PinButton isLightMode={appearanceTheme === 'light'} />
									</div>
									<AddMemberToGroupDm currentDmGroup={currentDmGroup} appearanceTheme={appearanceTheme} />
									{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
										<button onClick={() => setIsShowMemberListDM(!isShowMemberListDM)}>
											<Tooltip
												content="Show Member List"
												trigger="hover"
												animation="duration-500"
												style={appearanceTheme === 'light' ? 'light' : 'dark'}
											>
												<Icons.MemberList isWhite={isShowMemberListDM} />
											</Tooltip>
										</button>
									)}
									{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
										<button onClick={() => setIsUseProfileDM(!isUseProfileDM)}>
											<Tooltip
												content="Show User Profile"
												trigger="hover"
												animation="duration-500"
												style={appearanceTheme === 'light' ? 'light' : 'dark'}
											>
												<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
											</Tooltip>
										</button>
									)}
								</div>
								<SearchMessageChannel
									mode={
										currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM
											? ChannelStreamMode.STREAM_MODE_DM
											: ChannelStreamMode.STREAM_MODE_GROUP
									}
								/>
								<div
									className={`gap-4 relative flex  w-fit h-8 justify-center items-center left-[345px] ssm:left-auto ssm:right-0`}
									id="inBox"
								>
									{/* <InboxButton /> */}
									<HelpButton />
								</div>
							</div>
						</div>
						{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP && (
							<button onClick={() => setIsShowMemberListDM(!isShowMemberListDM)} className="sbm:hidden">
								<Tooltip
									content="Show Member List"
									trigger="hover"
									animation="duration-500"
									style={appearanceTheme === 'light' ? 'light' : 'dark'}
								>
									<Icons.MemberList isWhite={isShowMemberListDM} />
								</Tooltip>
							</button>
						)}
						{currentDmGroup?.type === ChannelType.CHANNEL_TYPE_DM && (
							<button onClick={() => setIsUseProfileDM(!isUseProfileDM)} className="sbm:hidden">
								<Tooltip
									content="Show User Profile"
									trigger="hover"
									animation="duration-500"
									style={appearanceTheme === 'light' ? 'light' : 'dark'}
								>
									<Icons.IconUserProfileDM isWhite={isUseProfileDM} />
								</Tooltip>
							</button>
						)}
					</div>
					<div className="w-full h-full flex flex-col justify-around">
						<div className="justify-center items-center gap-4 flex w-full">
							{avatarImages.map((avatar, index) => (
								<AvatarImage
									height={'75px'}
									alt={`Avatar ${index + 1}`}
									userName={`Avatar ${index + 1}`}
									className="min-w-[75px] min-h-[75px] max-w-[75px] max-h-[75px] font-semibold"
									srcImgProxy={createImgproxyUrl(avatar ?? '', { width: 300, height: 300, resizeType: 'fit' })}
									src={avatar}
									classNameText="!text-4xl font-semibold"
								/>
							))}
							<video
								ref={localVideoRef}
								autoPlay
								muted
								playsInline
								style={{
									width: '400px',
									height: '300px',
									backgroundColor: 'black',
									borderRadius: '8px',
									display: 'none'
								}}
							/>

							<video
								ref={remoteVideoRef}
								autoPlay
								playsInline
								style={{
									width: '400px',
									height: '300px',
									backgroundColor: 'black',
									borderRadius: '8px',
									display: 'none'
								}}
							/>
						</div>
						<div className="justify-center items-center gap-4 flex w-full">
							{(callerId === '' || channelCallId !== dmGroupId) && (
								<>
									<div
										className={`h-[56px] w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
									>
										<Icons.IconMeetDM />
									</div>
									<div
										className={`h-[56px] w-[56px] rounded-full bg-green-500 hover:bg-green-700 flex items-center justify-center cursor-pointer`}
										onClick={startCall}
									>
										<Icons.IconPhoneDM />
									</div>
									<div
										className={`h-[56px] w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
									>
										<Icons.CloseButton className={`w-[20px]`} />
									</div>
								</>
							)}
							{callerId === userId && channelCallId === dmGroupId && (
								<>
									<div
										className={`h-[56px] w-[56px] rounded-full flex items-center justify-center cursor-pointer  ${isShowShareScreen ? 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
										onClick={handleShowMeetDm}
									>
										<Icons.IconMeetDM
											className={`${isShowMeetDM ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
											isShowMeetDM={isShowMeetDM}
											isShowLine={true}
										/>
									</div>
									<div
										className={`h-[56px] w-[56px] rounded-full flex items-center justify-center cursor-pointer  ${isShowShareScreen ? 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
										onClick={handleShowShareScreenToggle}
									>
										<Icons.ShareScreen
											className={`${isShowShareScreen ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
											isShowShareScreen={isShowShareScreen}
											isShowLine={true}
										/>
									</div>
									<div
										className={`h-[56px] w-[56px] rounded-full flex items-center justify-center cursor-pointer ${isMuteMicrophone ? 'dark:bg-bgSecondary bg-bgLightMode dark:hover:bg-neutral-400 hover:bg-neutral-400' : 'dark:bg-bgLightMode dark:hover:bg-neutral-400 bg-neutral-500 hover:bg-bgSecondary'}`}
										onClick={handleMuteToggle}
									>
										<Icons.Microphone
											className={`${isMuteMicrophone ? 'text-bgPrimary dark:text-white' : 'text-white dark:text-bgTertiary'}`}
											isMuteMicrophone={isMuteMicrophone}
											isShowLine={true}
										/>
									</div>
									<div
										className={`h-[56px] w-[56px] rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center cursor-pointer`}
										onClick={handleEndCall}
									>
										<Icons.StopCall />
									</div>
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

function PinButton({ isLightMode }: { isLightMode: boolean }) {
	const [isShowPinMessage, setIsShowPinMessage] = useState<boolean>(false);
	const threadRef = useRef<HTMLDivElement>(null);

	const handleShowPinMessage = () => {
		setIsShowPinMessage(!isShowPinMessage);
	};

	const handleClose = useCallback(() => {
		setIsShowPinMessage(false);
	}, []);

	const { directId } = useAppParams();
	const pinMsgs = useSelector(selectPinMessageByChannelId(directId));

	return (
		<div className="relative leading-5 size-6" ref={threadRef}>
			<Tooltip
				className={`${isShowPinMessage && 'hidden'} w-[142px]`}
				content="Pinned Messages"
				trigger="hover"
				animation="duration-500"
				style={isLightMode ? 'light' : 'dark'}
			>
				<button className="focus-visible:outline-none" onClick={handleShowPinMessage} onContextMenu={(e) => e.preventDefault()}>
					<Icons.PinRight isWhite={isShowPinMessage} />
				</button>
				{pinMsgs?.length > 0 && (
					<span className="w-[10px] h-[10px] rounded-full bg-[#DA373C] absolute bottom-0 right-[3px] border-[1px] border-solid dark:border-bgPrimary border-white"></span>
				)}
			</Tooltip>
			{isShowPinMessage && <PinnedMessages onClose={handleClose} rootRef={threadRef} />}
		</div>
	);
}

const AddMemberToGroupDm = ({ currentDmGroup, appearanceTheme }: { currentDmGroup: DirectEntity; appearanceTheme: string }) => {
	const [openAddToGroup, setOpenAddToGroup] = useState<boolean>(false);
	const handleOpenAddToGroupModal = () => {
		setOpenAddToGroup(!openAddToGroup);
	};
	const rootRef = useRef<HTMLDivElement>(null);
	return (
		<div onClick={handleOpenAddToGroupModal} ref={rootRef} className="cursor-pointer">
			{openAddToGroup && (
				<div className="relative top-4">
					<CreateMessageGroup
						currentDM={currentDmGroup}
						isOpen={openAddToGroup}
						onClose={handleOpenAddToGroupModal}
						classNames="right-0 left-auto"
						rootRef={rootRef}
					/>
				</div>
			)}
			<Tooltip content="Add friends to DM" trigger="hover" animation="duration-500" style={appearanceTheme === 'light' ? 'light' : 'dark'}>
				<Icons.IconAddFriendDM />
			</Tooltip>
		</div>
	);
};

function CallButton({ isLightMode, dmUserId }: { isLightMode: boolean; dmUserId: string }) {
	const [isShow, setIsShow] = useState<boolean>(false);
	const threadRef = useRef<HTMLDivElement>(null);
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const mezon = useMezon();
	const { userId } = useAuth();
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const peerConnection = useMemo(() => {
		return new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19305' }] });
	}, []);

	useEffect(() => {
		peerConnection.onicecandidate = async (event: any) => {
			if (event && event.candidate) {
				if (mezon.socketRef.current?.isOpen() === true) {
					await mezon.socketRef.current?.forwardWebrtcSignaling(
						dmUserId,
						WebrtcSignalingType.WEBRTC_ICE_CANDIDATE,
						JSON.stringify(event.candidate),
						'',
						userId ?? ''
					);
				}
			}
		};

		peerConnection.ontrack = (event: any) => {
			// Display remote stream in remote video element
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
		};

		if (!signalingData?.[signalingData?.length - 1]) return;
		const data = signalingData?.[signalingData?.length - 1]?.signalingData;

		switch (signalingData?.[signalingData?.length - 1]?.signalingData.data_type) {
			case WebrtcSignalingType.WEBRTC_SDP_OFFER:
				{
					const processData = async () => {
						const dataDec = await decompress(data?.json_data);
						const objData = JSON.parse(dataDec || '{}');

						// Get peerConnection from receiver event.receiverId
						await peerConnection.setRemoteDescription(new RTCSessionDescription(objData));
						const answer = await peerConnection.createAnswer();
						await peerConnection.setLocalDescription(answer);

						const answerEnc = await compress(JSON.stringify(answer));
						await mezon.socketRef.current?.forwardWebrtcSignaling(
							dmUserId,
							WebrtcSignalingType.WEBRTC_SDP_ANSWER,
							answerEnc,
							'',
							userId ?? ''
						);
					};
					processData().catch(console.error);
				}

				break;
			case WebrtcSignalingType.WEBRTC_SDP_ANSWER:
				{
					const processData = async () => {
						const dataDec = await decompress(data.json_data);
						const objData = JSON.parse(dataDec || '{}');
						await peerConnection.setRemoteDescription(new RTCSessionDescription(objData));
					};
					processData().catch(console.error);
				}
				break;
			case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE:
				{
					const processData = async () => {
						const objData = JSON.parse(data?.json_data || '{}');
						await peerConnection.addIceCandidate(new RTCIceCandidate(objData));
					};
					processData().catch(console.error);
				}
				break;
			default:
				break;
		}
	}, [mezon.socketRef, peerConnection, signalingData]);

	const handleShow = async () => {
		setIsShow(true);
	};

	const startCall = async () => {
		// Get user media
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: true })
			.then(async (stream) => {
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				// Add tracks to PeerConnection
				stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

				const offer = await peerConnection.createOffer({
					iceRestart: true,
					offerToReceiveAudio: true,
					offerToReceiveVideo: true
				});
				await peerConnection.setLocalDescription(offer);
				if (offer && mezon.socketRef.current) {
					const offerEnc = await compress(JSON.stringify(offer));
					await mezon.socketRef.current?.forwardWebrtcSignaling(dmUserId, WebrtcSignalingType.WEBRTC_SDP_OFFER, offerEnc, '', userId ?? '');
				}
			})
			.catch((err) => console.error('Failed to get local media:', err));
	};

	// const handleClose = useCallback(() => {
	// 	setIsShow(false);
	// }, []);

	const endCall = async () => {
		setIsShow(false);
		peerConnection.close();
	};

	const { directId } = useAppParams();
	const pinMsgs = useSelector(selectPinMessageByChannelId(directId));

	return (
		<div className="relative leading-5 size-6" ref={threadRef}>
			<Tooltip content="Start Video Call" trigger="hover" animation="duration-500" style={isLightMode ? 'light' : 'dark'}>
				<button className="focus-visible:outline-none" onClick={handleShow} onContextMenu={(e) => e.preventDefault()}>
					<Icons.IconMeetDM
						className={`dark:hover:text-white hover:text-black ${isShow ? 'dark:text-white text-black' : 'dark:text-[#B5BAC1] text-colorTextLightMode'}`}
					/>
				</button>
				{pinMsgs?.length > 0 && (
					<span className="w-[10px] h-[10px] rounded-full bg-[#DA373C] absolute bottom-0 right-[3px] border-[1px] border-solid dark:border-bgPrimary border-white"></span>
				)}
			</Tooltip>
			{isShow && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
					{/* Modal nội dung */}
					<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-[900px] max-h-[90vh] overflow-hidden flex flex-col items-center">
						<h2 className="text-lg font-semibold text-black dark:text-white mb-4">Video Call</h2>
						<div className="flex justify-between space-x-4">
							{/* Local Video */}
							<video
								ref={localVideoRef}
								autoPlay
								muted
								playsInline
								style={{
									width: '400px',
									height: '300px',
									backgroundColor: 'black',
									borderRadius: '8px'
								}}
							/>
							{/* Remote Video */}
							<video
								ref={remoteVideoRef}
								autoPlay
								playsInline
								style={{
									width: '400px',
									height: '300px',
									backgroundColor: 'black',
									borderRadius: '8px'
								}}
							/>
						</div>
						<div className="flex space-x-4 mt-6">
							<button onClick={startCall} className="px-6 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600">
								Start Call
							</button>
							<button onClick={endCall} className="px-6 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600">
								End
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

DmTopbar.Skeleton = () => {
	return (
		<div className="flex  h-heightTopBar min-w-0 items-center bg-bgSecondary border-b border-black px-3 pt-4 pb-6 flex-shrink">
			<Skeleton width={38} height={38} />
		</div>
	);
};

export default DmTopbar;
