import { useRoomContext } from '@livekit/react-native';
import { CallSignalingData } from '@mezon/components';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, useTheme } from '@mezon/mobile-ui';
import {
	getStore,
	groupCallActions,
	messagesActions,
	selectAllAccount,
	selectCurrentDM,
	selectIsShowPreCallInterface,
	useAppDispatch
} from '@mezon/store-mobile';
import { IMessageTypeCallLog, WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import React from 'react';
import { DeviceEventEmitter, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { useSendSignaling } from '../../../../../../components/CallingGroupModal';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { style } from '../styles';

const ButtonEndCall = ({ channelId, clanId, isGroupCall = false }: { channelId: string; clanId: string; isGroupCall?: boolean }) => {
	const dispatch = useAppDispatch();
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const isShowPreCallInterface = useSelector(selectIsShowPreCallInterface);
	const { sendSignalingToParticipants } = useSendSignaling();
	const room: any = useRoomContext();

	const handleGroupCallEnd = (type: 'cancel' | 'quit') => {
		dispatch(groupCallActions.endGroupCall());
		const store = getStore();
		const state = store.getState();
		const currentDmGroup = selectCurrentDM(state);
		const userProfile = selectAllAccount(state);

		const baseData = {
			is_video: false,
			group_id: currentDmGroup?.channel_id || '',
			caller_id: userProfile?.user?.id,
			caller_name: userProfile?.user?.display_name || userProfile?.user?.username || '',
			timestamp: Date.now()
		};

		if (type === 'quit') {
			if (room?.numParticipants === 1) {
				dispatch(
					messagesActions.sendMessage({
						channelId: currentDmGroup?.channel_id,
						clanId: '0',
						mode: ChannelStreamMode.STREAM_MODE_GROUP,
						isPublic: true,
						content: {
							t: 'Group call ended',
							callLog: {
								isVideo: false,
								callLogType: IMessageTypeCallLog.FINISHCALL,
								showCallBack: false
							}
						},
						anonymous: false,
						senderId: userProfile?.user?.id || '',
						avatar: userProfile?.user?.avatar_url || '',
						isMobile: true,
						username: currentDmGroup?.channel_label || ''
					})
				);
			}
			sendSignalingToParticipants(
				currentDmGroup?.user_id || [],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT,
				baseData as CallSignalingData,
				currentDmGroup?.channel_id || '',
				userProfile?.user?.id || ''
			);
			// if (isFromNativeCall) {
			// 	BackHandler.exitApp();
			// }
		} else if (type === 'cancel') {
			const cancelAction = {
				...baseData,
				reason: 'cancelled'
			};
			sendSignalingToParticipants(
				currentDmGroup?.user_id || [],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_CANCEL,
				cancelAction as CallSignalingData,
				currentDmGroup?.channel_id || '',
				userProfile?.user?.id || ''
			);
			groupCallActions.hidePreCallInterface();
			dispatch(
				messagesActions.sendMessage({
					channelId: currentDmGroup?.channel_id,
					clanId: '',
					mode: ChannelStreamMode.STREAM_MODE_GROUP,
					isPublic: true,
					content: {
						t: 'Cancelled voice call',
						callLog: {
							isVideo: false,
							callLogType: IMessageTypeCallLog.CANCELCALL,
							showCallBack: false
						}
					},
					anonymous: false,
					senderId: userProfile?.user?.id || '',
					avatar: userProfile?.user?.avatar_url || '',
					isMobile: true,
					username: currentDmGroup?.channel_label || ''
				})
			);
		}
		DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, {
			isEndCall: true,
			clanId: '',
			channelId: currentDmGroup?.channel_id,
			roomId: room?.roomInfo?.sid
		});
	};

	const handleEndCall = () => {
		if (isGroupCall) {
			handleGroupCallEnd(isShowPreCallInterface ? 'cancel' : 'quit');
		}
		room.disconnect();
		if (!isGroupCall) {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, { isEndCall: true, clanId, channelId, roomId: room?.roomInfo?.sid });
		}
	};

	return (
		<TouchableOpacity onPress={handleEndCall} style={{ ...styles.menuIcon, backgroundColor: baseColor.redStrong }}>
			<MezonIconCDN icon={IconCDN.phoneCallIcon} />
		</TouchableOpacity>
	);
};

export default React.memo(ButtonEndCall);
