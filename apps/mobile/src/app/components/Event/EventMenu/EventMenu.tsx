import { useBottomSheetModal } from '@gorhom/bottom-sheet';
import { useEventManagement } from '@mezon/core';
import { EventManagementEntity } from '@mezon/store-mobile';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import MezonConfirm from '../../../componentUI/MezonConfirm';
import MezonMenu, { IMezonMenuSectionProps } from '../../../componentUI/MezonMenu';
import styles from './styles';

interface IEventMenuProps {
	event: EventManagementEntity;
}

export function EventMenu({ event }: IEventMenuProps) {
	const { t } = useTranslation(['eventMenu']);
	const { deleteEventManagement } = useEventManagement();
	const { dismiss } = useBottomSheetModal();
	const [isVisibleCancelEventModal, setIsVisibleCancelEventModal] = useState<boolean>(false);

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
						setIsVisibleCancelEventModal(true);
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
		dismiss();
		setIsVisibleCancelEventModal(false);
	};

	return (
		<View style={styles.container}>
			<MezonMenu menu={menu} />

			<MezonConfirm
				visible={isVisibleCancelEventModal}
				onVisibleChange={setIsVisibleCancelEventModal}
				onConfirm={handleCancelEventConfirm}
				title={t('confirm.title')}
				content={t('confirm.content')}
				confirmText={t('confirm.title')}
			/>
		</View>
	);
}
