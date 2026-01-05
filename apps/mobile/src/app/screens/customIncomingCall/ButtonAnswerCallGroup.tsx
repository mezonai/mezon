import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { selectCurrentUserId } from '@mezon/store-mobile';
import { WEBRTC_SIGNALING_TYPES } from '@mezon/utils';
import LottieView from 'lottie-react-native';
import * as React from 'react';
import { forwardRef, memo, useImperativeHandle } from 'react';
import { DeviceEventEmitter, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSendSignaling } from '../../components/CallingGroupModal';
import LOTTIE_PHONE_DECLINE from './phone-decline.json';
import LOTTIE_PHONE_RING from './phone-ring.json';
import { style } from './styles';

export interface ButtonAnswerCallGroupRef {
	onDeniedCall: () => Promise<void>;
}

const ButtonAnswerCallGroup = memo(
	forwardRef<ButtonAnswerCallGroupRef, any>(({ dataCallGroup, onDeniedCallGroup, onJoinCallGroup }, ref) => {
		const { themeValue } = useTheme();
		const styles = style(themeValue);
		const userId = useSelector(selectCurrentUserId);
		const { sendSignalingToParticipants } = useSendSignaling();

		const onDeniedCall = async () => {
			const quitAction = {
				is_video: false,
				groupId: dataCallGroup.groupId || '',
				caller_id: userId,
				caller_name: dataCallGroup.groupName || '',
				timestamp: Date.now(),
				action: 'decline'
			};
			sendSignalingToParticipants(
				[dataCallGroup?.callerId],
				WEBRTC_SIGNALING_TYPES.GROUP_CALL_QUIT,
				quitAction,
				dataCallGroup?.groupId || '',
				userId || ''
			);
			onDeniedCallGroup();
			return;
		};

		const handleJoinCallGroup = async (dataCall: any) => {
			if (dataCall?.groupId) {
				if (!dataCall?.meetingCode) return;
				const data = {
					channelId: dataCall.groupId || '',
					roomName: dataCall?.meetingCode,
					isGroupCall: true,
					clanId: ''
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_OPEN_MEZON_MEET, data);
				const joinAction = {
					participant_id: userId,
					participant_name: '',
					participant_avatar: '',
					timestamp: Date.now()
				};
				sendSignalingToParticipants(
					[dataCall?.callerId],
					WEBRTC_SIGNALING_TYPES.GROUP_CALL_PARTICIPANT_JOINED,
					joinAction,
					dataCall?.channelId || '',
					userId || ''
				);
			}
		};

		const onJoinCall = async () => {
			await handleJoinCallGroup(dataCallGroup);
			onJoinCallGroup();
		};

		useImperativeHandle(ref, () => ({
			onDeniedCall
		}));

		return (
			<View style={styles.buttonContainer}>
				<TouchableOpacity onPress={onDeniedCall}>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
					{/*// @ts-expect-error*/}
					<LottieView source={LOTTIE_PHONE_DECLINE} autoPlay loop style={styles.deniedCall} />
				</TouchableOpacity>

				<TouchableOpacity onPress={onJoinCall}>
					<LottieView source={LOTTIE_PHONE_RING} autoPlay loop style={styles.answerCall} />
				</TouchableOpacity>
			</View>
		);
	})
);

export default ButtonAnswerCallGroup;
