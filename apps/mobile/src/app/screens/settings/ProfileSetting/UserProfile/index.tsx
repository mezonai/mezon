import { TouchableOpacity } from '@gorhom/bottom-sheet';
import { useAuth } from '@mezon/core';
import { size, useTheme } from '@mezon/mobile-ui';
import { KeyboardAvoidingView, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { IUserProfileValue } from '..';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import { IconCDN } from '../../../../constants/icon_cdn';
import BannerAvatar from './components/Banner';
import DetailInfo from './components/Info';
import { DirectMessageLogo } from './components/Logo';
import { style } from './styles';

interface IUserProfile {
	userProfileValue: IUserProfileValue;
	setCurrentUserProfileValue: (updateFn: (prevValue: IUserProfileValue) => IUserProfileValue) => void;
}

export default function UserProfile({ userProfileValue, setCurrentUserProfileValue }: IUserProfile) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const auth = useAuth();
	const handleAvatarChange = async (imgUrl: string) => {
		const { username, displayName, aboutMe } = userProfileValue;
		setCurrentUserProfileValue((prevValue) => ({ ...prevValue, imgUrl: imgUrl, username, aboutMe, displayName }));
	};

	const handleDetailChange = (newValue: Partial<IUserProfileValue>) => {
		setCurrentUserProfileValue((prevValue) => ({ ...prevValue, ...newValue }));
	};

	function handleHashtagPress() {
		Toast.show({
			type: 'info',
			text1: 'Original known as ' + auth.userProfile?.user?.username + '#' + auth.userId
		});
	}

	return (
		<KeyboardAvoidingView behavior="position" style={styles.container}>
			<BannerAvatar
				avatar={userProfileValue?.imgUrl}
				alt={userProfileValue?.username}
				onLoad={handleAvatarChange}
				defaultAvatar={process.env.NX_LOGO_MEZON || ''}
			/>
			<View style={styles.btnGroup}>
				<TouchableOpacity onPress={() => handleHashtagPress()} style={styles.btnIcon}>
					<MezonIconCDN icon={IconCDN.channelText} width={size.s_16} height={size.s_16} />
				</TouchableOpacity>
			</View>

			<DetailInfo
				value={{
					displayName: userProfileValue.displayName,
					username: userProfileValue.username,
					aboutMe: userProfileValue.aboutMe,
					imgUrl: userProfileValue.imgUrl
				}}
				onChange={handleDetailChange}
			/>

			<DirectMessageLogo />
		</KeyboardAvoidingView>
	);
}
