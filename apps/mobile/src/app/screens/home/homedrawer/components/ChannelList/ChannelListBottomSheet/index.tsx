import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { channelsActions } from '@mezon/store';
import { useAppDispatch } from '@mezon/store-mobile';
import { ChannelThreads, ICategoryChannel } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { MezonBottomSheet } from '../../../../../../componentUI';
import { EventViewer } from '../../../../../../components/Event';
import NotificationSetting from '../../../../../../components/NotificationSetting';
import { APP_SCREEN, AppStackScreenProps } from '../../../../../../navigation/ScreenTypes';
import CategoryMenu from '../../CategoryMenu';
import ChannelMenu from '../../ChannelMenu';
import ClanMenu from '../../ClanMenu/ClanMenu';
import { InviteToChannel } from '../../InviteToChannel';

const ChannelListBottomSheet = () => {
	const bottomSheetMenuRef = useRef<BottomSheetModal>(null);
	const bottomSheetCategoryMenuRef = useRef<BottomSheetModal>(null);
	const bottomSheetChannelMenuRef = useRef<BottomSheetModal>(null);
	const bottomSheetEventRef = useRef<BottomSheetModal>(null);
	const bottomSheetInviteRef = useRef(null);
	const bottomSheetNotifySettingRef = useRef<BottomSheetModal>(null);
	const navigation = useNavigation<AppStackScreenProps['navigation']>();
	const [isUnknownChannel, setIsUnKnownChannel] = useState<boolean>(false);
	const dispatch = useAppDispatch();

	const handlePressEventCreate = useCallback(() => {
		bottomSheetEventRef?.current?.dismiss();
		navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
			screen: APP_SCREEN.MENU_CLAN.CREATE_EVENT,
			params: {
				onGoBack: () => {
					bottomSheetEventRef?.current?.present();
				}
			}
		});
	}, [navigation]);
	const [currentPressedCategory, setCurrentPressedCategory] = useState<ICategoryChannel>(null);
	const [currentPressedChannel, setCurrentPressedChannel] = useState<ChannelThreads | null>(null);

	useEffect(() => {
		const eventOpenInvite = DeviceEventEmitter.addListener(ActionEmitEvent.ON_OPEN_INVITE_CHANNEL, (category: ICategoryChannel) => {
			setIsUnKnownChannel(false);
			bottomSheetInviteRef?.current?.present?.();
		});

		const eventLongPressCate = DeviceEventEmitter.addListener(ActionEmitEvent.ON_LONG_PRESS_CATEGORY, (category: ICategoryChannel) => {
			bottomSheetCategoryMenuRef.current?.present();
			setCurrentPressedCategory(category);
		});

		const eventLongPressCateChannel = DeviceEventEmitter.addListener(ActionEmitEvent.ON_LONG_PRESS_CHANNEL, ({ channel, isThread = false }) => {
			bottomSheetChannelMenuRef.current?.present();
			setCurrentPressedChannel(channel);
			if (!isThread) {
				setIsUnKnownChannel(!channel?.channel_id);
				dispatch(
					channelsActions.setSelectedChannelId({
						clanId: channel?.clan_id,
						channelId: channel?.channel_id
					})
				);
			}
		});
		return () => {
			eventLongPressCate.remove();
			eventLongPressCateChannel.remove();
			eventOpenInvite.remove();
		};
	}, [dispatch]);

	return (
		<>
			<MezonBottomSheet ref={bottomSheetMenuRef}>
				<ClanMenu inviteRef={bottomSheetInviteRef} />
			</MezonBottomSheet>

			<MezonBottomSheet ref={bottomSheetCategoryMenuRef} heightFitContent>
				<CategoryMenu inviteRef={bottomSheetInviteRef} category={currentPressedCategory} />
			</MezonBottomSheet>

			<MezonBottomSheet ref={bottomSheetChannelMenuRef} heightFitContent>
				<ChannelMenu inviteRef={bottomSheetInviteRef} notifySettingRef={bottomSheetNotifySettingRef} channel={currentPressedChannel} />
			</MezonBottomSheet>

			<MezonBottomSheet ref={bottomSheetEventRef} heightFitContent>
				<EventViewer handlePressEventCreate={handlePressEventCreate} />
			</MezonBottomSheet>

			<MezonBottomSheet ref={bottomSheetNotifySettingRef} snapPoints={['50%']}>
				<NotificationSetting channel={currentPressedChannel} />
			</MezonBottomSheet>

			<InviteToChannel isUnknownChannel={isUnknownChannel} ref={bottomSheetInviteRef} />
		</>
	);
};

export default memo(ChannelListBottomSheet);
