import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	deleteChannel,
	directActions,
	fetchDirectMessage,
	removeMemberChannel,
	selectCurrentUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { IChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { IMezonMenuItemProps, IMezonMenuSectionProps, MezonBottomSheet, MezonConfirm, MezonMenu } from '../../componentUI';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import CustomGroupDm from './CustomGroupDm';
import style from './MenuCustomDm.styles';

const MenuCustomDm = ({ currentChannel, channelLabel }: { currentChannel: IChannel | DirectEntity; channelLabel: string }) => {
	const { t } = useTranslation(['menuCustomDM', 'dmMessage']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const bottomSheetCustomGroup = useRef<BottomSheetModal>(null);
	const { dismiss } = useBottomSheetModal();
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const [isVisibleLeaveGroupModal, setIsVisibleLeaveGroupModal] = useState<boolean>(false);
	const lastOne = useMemo(() => {
		return !currentChannel?.user_id?.length;
	}, [currentChannel?.user_id]);
	const currentUserId = useAppSelector(selectCurrentUserId);

	const menuSetting: IMezonMenuItemProps[] = [
		{
			title: t('customiseGroup'),
			expandable: false,
			icon: <Icons.PencilIcon width={size.s_18} height={size.s_18} color={themeValue.text}></Icons.PencilIcon>,
			textStyle: styles.label,
			onPress: () => {
				bottomSheetCustomGroup.current?.present();
				dismiss();
			}
		},
		{
			title: t('leaveGroup'),
			expandable: false,
			icon: <Icons.CircleXIcon width={size.s_22} height={size.s_22} color={themeValue.text}></Icons.CircleXIcon>,
			textStyle: styles.label,
			onPress: () => {
				setIsVisibleLeaveGroupModal(true);
			}
		}
	];
	const generalMenu: IMezonMenuSectionProps[] = [
		{
			items: menuSetting
		}
	];

	const closeDm: IMezonMenuSectionProps[] = [
		{
			items: [
				{
					title: t('closeDM'),
					expandable: false,
					icon: <Icons.CircleXIcon width={size.s_18} height={size.s_18} color={themeValue.text}></Icons.CircleXIcon>,
					textStyle: styles.label,
					onPress: async () => {
						dismiss();
						await dispatch(directActions.closeDirectMessage({ channel_id: currentChannel?.channel_id }));
						navigation.navigate(APP_SCREEN.MESSAGES.HOME);
					}
				}
			]
		}
	];

	const handleLeaveGroupConfirm = async () => {
		const isLeaveOrDeleteGroup = lastOne
			? await dispatch(deleteChannel({ clanId: '', channelId: currentChannel?.channel_id ?? '', isDmGroup: true }))
			: await dispatch(removeMemberChannel({ channelId: currentChannel?.channel_id || '', userIds: [currentUserId], kickMember: false }));
		if (!isLeaveOrDeleteGroup) {
			return;
		}
		await dispatch(fetchDirectMessage({ noCache: true }));
		setIsVisibleLeaveGroupModal(false);
		dismiss();
		navigation.navigate(APP_SCREEN.MESSAGES.HOME);
	};

	return (
		<View style={{ paddingVertical: size.s_10, paddingHorizontal: size.s_20 }}>
			{[ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel.type) ? <MezonMenu menu={generalMenu} /> : <MezonMenu menu={closeDm} />}
			<MezonBottomSheet snapPoints={['70%']} ref={bottomSheetCustomGroup}>
				<CustomGroupDm dmGroupId={currentChannel?.id} channelLabel={channelLabel} />
			</MezonBottomSheet>

			<MezonConfirm
				visible={isVisibleLeaveGroupModal}
				onConfirm={handleLeaveGroupConfirm}
				onVisibleChange={setIsVisibleLeaveGroupModal}
				title={t('confirm.title', {
					groupName: currentChannel?.channel_label,
					ns: 'dmMessage'
				})}
				content={t('confirm.content', {
					groupName: currentChannel?.channel_label,
					ns: 'dmMessage'
				})}
				confirmText={t('confirm.confirmText', { ns: 'dmMessage' })}
			/>
		</View>
	);
};
export default MenuCustomDm;
