import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import {
	BellIcon,
	CheckIcon,
	Icons,
	LinkIcon,
	STORAGE_DATA_CLAN_CHANNEL_CACHE,
	TrashIcon,
	getUpdateOrAddClanChannelCache,
	isEqual,
	save
} from '@mezon/mobile-components';
import { Colors, useTheme } from '@mezon/mobile-ui';
import {
	channelsActions,
	getStoreAsync,
	selectAllChannels,
	selectChannelById,
	selectCurrentUserId,
	threadsActions,
	useAppDispatch,
	useAppSelector
} from '@mezon/store-mobile';
import { checkIsThread } from '@mezon/utils';
import { DrawerActions } from '@react-navigation/native';
import { ApiUpdateChannelDescRequest } from 'mezon-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { IMezonMenuItemProps, IMezonMenuSectionProps, IMezonOptionData, MezonConfirm, MezonInput, MezonMenu, MezonOption } from '../../componentUI';
import { IMezonSliderData } from '../../componentUI/MezonSlider';
import useBackHardWare from '../../hooks/useBackHardWare';
import { APP_SCREEN, MenuChannelScreenProps } from '../../navigation/ScreenTypes';
import { AddMemberOrRoleBS } from '../../screens/channelPermissionSetting/components/AddMemberOrRoleBS';
import { validInput } from '../../utils/validate';
import { style } from './styles';

interface IChannelSettingValue {
	channelName: string;
	channelTopic: string;
	//TODO: update more
}

type ScreenChannelSetting = typeof APP_SCREEN.MENU_CHANNEL.SETTINGS;
export function ChannelSetting({ navigation, route }: MenuChannelScreenProps<ScreenChannelSetting>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { channelId } = route.params;
	const { t } = useTranslation(['channelSetting', 'channelCreator']);
	const { t: t1 } = useTranslation(['screenStack']);
	const bottomSheetRef = useRef<BottomSheetModal>(null);
	const dispatch = useAppDispatch();
	const channel = useAppSelector((state) => selectChannelById(state, channelId || ''));
	const isChannel = !checkIsThread(channel);
	const [isVisibleDeleteChannelModal, setIsVisibleDeleteChannelModal] = useState<boolean>(false);
	const [isVisibleLeaveChannelModal, setIsVisibleLeaveChannelModal] = useState<boolean>(false);
	const [isCheckValid, setIsCheckValid] = useState<boolean>(true);
	const [isCheckDuplicateNameChannel, setIsCheckDuplicateNameChannel] = useState<boolean>(false);
	const channelsClan = useSelector(selectAllChannels);
	const [originSettingValue, setOriginSettingValue] = useState<IChannelSettingValue>({
		channelName: '',
		channelTopic: ''
	});
	const [currentSettingValue, setCurrentSettingValue] = useState<IChannelSettingValue>({
		channelName: '',
		channelTopic: ''
	});
	const isNotChanged = useMemo(() => {
		return isEqual(originSettingValue, currentSettingValue);
	}, [originSettingValue, currentSettingValue]);

	const currentCategoryName = useMemo(() => {
		return channel?.category_name;
	}, [channel?.category_name]);
	useBackHardWare();
	const { dismiss } = useBottomSheetModal();
	const currentUserId = useSelector(selectCurrentUserId);

	navigation.setOptions({
		headerTitle: isChannel ? t1('menuChannelStack.channelSetting') : t1('menuChannelStack.threadSetting'),
		headerRight: () => (
			<Pressable onPress={() => handleSaveChannelSetting()}>
				<Text style={[styles.saveChangeButton, !isNotChanged ? styles.changed : styles.notChange]}>{t('confirm.save')}</Text>
			</Pressable>
		)
	});

	const handleUpdateValue = (value: Partial<IChannelSettingValue>) => {
		setCurrentSettingValue({ ...currentSettingValue, ...value });
	};

	useEffect(() => {
		if (channel?.channel_id) {
			const initialChannelSettingValue: IChannelSettingValue = {
				channelName: channel?.channel_label,
				channelTopic: ''
			};
			setOriginSettingValue(initialChannelSettingValue);
			setCurrentSettingValue(initialChannelSettingValue);
		}
	}, [channel]);

	useEffect(() => {
		setIsCheckValid(validInput(currentSettingValue?.channelName));
	}, [currentSettingValue?.channelName]);

	const handleSaveChannelSetting = async () => {
		const isCheckNameChannelValue =
			!!channelsClan?.length && channelsClan?.some((channel) => channel?.channel_label === currentSettingValue?.channelName);
		setIsCheckDuplicateNameChannel(isCheckNameChannelValue);
		const updateChannel: ApiUpdateChannelDescRequest = {
			channel_id: channel?.channel_id || '',
			channel_label: currentSettingValue?.channelName,
			category_id: channel.category_id,
			app_url: ''
		};
		if (isCheckNameChannelValue || !isCheckValid) return;
		await dispatch(channelsActions.updateChannel(updateChannel));
		navigation?.goBack();
		Toast.show({
			type: 'success',
			props: {
				text2: t('toast.updated'),
				leadingIcon: <CheckIcon color={Colors.green} />
			}
		});
	};

	const categoryMenu = useMemo(
		() =>
			[
				{
					title: isChannel ? t('fields.channelCategory.title') : t('fields.ThreadCategory.title'),
					expandable: true,
					previewValue: currentCategoryName,
					icon: <Icons.FolderPlusIcon color={themeValue.text} />,
					isShow: isChannel,
					onPress: () => {
						navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.CHANGE_CATEGORY,
							params: {
								channel
							}
						});
					}
				}
			] satisfies IMezonMenuItemProps[],
		[currentCategoryName]
	);
	const permissionMenu = useMemo(
		() =>
			[
				{
					title: t('fields.channelPermission.permission'),
					expandable: true,
					icon: <Icons.BravePermission color={themeValue.text} />,
					isShow: isChannel,
					onPress: () => {
						navigation.navigate(APP_SCREEN.MENU_CHANNEL.STACK, {
							screen: APP_SCREEN.MENU_CHANNEL.CHANNEL_PERMISSION,
							params: {
								channelId
							}
						});
					}
				},
				{
					title: t('fields.privateChannelInvite.addMember'),
					expandable: true,
					icon: <Icons.BravePermission color={themeValue.text} />,
					isShow: isChannel && !!channel.channel_private,
					onPress: () => {
						bottomSheetRef?.current?.present();
					}
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);

	const notificationMenu = useMemo(
		() =>
			[
				{
					title: t('fields.channelNotifications.notification'),
					expandable: true,
					icon: <BellIcon color={themeValue.text} />
				},
				{
					title: t('fields.channelNotifications.pinned'),
					expandable: true,
					icon: <Icons.PinIcon color={themeValue.text} />
				},
				{
					title: t('fields.channelNotifications.invite'),
					expandable: true,
					icon: <LinkIcon color={themeValue.text} />
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);

	const webhookMenu = useMemo(
		() =>
			[
				{
					title: t('fields.channelWebhooks.webhook'),
					expandable: true,
					icon: <Icons.WebhookIcon color={themeValue.text} />,
					isShow: isChannel,
					onPress: () => {
						navigation.navigate(APP_SCREEN.MENU_CLAN.STACK, {
							screen: APP_SCREEN.MENU_CLAN.INTEGRATIONS
						});
					}
				}
			] satisfies IMezonMenuItemProps[],
		[]
	);

	const deleteMenu = useMemo(
		() =>
			[
				{
					title: isChannel ? t('fields.channelDelete.delete') : t('fields.threadDelete.delete'),
					textStyle: { color: 'red' },
					onPress: () => handlePressDeleteChannel(),
					icon: <TrashIcon color="red" />
				},
				{
					title: t('fields.threadLeave.leave'),
					textStyle: { color: 'red' },
					onPress: () => handlePressLeaveChannel(),
					icon: <Icons.LeaveGroup color={Colors.textRed} />,
					isShow: channel?.creator_id !== currentUserId
				}
			] satisfies IMezonMenuItemProps[],
		[channel?.creator_id, currentUserId, isChannel, t]
	);

	const topMenu = useMemo(
		() =>
			[
				// { items: categoryMenu },
				{
					items: permissionMenu,
					bottomDescription: t('fields.channelPermission.description')
				}
				// {
				// 	items: notificationMenu,
				// 	bottomDescription: ''
				// }
			] satisfies IMezonMenuSectionProps[],
		[currentCategoryName]
	);

	const bottomMenu = useMemo(() => [{ items: webhookMenu }, { items: deleteMenu }] satisfies IMezonMenuSectionProps[], []);

	const hideInactiveOptions = useMemo(
		() =>
			[
				{
					title: t('fields.channelHideInactivity._1hour'),
					value: 0
				},
				{
					title: t('fields.channelHideInactivity._24hours'),
					value: 1
				},
				{
					title: t('fields.channelHideInactivity._3days'),
					value: 2
				},
				{
					title: t('fields.channelHideInactivity._1Week'),
					value: 3
				}
			] satisfies IMezonOptionData,
		[]
	);

	const slowModeOptions = useMemo(
		() =>
			[
				{
					value: 0,
					name: t('fields.channelSlowMode.slowModeOff')
				},
				{
					value: 1,
					name: t('fields.channelSlowMode._5seconds')
				},
				{
					value: 2,
					name: t('fields.channelSlowMode._10seconds')
				},
				{
					value: 3,
					name: t('fields.channelSlowMode._15seconds')
				},
				{
					value: 4,
					name: t('fields.channelSlowMode._30seconds')
				},
				{
					value: 5,
					name: t('fields.channelSlowMode._1minute')
				},
				{
					value: 6,
					name: t('fields.channelSlowMode._1minute')
				},
				{
					value: 7,
					name: t('fields.channelSlowMode._2minutes')
				},
				{
					value: 8,
					name: t('fields.channelSlowMode._5minutes')
				},
				{
					value: 9,
					name: t('fields.channelSlowMode._10minutes')
				},
				{
					value: 10,
					name: t('fields.channelSlowMode._15minutes')
				},
				{
					value: 11,
					name: t('fields.channelSlowMode._30minutes')
				},
				{
					value: 12,
					name: t('fields.channelSlowMode._1hour')
				},
				{
					value: 13,
					name: t('fields.channelSlowMode._2hours')
				},
				{
					value: 14,
					name: t('fields.channelSlowMode._6hours')
				}
			] satisfies IMezonSliderData,
		[]
	);

	const handleDeleteChannel = async () => {
		await dispatch(
			channelsActions.deleteChannel({
				channelId: channel?.channel_id,
				clanId: channel?.clan_id
			})
		);
		navigation.navigate(APP_SCREEN.HOME);
		navigation.dispatch(DrawerActions.openDrawer());
		if (channel?.parrent_id !== '0') {
			await dispatch(
				channelsActions.joinChannel({
					clanId: channel?.clan_id,
					channelId: channel?.parrent_id,
					noFetchMembers: false
				})
			);
		}
	};

	const handleJoinChannel = async () => {
		const channelId = channel?.parrent_id || '';
		const clanId = channel?.clan_id || '';
		const dataSave = getUpdateOrAddClanChannelCache(clanId, channelId);
		const store = await getStoreAsync();
		requestAnimationFrame(async () => {
			store.dispatch(channelsActions.joinChannel({ clanId: clanId ?? '', channelId: channelId, noFetchMembers: false }));
		});
		save(STORAGE_DATA_CLAN_CHANNEL_CACHE, dataSave);
	};

	const handleConfirmLeaveThread = useCallback(async () => {
		await dispatch(
			threadsActions.leaveThread({
				clanId: channel?.clan_id || '',
				channelId: channel?.parrent_id || '',
				threadId: channel?.id || '',
				isPrivate: channel.channel_private || 0
			})
		);
		navigation.navigate(APP_SCREEN.HOME);
		navigation.dispatch(DrawerActions.openDrawer());
		dismiss();
		handleJoinChannel();
	}, []);

	const handleLeaveModalVisibleChange = (visible: boolean) => {
		setIsVisibleLeaveChannelModal(visible);
	};

	const handlePressLeaveChannel = () => {
		setIsVisibleLeaveChannelModal(true);
	};

	const handleDeleteModalVisibleChange = (visible: boolean) => {
		setIsVisibleDeleteChannelModal(visible);
	};

	const handlePressDeleteChannel = () => {
		setIsVisibleDeleteChannelModal(true);
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.inputWrapper}>
				<MezonInput
					label={t('fields.channelName.title')}
					value={currentSettingValue.channelName}
					onTextChange={(text) => handleUpdateValue({ channelName: text })}
					maxCharacter={64}
					errorMessage={
						isCheckDuplicateNameChannel
							? t('channelCreator:fields.channelName.duplicateChannelName')
							: !isCheckValid
								? t('fields.channelName.errorMessage')
								: ''
					}
					placeHolder={t('fields.channelName.placeholder')}
					isValid={!isCheckDuplicateNameChannel && isCheckValid}
				/>

				{isChannel && (
					<MezonInput
						label={t('fields.channelDescription.title')}
						value={currentSettingValue.channelTopic}
						onTextChange={(text) => handleUpdateValue({ channelTopic: text })}
						textarea
					/>
				)}
			</View>

			<MezonMenu menu={topMenu} />

			{/*<MezonSlider data={slowModeOptions} title={t('fields.channelSlowMode.title')} />*/}

			<MezonOption
				title={t('fields.channelHideInactivity.title')}
				data={hideInactiveOptions}
				bottomDescription={t('fields.channelHideInactivity.description')}
			/>

			<MezonMenu menu={bottomMenu} />

			<MezonConfirm
				visible={isVisibleDeleteChannelModal}
				onVisibleChange={handleDeleteModalVisibleChange}
				onConfirm={handleDeleteChannel}
				title={t('confirm.delete.title')}
				confirmText={t('confirm.delete.confirmText')}
				content={t('confirm.delete.content', {
					channelName: channel?.channel_label
				})}
			/>

			<MezonConfirm
				visible={isVisibleLeaveChannelModal}
				onVisibleChange={handleLeaveModalVisibleChange}
				onConfirm={handleConfirmLeaveThread}
				title={t('confirm.leave.title')}
				confirmText={t('confirm.leave.confirmText')}
				content={t('confirm.leave.content', {
					channelName: channel?.channel_label
				})}
			/>
			<AddMemberOrRoleBS bottomSheetRef={bottomSheetRef} channel={channel} />
		</ScrollView>
	);
}
