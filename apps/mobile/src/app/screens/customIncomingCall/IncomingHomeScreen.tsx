import { size, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, selectAllAccount, selectSignalingDataByUserId, useAppDispatch, useAppSelector } from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import LottieView from 'lottie-react-native';
import { safeJSONParse, WebrtcSignalingFwd, WebrtcSignalingType } from 'mezon-js';
import * as React from 'react';
import { memo, useEffect } from 'react';
import { BackHandler, Image, ImageBackground, NativeModules, Text, TouchableOpacity, View } from 'react-native';
import { Bounce } from 'react-native-animated-spinkit';
import { useSelector } from 'react-redux';
import { DirectMessageCall } from '../messages/DirectMessageCall';

import LOTTIE_PHONE_DECLINE from './phone-decline.json';
import LOTTIE_PHONE_RING from './phone-ring.json';
import { style } from './styles';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import BG_CALLING from './bgCalling.png';

const AVATAR_DEFAULT = 'https://cdn.mezon.vn/1775731152322039808/1820659489792069632/mezon_logo.png';
const { FullScreenNotificationIncomingCall, SharedPreferences } = NativeModules;
const IncomingHomeScreen = memo((props: any) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const [isInCall, setIsInCall] = React.useState(false);
	const userProfile = useSelector(selectAllAccount);
	const signalingData = useAppSelector((state) => selectSignalingDataByUserId(state, userProfile?.user?.id || ''));
	const mezon = useMezon();

	const getDataCall = async () => {
		try {
			await SharedPreferences.removeItem('notificationDataCalling');
			const payload = safeJSONParse(props?.payload || '{}');
			if (payload?.offer !== 'CANCEL_CALL' && !!payload?.offer) {
				const signalingData = {
					channel_id: payload?.channelId,
					json_data: payload?.offer,
					data_type: WebrtcSignalingType.WEBRTC_SDP_OFFER,
					caller_id: payload?.callerId,
					receiver_id: userProfile?.user?.id
				};
				dispatch(
					DMCallActions.addOrUpdate({
						calleeId: userProfile?.user?.id,
						signalingData: signalingData as WebrtcSignalingFwd,
						id: payload?.callerId,
						callerId: payload?.callerId
					})
				);
			}
		} catch (error) {
			console.error('Failed to retrieve data', error);
		}
	};

	useEffect(() => {
		let timer;
		if (props?.isForceAnswer && signalingData?.[signalingData?.length - 1]?.callerId) {
			timer = setTimeout(() => {
				onJoinCall();
			}, 1000);
		}

		return () => {
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, [signalingData]);

	useEffect(() => {
		if (props && props?.payload) {
			getDataCall();
		}
	}, [props]);

	const params = {
		receiverId: signalingData?.[signalingData?.length - 1]?.callerId,
		receiverAvatar: props?.avatar || '',
		isAnswerCall: true,
		isFromNative: true
	};

	const onDeniedCall = async () => {
		const latestSignalingEntry = signalingData?.[signalingData?.length - 1];
		if (!latestSignalingEntry || !mezon.socketRef.current) {
			BackHandler.exitApp();
			return;
		}

		await mezon.socketRef.current?.forwardWebrtcSignaling(
			latestSignalingEntry?.callerId,
			WebrtcSignalingType.WEBRTC_SDP_QUIT,
			'',
			latestSignalingEntry?.signalingData?.channel_id,
			''
		);
		dispatch(DMCallActions.removeAll());
		BackHandler.exitApp();
	};

	const onJoinCall = () => {
		if (!signalingData?.[signalingData?.length - 1]?.callerId) return;
		FullScreenNotificationIncomingCall.triggerNotificationClick('ACTION_PRESS_ANSWER_CALL', 'RNNotificationAnswerAction');
		dispatch(DMCallActions.setIsInCall(true));
		setIsInCall(true);
	};

	if (isInCall) {
		return <DirectMessageCall route={{ params }} />;
	}

	return (
		<ImageBackground source={BG_CALLING} style={styles.container}>
			{/* Caller Info */}
			<View style={styles.headerCall}>
				<Text style={styles.callerName}>{'Incoming Call'}</Text>
				<Image
					source={{
						uri: props?.avatar || AVATAR_DEFAULT
					}}
					style={styles.callerImage}
				/>
				<Text style={styles.callerInfo}>{props?.info || ''}</Text>
			</View>

			{/* Decline and Answer Buttons */}
			{!props?.isForceAnswer ? (
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
			) : (
				<View style={styles.wrapperConnecting}>
					<Bounce size={size.s_80} color="#fff" />
					<Text style={styles.callerName}>Connecting...</Text>
				</View>
			)}
		</ImageBackground>
	);
});

export default IncomingHomeScreen;
