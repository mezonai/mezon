import { useAuth, useClans, useEventManagement } from '@mezon/core';
import { Fonts, useTheme } from '@mezon/mobile-ui';
import { eventManagementActions, useAppDispatch } from '@mezon/store-mobile';
import { OptionEvent } from '@mezon/utils';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import MezonButton, { EMezonButtonTheme } from '../../../componentUI/MezonButton';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../constants/icon_cdn';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { EventItem } from '../../Event/EventItem';
import { style } from './styles';

type CreateEventScreenType = typeof APP_SCREEN.MENU_CLAN.CREATE_EVENT_PREVIEW;
export function EventCreatorPreview({ navigation, route }: MenuClanScreenProps<CreateEventScreenType>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation(['eventCreator']);
	const myUser = useAuth();
	const { createEventManagement } = useEventManagement();
	const { currentClanId } = useClans();
	const { type, channelId, location, startTime, endTime, title, description, frequency, eventChannelId, isPrivate, logo, onGoBack, currentEvent } =
		route.params || {};
	const dispatch = useAppDispatch();

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerTitle: t('screens.eventPreview.headerTitle'),
			headerTitleStyle: {
				fontSize: Fonts.size.h7,
				color: themeValue.textDisabled
			},
			headerLeft: () => (
				<TouchableOpacity style={{ marginLeft: 20 }} onPress={() => navigation.goBack()}>
					<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
				</TouchableOpacity>
			),
			headerRight: () => (
				<TouchableOpacity
					style={{ marginRight: 20 }}
					onPress={() => {
						onGoBack?.();
						navigation.navigate(APP_SCREEN.HOME);
					}}
				>
					<MezonIconCDN icon={IconCDN.closeLargeIcon} height={Fonts.size.s_18} width={Fonts.size.s_18} color={themeValue.textStrong} />
				</TouchableOpacity>
			)
		});
	}, [navigation, onGoBack, t, themeValue.textDisabled, themeValue.textStrong]);

	async function handleCreate() {
		const timeValueStart = startTime.toISOString();
		const timeValueEnd = endTime.toISOString();
		if (currentEvent) {
			await dispatch(
				eventManagementActions.updateEventManagement({
					event_id: currentEvent?.id,
					start_time: timeValueStart,
					end_time: timeValueEnd,
					channel_voice_id: channelId,
					address: location,
					creator_id: myUser.userId,
					title: title,
					description: description,
					channel_id: eventChannelId,
					logo: logo,
					channel_id_old: currentEvent?.channel_id,
					repeat_type: frequency,
					clan_id: currentEvent?.clan_id
				})
			);
		} else {
			await createEventManagement(
				currentClanId || '',
				channelId,
				location,
				title,
				timeValueStart,
				timeValueEnd,
				description,
				logo,
				eventChannelId,
				frequency,
				isPrivate
			);
		}
		onGoBack?.();
		navigation.navigate(APP_SCREEN.HOME);
	}

	return (
		<View style={styles.container}>
			<View style={styles.feedSection}>
				<EventItem
					event={{
						id: '',
						start_time: startTime.toISOString(),
						channel_voice_id: channelId,
						address: location,
						user_ids: [],
						creator_id: myUser.userId,
						title: title,
						description: description,
						channel_id: eventChannelId,
						is_private: isPrivate,
						logo: logo
					}}
					showActions={false}
					start={startTime.toISOString()}
				/>

				<View style={styles.headerSection}>
					<Text style={styles.title}>{t('screens.eventPreview.title')}</Text>
					{type === OptionEvent.OPTION_LOCATION ? (
						<Text style={styles.subtitle}>{t('screens.eventPreview.subtitle')}</Text>
					) : (
						<Text style={styles.subtitle}>{t('screens.eventPreview.subtitleVoice')}</Text>
					)}
				</View>
			</View>

			<View style={styles.btnWrapper}>
				<MezonButton
					title={currentEvent ? t('actions.edit') : t('actions.create')}
					titleStyle={styles.titleMezonBtn}
					type={EMezonButtonTheme.SUCCESS}
					containerStyle={styles.mezonBtn}
					onPress={handleCreate}
				/>
			</View>
		</View>
	);
}
