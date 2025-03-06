import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { useMemo, useRef } from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { useMixImageColor } from '../../../../../../../app/hooks/useMixImageColor';
import { IMezonImagePickerHandler, IMezonMenuSectionProps, MezonImagePicker, MezonMenu } from '../../../../../../componentUI';
import { style } from './styles';

interface IBannerAvatarProps {
	avatar: string;
	onLoad?: (url: string) => void;
	alt?: string;
	defaultAvatar?: string;
}

export default function BannerAvatar({ avatar, onLoad, alt, defaultAvatar }: IBannerAvatarProps) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { color } = useMixImageColor(avatar);
	const avatarPickerRef = useRef<IMezonImagePickerHandler>();

	const handleOnload = async (url: string) => {
		onLoad && onLoad(url);
	};

	const removeAvatar = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		onLoad && onLoad(defaultAvatar || '');
	};

	const pickAvatar = () => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
		avatarPickerRef?.current?.openSelector();
	};

	const menu = useMemo(
		() =>
			({
				items: [
					{
						title: 'Change Avatar',
						onPress: () => pickAvatar()
					},
					{
						title: 'Remove Avatar',
						textStyle: { color: baseColor.redStrong },
						onPress: () => removeAvatar()
					}
				]
			}) satisfies IMezonMenuSectionProps,
		[]
	);

	const openAvatarBS = () => {
		const data = {
			heightFitContent: true,
			children: (
				<View style={{ padding: size.s_20 }}>
					<MezonMenu menu={[menu]} />
				</View>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	return (
		<View>
			<View style={[styles.bannerContainer, { backgroundColor: color }]}>
				<MezonImagePicker
					width={'100%'}
					height={'100%'}
					defaultValue={''}
					defaultColor={color}
					noDefaultText
					style={{ borderWidth: 0, borderRadius: 0 }}
					penPosition={{ right: 10, top: 10 }}
				/>
			</View>

			<View style={styles.avatarContainer}>
				<MezonImagePicker
					ref={avatarPickerRef}
					width={size.s_100}
					height={size.s_100}
					defaultValue={avatar || ''}
					alt={alt}
					rounded
					style={{ borderWidth: 5, borderColor: themeValue.primary }}
					onLoad={handleOnload}
					autoUpload
					penPosition={{ right: 5, top: 5 }}
					onPressAvatar={openAvatarBS}
				/>

				<View style={[styles.onLineStatus]}></View>
			</View>
		</View>
	);
}
