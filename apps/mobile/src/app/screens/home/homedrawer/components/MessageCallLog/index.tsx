import { CallLogCancelIcon, CallLogIncomingIcon, CallLogMissedIcon, CallLogOutgoingIcon } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount, selectDmGroupCurrent } from '@mezon/store';
import { IMessageCallLog, IMessageTypeCallLog } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import { APP_SCREEN } from '../../../../../navigation/ScreenTypes';
import { style } from './styles';

interface MessageCallLogProps {
	contentMsg: string;
	channelId: string;
	senderId: string;
	callLog: IMessageCallLog;
}

export const MessageCallLog = memo(({ contentMsg, senderId, channelId, callLog }: MessageCallLogProps) => {
	const { callLogType, isVideo = false } = callLog || {};
	const { themeValue } = useTheme();
	const navigation = useNavigation<any>();
	const styles = style(themeValue);
	const userProfile = useSelector(selectAllAccount);
	const isMe = useMemo(() => userProfile?.user?.id === senderId, [userProfile?.user?.id, senderId]);
	const { t } = useTranslation('message');
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId ?? ''));

	const onCallBack = () => {
		const receiverId = currentDmGroup?.user_id?.[0];
		if (receiverId) {
			const receiverAvatar = currentDmGroup?.channel_avatar?.[0];

			navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
				screen: APP_SCREEN.MENU_CHANNEL.CALL_DIRECT,
				params: {
					receiverId: receiverId as string,
					receiverAvatar: receiverAvatar as string,
					directMessageId: channelId as string
				}
			});
		}
	};

	const getTitleText = () => {
		switch (callLogType) {
			case IMessageTypeCallLog.TIMEOUTCALL:
				return isMe ? t('callLog.outGoingCall') : t('callLog.missed');
			case IMessageTypeCallLog.REJECTCALL:
				return isMe ? t('callLog.receiverRejected') : t('callLog.youRejected');
			case IMessageTypeCallLog.CANCELCALL:
				return isMe ? t('callLog.cancel') : t('callLog.missed');
			case IMessageTypeCallLog.FINISHCALL:
			case IMessageTypeCallLog.STARTCALL:
				return isMe ? t('callLog.outGoingCall') : t('callLog.incomingCall');
			default:
				return '';
		}
	};

	const getIcon = () => {
		switch (callLogType) {
			case IMessageTypeCallLog.TIMEOUTCALL:
				return isMe ? (
					<CallLogOutgoingIcon width={size.s_17} height={size.s_17} color={themeValue.textDisabled} />
				) : (
					<CallLogMissedIcon width={size.s_17} height={size.s_17} color={baseColor.redStrong} />
				);
			case IMessageTypeCallLog.REJECTCALL:
				return <CallLogCancelIcon width={size.s_17} height={size.s_17} color={baseColor.redStrong} />;
			case IMessageTypeCallLog.CANCELCALL:
				return isMe ? (
					<CallLogCancelIcon width={size.s_17} height={size.s_17} color={baseColor.redStrong} />
				) : (
					<CallLogMissedIcon width={size.s_17} height={size.s_17} color={baseColor.redStrong} />
				);
			case IMessageTypeCallLog.FINISHCALL:
			case IMessageTypeCallLog.STARTCALL:
				return isMe ? (
					<CallLogOutgoingIcon width={size.s_17} height={size.s_17} color={themeValue.textDisabled} />
				) : (
					<CallLogIncomingIcon width={size.s_17} height={size.s_17} color={themeValue.textDisabled} />
				);
			default:
				return '';
		}
	};
	const getDescriptionText = () => {
		return callLogType === IMessageTypeCallLog.FINISHCALL ? contentMsg : isVideo ? t('callLog.videoCall') : t('callLog.audioCall');
	};

	const shouldShowCallBackButton = () => {
		const noCallBackTypes = [IMessageTypeCallLog.TIMEOUTCALL, IMessageTypeCallLog.STARTCALL, IMessageTypeCallLog.FINISHCALL];
		return !noCallBackTypes.includes(callLogType) || !isMe;
	};
	return (
		<View style={{ flexDirection: 'row' }}>
			<View style={styles.container}>
				<View style={styles.wrapper}>
					{getTitleText() ? (
						<Text
							style={[
								styles.title,
								[IMessageTypeCallLog.TIMEOUTCALL, IMessageTypeCallLog.REJECTCALL, IMessageTypeCallLog.CANCELCALL].includes(
									callLogType
								) && styles.titleRed
							]}
						>
							{getTitleText()}
						</Text>
					) : null}

					<View style={styles.wrapperDescription}>
						<View style={{ top: size.s_2 }}>{getIcon()}</View>
						<Text style={styles.description}>{getDescriptionText()}</Text>
					</View>
				</View>

				{shouldShowCallBackButton() && (
					<TouchableOpacity style={styles.btnCallBack} activeOpacity={1} onPress={onCallBack}>
						<Text style={styles.titleCallBack}>{t('callLog.callBack')}</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
});
