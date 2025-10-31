import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { DMCallActions, selectAllAccount, selectDmGroupCurrent, useAppDispatch } from '@mezon/store-mobile';
import type { IMessageCallLog } from '@mezon/utils';
import { IMessageTypeCallLog } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { DirectMessageCallMain } from '../../../../messages/DirectMessageCall';
import { style } from './styles';

interface MessageCallLogProps {
	contentMsg: string;
	channelId: string;
	senderId: string;
	callLog: IMessageCallLog;
	username: string;
}

export const MessageCallLog = memo(({ contentMsg, senderId, channelId, callLog, username }: MessageCallLogProps) => {
	const { callLogType, isVideo = false } = callLog || {};
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userProfile = useSelector(selectAllAccount);
	const isMe = useMemo(() => userProfile?.user?.id === senderId, [userProfile?.user?.id, senderId]);
	const { t } = useTranslation('message');
	const currentDmGroup = useSelector(selectDmGroupCurrent(channelId ?? ''));
	const dispatch = useAppDispatch();

	const onCallBack = () => {
		dispatch(DMCallActions.removeAll());
		const receiverId = currentDmGroup?.user_ids?.[0];
		if (receiverId) {
			const receiverAvatar = currentDmGroup?.channel_avatar?.[0];
			const receiverName = currentDmGroup?.channel_label;
			const params = {
				receiverId: receiverId as string,
				receiverName: receiverName as string,
				receiverAvatar: receiverAvatar as string,
				directMessageId: channelId as string
			};
			const data = {
				children: <DirectMessageCallMain route={{ params }} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
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
				return isMe ? t('callLog.outGoingCall') : t('callLog.incomingCall');
			case IMessageTypeCallLog.STARTCALL:
				return currentDmGroup?.type === ChannelType.CHANNEL_TYPE_GROUP
					? t('callLog.startGroupCall', { username })
					: isVideo
						? t('callLog.startVideoCall', { username })
						: t('callLog.startAudioCall', { username });
			default:
				return '';
		}
	};

	const getIcon = () => {
		switch (callLogType) {
			case IMessageTypeCallLog.TIMEOUTCALL:
				return isMe ? (
					<MezonIconCDN icon={IconCDN.callOutGoingIcon} width={size.s_17} height={size.s_17} color={themeValue.textDisabled} />
				) : (
					<MezonIconCDN icon={IconCDN.callMissIcon} width={size.s_17} height={size.s_17} color={baseColor.redStrong} />
				);
			case IMessageTypeCallLog.REJECTCALL:
				return <MezonIconCDN icon={IconCDN.callCancelIcon} width={size.s_17} height={size.s_17} color={baseColor.redStrong} />;
			case IMessageTypeCallLog.CANCELCALL:
				return isMe ? (
					<MezonIconCDN icon={IconCDN.callCancelIcon} width={size.s_17} height={size.s_17} color={baseColor.redStrong} />
				) : (
					<MezonIconCDN icon={IconCDN.callMissIcon} width={size.s_17} height={size.s_17} color={baseColor.redStrong} />
				);
			case IMessageTypeCallLog.FINISHCALL:
			case IMessageTypeCallLog.STARTCALL:
				return isMe ? (
					<MezonIconCDN icon={IconCDN.callOutGoingIcon} width={size.s_17} height={size.s_17} color={themeValue.textDisabled} />
				) : (
					<MezonIconCDN icon={IconCDN.callInComingIcon} width={size.s_17} height={size.s_17} color={themeValue.textDisabled} />
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
		return (!noCallBackTypes.includes(callLogType) || !isMe) && callLogType !== IMessageTypeCallLog.STARTCALL;
	};
	return (
		<View style={styles.outerWrapper}>
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
						<View style={styles.iconWrapper}>{getIcon()}</View>
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
