import { useAccount } from '@mezon/core';
import { useTheme } from '@mezon/mobile-ui';
import { appActions, getStore, selectAllAccount, useAppDispatch } from '@mezon/store-mobile';
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView } from 'react-native';
import Toast from 'react-native-toast-message';
import type { IUserProfileValue } from '..';
import BannerAvatar from './components/Banner';
import DetailInfo from './components/Info';
import { DirectMessageLogo } from './components/Logo';
import { style } from './styles';

interface IUserProfile {
	navigation: any;
}

const NX_LOGO_MEZON = 'https://cdn.mezon.ai/1775731152322039808/1820659489792069632/mezon_logo.png';
const UserProfile = forwardRef(function UserProfile({ navigation }: IUserProfile, ref) {
	const { themeValue } = useTheme();
	const { updateUser } = useAccount();
	const dispatch = useAppDispatch();
	const store = getStore();

	const { t } = useTranslation(['profileSetting']);

	const [currentUserProfileValue, setCurrentUserProfileValue] = useState<IUserProfileValue>({
		username: '',
		imgUrl: '',
		displayName: '',
		aboutMe: ''
	});
	const styles = style(themeValue);

	useEffect(() => {
		const userProfile = selectAllAccount(store.getState());
		const { display_name, avatar_url, username, about_me } = userProfile?.user || {};
		const initialValue: IUserProfileValue = {
			username: username || '',
			imgUrl: avatar_url || '',
			displayName: display_name || username || '',
			aboutMe: about_me || ''
		};
		setCurrentUserProfileValue(initialValue);
	}, []);

	const handleAvatarChange = useCallback(
		async (imgUrl: string) => {
			setCurrentUserProfileValue((prevValue) => ({
				...prevValue,
				imgUrl
			}));
		},
		[setCurrentUserProfileValue]
	);

	const handleDetailChange = (newValue: Partial<IUserProfileValue>) => {
		setCurrentUserProfileValue((prevValue) => ({ ...prevValue, ...newValue }));
	};

	const updateUserProfile = async () => {
		const userProfile = selectAllAccount(store.getState());
		const { username, imgUrl, displayName, aboutMe } = currentUserProfileValue;
		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const response = await updateUser(
				username || '',
				imgUrl || '',
				displayName?.trim() || '',
				aboutMe || '',
				userProfile?.user?.dob || '',
				userProfile?.logo || '',
				true
			);

			dispatch(appActions.setLoadingMainMobile(false));
			if (response && response?.status !== 400) {
				Toast.show({
					type: 'info',
					text1: t('updateProfileSuccess')
				});
				navigation.goBack();
			} else {
				Toast.show({
					type: 'error',
					text1: t('updateProfileError')
				});
			}
		} catch (e) {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	useImperativeHandle(ref, () => ({
		triggerSave: () => {
			updateUserProfile();
		}
	}));

	return (
		<KeyboardAvoidingView behavior="position" style={styles.container}>
			<BannerAvatar
				avatar={currentUserProfileValue?.imgUrl}
				alt={currentUserProfileValue?.username}
				onLoad={handleAvatarChange}
				defaultAvatar={process?.env?.NX_LOGO_MEZON || NX_LOGO_MEZON || ''}
			/>

			<DetailInfo
				value={{
					displayName: currentUserProfileValue.displayName,
					username: currentUserProfileValue.username,
					aboutMe: currentUserProfileValue.aboutMe,
					imgUrl: currentUserProfileValue.imgUrl
				}}
				onChange={handleDetailChange}
			/>

			<DirectMessageLogo />
		</KeyboardAvoidingView>
	);
});

export default memo(UserProfile);
