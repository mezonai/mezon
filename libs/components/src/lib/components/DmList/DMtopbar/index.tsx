// eslint-disable-next-line @nx/enforce-module-boundaries
import { useAppParams, useAuth, useMenu } from '@mezon/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import {
	DirectEntity,
	appActions,
	selectCloseMenu,
	selectDmGroupCurrent,
	selectIsShowMemberListDM,
	selectIsUseProfileDM,
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
import { isMacDesktop } from '@mezon/utils';
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

function DmTopbar({ dmGroupId }: ChannelTopbarProps) {
	const dispatch = useAppDispatch();
	const currentDmGroup = useSelector(selectDmGroupCurrent(dmGroupId ?? ''));
	const { setStatusMenu } = useMenu();
	const closeMenu = useSelector(selectCloseMenu);
	const statusMenu = useSelector(selectStatusMenu);
	const isShowMemberListDM = useSelector(selectIsShowMemberListDM);
	const appearanceTheme = useSelector(selectTheme);
	const isUseProfileDM = useSelector(selectIsUseProfileDM);
	const setIsUseProfileDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsUseProfileDM(status));
		},
		[dispatch]
	);

	const setIsShowMemberListDM = useCallback(
		async (status: boolean) => {
			await dispatch(appActions.setIsShowMemberListDM(status));
		},
		[dispatch]
	);

	return (
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
							<button>
								<Tooltip
									content="Start voice call"
									trigger="hover"
									animation="duration-500"
									style={appearanceTheme === 'light' ? 'light' : 'dark'}
								>
									<Icons.IconPhoneDM />
								</Tooltip>
							</button>
							<div>
								<CallButton isLightMode={appearanceTheme === 'light'} />
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

function CallButton({ isLightMode }: { isLightMode: boolean }) {
	const [isShow, setIsShow] = useState<boolean>(false);
	const threadRef = useRef<HTMLDivElement>(null);
	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const mezon = useMezon();
	const { userId } = useAuth();
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userId || ''));
	const peerConnection = useMemo(() => {
		return new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
	}, []);

	useEffect(() => {
		peerConnection.onicecandidate = (event: any) => {
			if (event && event.candidate) {
				if (mezon.socketRef.current?.isOpen() === true) {
					mezon.socketRef.current
						?.forwardWebrtcSignaling('', WebrtcSignalingType.WEBRTC_ICE_CANDIDATE, JSON.stringify(event.candidate))
						.then((ok) => {
							// eslint-disable-next-line no-console
							console.log('onicecandidate: ', ok);
						})
						.catch((err) => {
							console.error('Error sending ICE candidate:', err, event.candidate);
						});
				}
			}
		};

		peerConnection.ontrack = (event: any) => {
			// Display remote stream in remote video element
			if (remoteVideoRef.current) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
		};

		// Get user media
		navigator.mediaDevices
			.getUserMedia({ video: false, audio: true })
			.then((stream) => {
				if (localVideoRef.current) {
					localVideoRef.current.srcObject = stream;
				}
				// Add tracks to PeerConnection
				stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
			})
			.catch((err) => console.error('Failed to get local media:', err));
		if (!signalingData?.[0]) return;
		const data = signalingData[0].signalingData;
		const objData = JSON.parse(data.jsonData);
		switch (signalingData[0].signalingData.dataType) {
			case WebrtcSignalingType.WEBRTC_SDP_OFFER:
				{
					const processData = async () => {
						// Get peerConnection from receiver event.receiverId
						await peerConnection.setRemoteDescription(new RTCSessionDescription(objData));
						const answer = await peerConnection.createAnswer();
						await peerConnection.setLocalDescription(answer);
					};

					processData().catch(console.error);
				}

				break;
			case WebrtcSignalingType.WEBRTC_SDP_ANSWER:
				{
					const processData = async () => {
						await peerConnection.setRemoteDescription(new RTCSessionDescription(objData));
					};

					processData().catch(console.error);
				}
				break;
			case WebrtcSignalingType.WEBRTC_ICE_CANDIDATE:
				{
					const processData = async () => {
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
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);
		if (offer) {
			await mezon.socketRef.current?.forwardWebrtcSignaling('', WebrtcSignalingType.WEBRTC_SDP_OFFER, JSON.stringify(offer));
		}
	};

	const handleClose = useCallback(() => {
		setIsShow(false);
	}, []);

	const { directId } = useAppParams();
	const pinMsgs = useSelector(selectPinMessageByChannelId(directId));

	return (
		<div className="relative leading-5 size-6" ref={threadRef}>
			<Tooltip content="Start Video Call" trigger="hover" animation="duration-500" style={isLightMode ? 'light' : 'dark'}>
				<button className="focus-visible:outline-none" onClick={handleShow} onContextMenu={(e) => e.preventDefault()}>
					<Icons.IconMeetDM isWhite={isShow} />
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
							<button onClick={() => setIsShow(false)} className="px-6 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600">
								Close
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
