import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	getStoreAsync,
	selectAllChannels,
	selectChannelById2,
	selectCurrentClan,
	selectCurrentUserId,
	selectLastMessageByChannelId,
	selectMembersClanCount,
	selectWelcomeChannelByClanId,
	useAppSelector
} from '@mezon/store-mobile';
import { TypeMessage, sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../../../constants/icon_cdn';
import { APP_SCREEN } from '../../../../../../navigation/ScreenTypes';
import InviteToChannel from '../../InviteToChannel';
import { OnboardingBottomSheet, OnboardingItemProps } from './OnboardingBottomSheet';
import { style } from './styles';

const NUM_OF_STEP = 3;

export const ChannelOnboarding = memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['onBoardingClan']);
	const clan = useSelector(selectCurrentClan);
	const welcomeChannel = useSelector((state) => selectWelcomeChannelByClanId(state, clan?.id as string));
	const numberMemberClan = useSelector(selectMembersClanCount);
	const numberChannel = useSelector(selectAllChannels);
	const userId = useSelector(selectCurrentUserId);
	const lastMessage = useAppSelector((state) => selectLastMessageByChannelId(state, welcomeChannel));
	const navigation = useNavigation<any>();
	const checkLastMessage = useMemo(() => {
		if (lastMessage?.code === TypeMessage.Indicator) {
			return false;
		}
		return true;
	}, [lastMessage]);

	const listOnboardWillShow = useMemo(() => {
		const list: OnboardingItemProps[] = [
			{
				icon: (
					<View style={[styles.bgIcon, { backgroundColor: baseColor.caribbeanGreen }]}>
						<MezonIconCDN icon={IconCDN.createImage} height={size.s_28} width={size.s_28} useOriginalColor />
					</View>
				),
				title: t('action.createChannel'),
				value: numberChannel?.length !== 1,
				onPress: async () => {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					const store = await getStoreAsync();
					const channel = selectChannelById2(store.getState(), welcomeChannel);

					navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
						screen: APP_SCREEN.MENU_CLAN.CREATE_CHANNEL,
						params: {
							categoryId: channel?.category_id
						}
					});
				}
			},
			{
				icon: (
					<View style={[styles.bgIcon, { backgroundColor: baseColor.goldenrodYellow }]}>
						<MezonIconCDN icon={IconCDN.addFriendImage} height={size.s_28} width={size.s_28} useOriginalColor />
					</View>
				),
				title: t('action.invite'),
				value: numberMemberClan !== 1,
				onPress: async () => {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					await sleep(500);
					const data = {
						snapPoints: ['70%', '90%'],
						children: <InviteToChannel isUnknownChannel={false} />
					};
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
				}
			},
			{
				icon: (
					<View style={[styles.bgIcon, { backgroundColor: baseColor.azureBlue }]}>
						<MezonIconCDN icon={IconCDN.chatImage} height={size.s_28} width={size.s_28} useOriginalColor />
					</View>
				),
				title: t('action.sendMessage'),
				value: checkLastMessage,
				onPress: async () => {
					DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
					const store = await getStoreAsync();
					const channel = selectChannelById2(store.getState(), welcomeChannel);
					DeviceEventEmitter.emit(ActionEmitEvent.ON_CHANNEL_ROUTER, { channel: channel });
				}
			}
		];
		return list;
	}, [styles.bgIcon, t, numberChannel?.length, numberMemberClan, checkLastMessage, welcomeChannel, navigation]);

	const availableStep = useMemo(() => {
		return listOnboardWillShow?.filter?.((item) => item.value)?.length;
	}, [listOnboardWillShow]);

	const handlePressOnboarding = useCallback(async () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		await sleep(500);
		const data = {
			heightFitContent: true,
			children: <OnboardingBottomSheet actionList={listOnboardWillShow} finishedStep={availableStep} allSteps={NUM_OF_STEP} />
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, [availableStep, listOnboardWillShow]);

	return (
		<View>
			{availableStep < NUM_OF_STEP && userId === clan?.creator_id && (
				<TouchableOpacity style={styles.container} onPress={handlePressOnboarding}>
					<LinearGradient
						start={{ x: 1, y: 0 }}
						end={{ x: 0, y: 0 }}
						colors={[
							themeValue.primary,
							themeValue?.primaryGradiant || themeValue.primary,
							themeValue?.primaryGradiant || themeValue.primary
						]}
						style={[StyleSheet.absoluteFillObject, { borderRadius: size.s_16 }]}
					/>
					<View style={styles.contentWrap}>
						<View style={styles.titleGroup}>
							<MezonIconCDN icon={IconCDN.fireworksIcon} height={size.s_18} width={size.s_18} useOriginalColor />
						</View>
						<View>
							<Text style={styles.setupTitle}>{t('title')}</Text>
							<Text style={styles.description}>{t('description', { step: availableStep + 1, total: NUM_OF_STEP })}</Text>
						</View>
					</View>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={size.s_18} width={size.s_18} color={themeValue.text} />
				</TouchableOpacity>
			)}
		</View>
	);
});
