import { useEventManagement } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { EventManagementEntity } from '@mezon/store-mobile';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, View } from 'react-native';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonMenu, { IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import styles from './styles';

interface IEventMenuProps {
	event: EventManagementEntity;
}

export function EventMenu({ event }: IEventMenuProps) {
	const { t } = useTranslation(['eventMenu']);
	const { deleteEventManagement } = useEventManagement();

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
				// {
				// 	title: t('menu.editEvent'),
				// 	onPress: () => reserve(),
				// },
				{
					title: t('menu.cancelEvent'),
					onPress: () => {
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
					textStyle: { color: 'red' }
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
