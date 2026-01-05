import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { selectAllAccount } from '@mezon/store';
import { EUserStatus, MAX_FILE_SIZE_10MB } from '@mezon/utils';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useMixImageColor } from '../../../../../../../app/hooks/useMixImageColor';
import MezonImagePicker, { IMezonImagePickerHandler } from '../../../../../../componentUI/MezonImagePicker';
import MezonMenu, { IMezonMenuSectionProps } from '../../../../../../componentUI/MezonMenu';
import { UserStatus } from '../../../../../../components/UserStatus';
import { style } from './styles';

interface IBannerAvatarProps {
	avatar: string;
	onLoad?: (url: string) => void;
	alt?: string;
	defaultAvatar?: string;
}

export default memo(function BannerAvatar({ avatar, onLoad, alt, defaultAvatar }: IBannerAvatarProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { color } = useMixImageColor(avatar);
	const avatarPickerRef = useRef<IMezonImagePickerHandler>(null);
	const { t } = useTranslation(['profile']);
	const userProfile = useSelector(selectAllAccount);

	const handleOnload = useCallback(
		async (url: string) => {
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
			onLoad && onLoad(url);
		},
		[onLoad]
	);

	const removeAvatar = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		onLoad && onLoad(defaultAvatar || '');
	};

	const pickAvatar = () => {
		avatarPickerRef?.current?.openSelector();
	};
	const userStatus = useMemo(() => {
		return {
			status: userProfile?.user?.status || EUserStatus.ONLINE,
			userStatus: userProfile?.user?.userStatus
		};
	}, [userProfile?.user?.status, userProfile?.user?.userStatus]);

	const menu = useMemo(
		() =>
			({
				items: [
					{
						title: t('changeAvatar'),
						onPress: () => pickAvatar()
					},
					{
						title: t('removeAvatar'),
						textStyle: { color: baseColor.redStrong },
						onPress: () => removeAvatar()
					}
				]
			}) satisfies IMezonMenuSectionProps,
		[]
	);

	const openAvatarBS = useCallback(() => {
		const data = {
			heightFitContent: true,
			children: (
				<View style={styles.menuContainer}>
					<MezonMenu menu={[menu]} />
				</View>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	}, [menu]);

	return (
		<View>
			<View style={[styles.bannerContainer, { backgroundColor: color }]}>
				<MezonImagePicker
					width={'100%'}
					height={'100%'}
					defaultValue={''}
					defaultColor={color}
					noDefaultText
					style={styles.bannerImage}
					disabled={true}
					imageSizeLimit={MAX_FILE_SIZE_10MB}
				/>
			</View>

			<View style={styles.avatarContainer}>
				<MezonImagePicker
					ref={avatarPickerRef}
					autoCloseBottomSheet={false}
					width={size.s_100}
					height={size.s_100}
					defaultValue={avatar || ''}
					alt={alt}
					rounded
					style={[styles.avatarImage, { borderColor: themeValue.primary }]}
					onLoad={handleOnload}
					autoUpload
					onPressAvatar={openAvatarBS}
					imageHeight={400}
					imageWidth={400}
					imageSizeLimit={MAX_FILE_SIZE_10MB}
					isOauth={true}
				/>

				<View style={[styles.onLineStatus]}>
					<UserStatus status={userStatus} customStatus={userStatus?.status} />
				</View>
			</View>
		</View>
	);
});
