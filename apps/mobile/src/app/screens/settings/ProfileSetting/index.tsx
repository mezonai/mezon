import { useAccount, useAuth, useClanProfileSetting } from '@mezon/core';
import { Icons, isEqual } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import {
	ClansEntity,
	appActions,
	channelMembersActions,
	selectCurrentChannelId,
	selectCurrentClan,
	selectCurrentClanId,
	selectUserClanProfileByClanID,
	useAppDispatch
} from '@mezon/store-mobile';
import { RouteProp } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonTabHeader from '../../../componentUI/MezonTabHeader';
import MezonTabView from '../../../componentUI/MezonTabView';
import ServerProfile from './ServerProfile';
import UserProfile from './UserProfile';
import { style } from './styles';

export enum EProfileTab {
	UserProfile,
	ClanProfile
}

export interface IUserProfileValue {
	username: string;
	imgUrl: string;
	displayName: string;
	aboutMe: string;
}

export interface IClanProfileValue {
	username: string;
	displayName: string;
	imgUrl: string;
}

type RootStackParamList = {
	ProfileSetting: {
		profileTab: EProfileTab;
	};
};

type routeProfileSetting = RouteProp<RootStackParamList, 'ProfileSetting'>;

export const ProfileSetting = ({ navigation, route }: { navigation: any; route: routeProfileSetting }) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { userProfile } = useAuth();
	const { profileTab } = route.params || {};
	const [tab, setTab] = useState<number>(0);
	const currentClan = useSelector(selectCurrentClan);
	const [selectedClan, setSelectedClan] = useState<ClansEntity>(currentClan);
	const { t } = useTranslation(['profileSetting']);
	const { updateUser } = useAccount();
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId) || '';
	const currentChannelId = useSelector(selectCurrentChannelId) || '';
	const { updateUserClanProfile } = useClanProfileSetting({ clanId: selectedClan?.id });
	const userClansProfile = useSelector(selectUserClanProfileByClanID(selectedClan?.id, userProfile?.user?.id ?? ''));

	const [originUserProfileValue, setOriginUserProfileValue] = useState<IUserProfileValue>({
		username: '',
		imgUrl: '',
		displayName: '',
		aboutMe: ''
	});
	const [currentUserProfileValue, setCurrentUserProfileValue] = useState<IUserProfileValue>({
		username: '',
		imgUrl: '',
		displayName: '',
		aboutMe: ''
	});

	const [originClanProfileValue, setOriginClanProfileValue] = useState<IClanProfileValue>({
		username: '',
		imgUrl: '',
		displayName: ''
	});
	const [currentClanProfileValue, setCurrentClanProfileValue] = useState<IClanProfileValue>({
		username: '',
		imgUrl: '',
		displayName: ''
	});

	useEffect(() => {
		const { display_name, avatar_url, username, about_me } = userProfile?.user || {};
		const initialValue = {
			username,
			imgUrl: avatar_url,
			displayName: display_name,
			aboutMe: about_me
		};
		setOriginUserProfileValue(initialValue);
		setCurrentUserProfileValue(initialValue);
	}, [userProfile, tab]);

	useEffect(() => {
		if (profileTab >= 0) setTab(profileTab);
	}, []);

	useEffect(() => {
		const { username, about_me } = userProfile?.user || {};
		const { nick_name } = userClansProfile || {};
		const initialValue = {
			username,
			imgUrl: userClansProfile?.avatar,
			displayName: nick_name,
			aboutMe: about_me
		};
		setOriginClanProfileValue(initialValue);
		setCurrentClanProfileValue(initialValue);
	}, [userClansProfile, tab, userProfile, selectedClan]);

	const isUserProfileNotChanged = useMemo(() => {
		return isEqual(originUserProfileValue, currentUserProfileValue);
	}, [originUserProfileValue, currentUserProfileValue]);

	const isUserProfileEmptyName = useMemo(() => {
		return !currentUserProfileValue?.displayName;
	}, [currentUserProfileValue?.displayName]);

	const isClanProfileNotChanged = useMemo(() => {
		return isEqual(originClanProfileValue, currentClanProfileValue);
	}, [originClanProfileValue, currentClanProfileValue]);

	const updateUserProfile = async () => {
		const { username, imgUrl, displayName, aboutMe } = currentUserProfileValue;
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const response = await updateUser(username, imgUrl, displayName || username, aboutMe, userProfile?.user?.dob, userProfile?.logo, true);

			dispatch(appActions.setLoadingMainMobile(false));
			if (response) {
				if (currentChannelId && currentClanId) {
					await dispatch(
						channelMembersActions.fetchChannelMembers({
							clanId: currentClanId || '',
							channelId: currentChannelId || '',
							channelType: ChannelType.CHANNEL_TYPE_TEXT,
							repace: true
						})
					);
				}
				Toast.show({
					type: 'info',
					text1: t('updateProfileSuccess')
				});
				navigation.goBack();
			}
		} catch (e) {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const updateClanProfile = async () => {
		const { username = '', displayName, imgUrl } = currentClanProfileValue;

		if (currentClanProfileValue?.imgUrl || currentClanProfileValue?.displayName) {
			try {
				dispatch(appActions.setLoadingMainMobile(true));
				const response = await updateUserClanProfile(selectedClan?.clan_id ?? '', displayName || username, imgUrl || '');
				dispatch(appActions.setLoadingMainMobile(false));
				if (response) {
					Toast.show({
						type: 'info',
						text1: t('updateClanProfileSuccess')
					});
					navigation.goBack();
				}
			} catch (e) {
				dispatch(appActions.setLoadingMainMobile(false));
			}
		}
	};

	navigation.setOptions({
		headerRight: () => (
			<Pressable onPress={() => saveCurrentTab()}>
				<Text
					style={[
						styles.saveChangeButton,
						(!isUserProfileNotChanged || !isClanProfileNotChanged) && !isUserProfileEmptyName ? styles.changed : styles.notChange
					]}
				>
					{t('header.save')}
				</Text>
			</Pressable>
		),
		headerLeft: () => (
			<TouchableOpacity onPress={() => handleBack()} style={styles.backArrow}>
				<Icons.CloseSmallBoldIcon color={themeValue.text} />
			</TouchableOpacity>
		)
	});

	const handleBack = () => {
		if (isUserProfileNotChanged && isClanProfileNotChanged) {
			navigation.goBack();
			return;
		}

		Alert.alert(
			t('changedAlert.title'),
			t('changedAlert.description'),
			[
				{
					text: t('changedAlert.keepEditing'),
					style: 'cancel'
				},
				{
					text: t('changedAlert.discard'),
					onPress: () => navigation.goBack()
				}
			],
			{ cancelable: false }
		);
	};

	const handleTabChange = (index: number) => {
		setTab(index);
	};

	const saveCurrentTab = () => {
		if ((isUserProfileNotChanged && isClanProfileNotChanged) || isUserProfileEmptyName) {
			return;
		}

		if (tab === EProfileTab.UserProfile) {
			updateUserProfile();
			return;
		}

		if (tab === EProfileTab.ClanProfile) {
			updateClanProfile();
			return;
		}
	};

	const confirmCallback = async (): Promise<boolean> => {
		return new Promise((resolve) => {
			Alert.alert(
				t('changedAlert.title'),
				t('changedAlert.description'),
				[
					{
						text: t('changedAlert.keepEditing'),
						style: 'cancel',
						onPress: () => resolve(false)
					},
					{
						text: t('changedAlert.discard'),
						onPress: () => {
							resolve(true);
							switch (tab) {
								case EProfileTab.UserProfile:
									setCurrentUserProfileValue(originUserProfileValue);
									break;
								case EProfileTab.ClanProfile:
									setCurrentClanProfileValue(originClanProfileValue);
									break;
								default:
									break;
							}
						}
					}
				],
				{ cancelable: false }
			);
		});
	};

	return (
		<View style={styles.container}>
			<MezonTabHeader
				tabIndex={tab}
				onChange={handleTabChange}
				isNeedConfirmWhenSwitch={!isUserProfileNotChanged || !isClanProfileNotChanged}
				confirmCallback={confirmCallback}
				tabs={[t('switch.userProfile'), t('switch.serverProfile')]}
			/>

			<MezonTabView
				pageIndex={tab}
				onChange={handleTabChange}
				views={[
					<UserProfile userProfileValue={currentUserProfileValue} setCurrentUserProfileValue={setCurrentUserProfileValue} />,
					<ServerProfile
						clanProfileValue={currentClanProfileValue}
						isClanProfileNotChanged={isClanProfileNotChanged}
						setCurrentClanProfileValue={setCurrentClanProfileValue}
						onSelectedClan={(clan) => setSelectedClan(clan)}
					/>
				]}
			/>
		</View>
	);
};
