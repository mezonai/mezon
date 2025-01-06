import {
	accountActions,
	authActions,
	DMCallActions,
	selectAllAccount,
	selectSignalingDataByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { useMezon } from '@mezon/transport';
import { IWithError } from '@mezon/utils';
import { safeJSONParse, WebrtcSignalingFwd, WebrtcSignalingType } from 'mezon-js';
import * as React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { BackHandler, Image, NativeModules, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Wave } from 'react-native-animated-spinkit';
import { useSelector } from 'react-redux';
import { DirectMessageCall } from '../messages/DirectMessageCall';

const AVATAR_DEFAULT = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKet-b99huP_BtZT_HUqvsaSz32lhrcLtIDQ&s';
const { FullScreenNotificationIncomingCall, SharedPreferences } = NativeModules;
const IncomingHomeScreen = memo((props: any) => {
	const dispatch = useAppDispatch();
	const [isInCall, setIsInCall] = React.useState(false);
	const [isRefreshSessionSuccess, setIsRefreshSessionSuccess] = React.useState(false);
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
					caller_id: payload?.callerId
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

	const authLoader = useCallback(async () => {
		try {
			const response = await dispatch(authActions.refreshSession());
			if ((response as unknown as IWithError).error) {
				console.error('Session expired');
				return;
			}
			const profileResponse = await dispatch(accountActions.getUserProfile());
			if ((profileResponse as unknown as IWithError).error) {
				console.error('Session expired');
				return;
			}
			setIsRefreshSessionSuccess(true);
		} catch (error) {
			console.error('error authLoader', error);
		}
	}, [dispatch]);

	useEffect(() => {
		authLoader();
	}, [authLoader]);

	useEffect(() => {
		if (props?.isForceAnswer && signalingData?.[signalingData?.length - 1]?.callerId) {
			onJoinCall();
		}
	}, [signalingData]);

	useEffect(() => {
		if (props && props?.payload && isRefreshSessionSuccess) {
			getDataCall();
		}
	}, [props, isRefreshSessionSuccess]);

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
		<View style={styles.container}>
			{/* Caller Info */}
			<Text style={styles.callerName}>{props.name || 'Unknown Caller'}</Text>
			<Image
				source={{
					uri: props?.avatar || AVATAR_DEFAULT
				}}
				style={styles.callerImage}
			/>

			{/* Decline and Answer Buttons */}
			{!props?.isForceAnswer ? (
				<View style={styles.buttonContainer}>
					<TouchableOpacity style={[styles.button, styles.declineButton]} onPress={onDeniedCall}>
						<Text style={styles.buttonText}>Decline</Text>
					</TouchableOpacity>

					<TouchableOpacity style={[styles.button, styles.answerButton]} onPress={onJoinCall}>
						<Text style={styles.buttonText}>Answer</Text>
					</TouchableOpacity>
				</View>
			) : (
				<Wave size={100} color="#fff" />
			)}
		</View>
	);
});
const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#1c1d22',
		paddingHorizontal: 20
	},
	callerName: {
		fontSize: 24,
		fontWeight: 'bold',
		marginVertical: 10,
		color: 'white'
	},
	callerImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginBottom: 30
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '90%',
		marginTop: 30
	},
	button: {
		flex: 1,
		alignItems: 'center',
		paddingVertical: 15,
		marginHorizontal: 10,
		borderRadius: 10
	},
	declineButton: {
		backgroundColor: '#ff4d4d'
	},
	answerButton: {
		backgroundColor: '#4CAF50'
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600'
	}
});
export default IncomingHomeScreen;
