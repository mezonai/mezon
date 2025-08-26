import { useEventManagement } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor } from '@mezon/mobile-ui';
import { EventManagementEntity } from '@mezon/store-mobile';
import { sleep } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, View } from 'react-native';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonMenu, { IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import { APP_SCREEN } from '../../../navigation/ScreenTypes';
import styles from './styles';

interface IEventMenuProps {
	event: EventManagementEntity;
}

export function EventMenu({ event }: IEventMenuProps) {
	const { t } = useTranslation(['eventMenu']);
	const { deleteEventManagement } = useEventManagement();
	const navigation = useNavigation<any>();

	const menu: IMezonMenuSectionProps[] = [
		{
			items: [
				// {
				// 	title: t('menu.startEvent'),
				// 	onPress: () => reserve(),
				// },
				// {
				// 	title: t('menu.markAsNotInterested'),
				// 	onPress: () => reserve(),
				// },
				// {
				// 	title: t('menu.markAsInterested'),
				// 	onPress: () => reserve(),
				// },
				{
					title: t('menu.editEvent'),
					onPress: async () => {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
						navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
							screen: APP_SCREEN.MENU_CLAN.CREATE_EVENT,
							params: {
								onGoBack: () => {
									DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
								},
								eventId: event?.id
							}
						});
					}
				},
				{
					title: t('menu.cancelEvent'),
					onPress: async () => {
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
						await sleep(500);
						const data = {
							children: (
								<MezonConfirm
									onConfirm={handleCancelEventConfirm}
									title={t('confirm.title')}
									content={t('confirm.content')}
									confirmText={t('confirm.title')}
								/>
							)
						};
						DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: false, data });
					},
					textStyle: { color: baseColor.redStrong }
				}
				// {
				// 	title: t('menu.reportEvent'),
				// 	onPress: () => reserve(),
				// 	textStyle: { color: 'red' },
				// },
				// {
				// 	title: t('menu.copyEventLink'),
				// 	onPress: () => reserve(),
				// },
				// {
				// 	title: t('menu.copyEventID'),
				// 	onPress: () => reserve(),
				// },
			]
		}
	];

	const handleCancelEventConfirm = async () => {
		await deleteEventManagement(event?.clan_id || '', event?.id || '', event?.creator_id || '', event?.title || '');
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	};

	return (
		<View style={styles.container}>
			<MezonMenu menu={menu} />
		</View>
	);
}
