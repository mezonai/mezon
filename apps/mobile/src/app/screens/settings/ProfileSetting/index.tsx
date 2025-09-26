import { useTheme } from '@mezon/mobile-ui';
import { RouteProp } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonTabHeader from '../../../componentUI/MezonTabHeader';
import { IconCDN } from '../../../constants/icon_cdn';
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
	const { profileTab } = route.params || {};
	const [tab, setTab] = useState<number>(0);
	const { t } = useTranslation(['profileSetting']);

	const userProfileRef = useRef<any>(null);
	const clanProfileRef = useRef<any>(null);

	useEffect(() => {
		if (profileTab >= 0) setTab(profileTab);
	}, []);

	const saveCurrentTab = useCallback(() => {
		if (tab === EProfileTab.UserProfile) {
			userProfileRef?.current?.triggerSave?.();
		}

		if (tab === EProfileTab.ClanProfile) {
			clanProfileRef?.current?.triggerSave?.();
		}
	}, [tab]);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerStatusBarHeight: Platform.OS === 'android' ? 0 : undefined,
			headerRight: () => (
				<Pressable onPress={() => saveCurrentTab()}>
					<Text style={[styles.saveChangeButton, styles.changed]}>{t('header.save')}</Text>
				</Pressable>
			),
			headerLeft: () => (
				<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
					<MezonIconCDN icon={IconCDN.closeSmallBold} color={themeValue.text} />
				</TouchableOpacity>
			)
		});
	}, [navigation, saveCurrentTab, styles.backArrow, styles.changed, styles.saveChangeButton, t, themeValue.text]);

	const handleTabChange = (index: number) => {
		setTab(index);
	};

	return (
		<View style={styles.container}>
			<MezonTabHeader tabIndex={tab} onChange={handleTabChange} tabs={[t('switch.userProfile'), t('switch.serverProfile')]} />

			<ScrollView>
				{tab === EProfileTab.UserProfile ? (
					<UserProfile navigation={navigation} ref={userProfileRef} />
				) : (
					<ServerProfile ref={clanProfileRef} navigation={navigation} />
				)}
			</ScrollView>
		</View>
	);
};
