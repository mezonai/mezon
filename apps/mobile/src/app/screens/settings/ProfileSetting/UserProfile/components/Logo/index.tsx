import { useAuth } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import { clansActions, selectLogoCustom, useAppDispatch } from '@mezon/store-mobile';
import { memo } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import LogoMezonDark from '../../../../../../../assets/svg/logoMezonDark.svg';
import LogoMezonLight from '../../../../../../../assets/svg/logoMezonLight.svg';
import MezonImagePicker from '../../../../../../componentUI/MezonImagePicker';
import { style } from './styles';

export const DirectMessageLogo = memo(() => {
	const { themeValue, themeBasic } = useTheme();
	const styles = style(themeValue);
	const logoCustom = useSelector(selectLogoCustom);
	const dispatch = useAppDispatch();
	const { userProfile } = useAuth();

	const handleOnLoad = (url) => {
		if (url) {
			dispatch(
				clansActions.updateUser({
					user_name: userProfile.user.username,
					avatar_url: userProfile.user.avatar_url,
					display_name: userProfile.user.display_name,
					about_me: userProfile.user.about_me,
					dob: userProfile.user.dob,
					logo: url
				})
			);
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Direct Message Icon</Text>
			<MezonImagePicker
				defaultValue={logoCustom}
				height={size.s_50}
				width={size.s_50}
				localValue={!logoCustom && (themeBasic === 'dark' ? <LogoMezonDark /> : <LogoMezonLight />)}
				onLoad={handleOnLoad}
				autoUpload
			/>
		</View>
	);
});
