import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { directActions, useAppDispatch } from '@mezon/store-mobile';
import { ValidateSpecialCharacters } from '@mezon/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonImagePicker, { IMezonImagePickerHandler } from '../../../componentUI/MezonImagePicker';
import MezonInput from '../../../componentUI/MezonInput';
import { IconCDN } from '../../../constants/icon_cdn';
import style from '../MenuCustomDm.styles';

const CustomGroupDm = ({ dmGroupId, channelLabel, currentAvatar }: { dmGroupId: string; channelLabel: string; currentAvatar: string }) => {
	const [nameGroup, setNameGroup] = useState<string>(channelLabel || '');
	const nameGroupRef = useRef(nameGroup);
	const { t } = useTranslation(['menuCustomDM']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [avatarUrl, setAvatarUrl] = useState<string>(currentAvatar);
	const trimmedName = (nameGroup || '').trim();
	const hasNameChanged = !!trimmedName && trimmedName !== (channelLabel || '');
	const hasImageChanged = avatarUrl !== (currentAvatar || '');
	const canSave = hasNameChanged || hasImageChanged;
	const avatarPickerRef = useRef<IMezonImagePickerHandler>(null);

	useEffect(() => {
		nameGroupRef.current = nameGroup;
	}, [nameGroup]);

	const handelChangeText = (text: string) => {
		setNameGroup(text);
	};
	const dispatch = useAppDispatch();

	const handleSave = async (valueName: string) => {
		const trimmedName = (valueName || '').trim();
		const regex = ValidateSpecialCharacters();
		if (!regex.test(trimmedName)) {
			Toast.show({
				type: 'success',
				props: {
					text2: t('invalidGroupName'),
					leadingIcon: <MezonIconCDN icon={IconCDN.circleXIcon} color={baseColor.red} />
				}
			});
			return;
		}
		const hasNameChanged = !!trimmedName && trimmedName !== (channelLabel || '');
		const hasImageChanged = avatarUrl !== (currentAvatar || '');

		if (!(hasNameChanged || hasImageChanged)) return;

		const payload: {
			channel_id: string;
			channel_label?: string;
			topic?: string;
			channel_avatar?: string;
		} = { channel_id: dmGroupId || '' };
		if (hasNameChanged) payload.channel_label = trimmedName;
		if (hasImageChanged) payload.topic = avatarUrl;

		await dispatch(directActions.updateDmGroup(payload));
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const onPressSaveGroup = () => {
		handleSave(nameGroupRef?.current);
	};

	const handleRemoveAvatar = useCallback(() => {
		if (!avatarUrl) return;
		setAvatarUrl('');
	}, [avatarUrl]);

	const shouldDisableRemoveAvatar = !avatarUrl || avatarUrl.includes('avatar-group.png');

	const defaultAvatar = () => {
		if (avatarUrl && !avatarUrl.includes('avatar-group.png')) return undefined;
		return (
			<View style={styles.defaultAvatar}>
				<MezonIconCDN icon={IconCDN.groupIcon} color={baseColor.white} />
			</View>
		);
	};

	const handleAvatarPicker = useCallback(() => {
		if (shouldDisableRemoveAvatar) {
			avatarPickerRef?.current?.openSelector();
		} else {
			handleRemoveAvatar();
		}
	}, [shouldDisableRemoveAvatar, handleRemoveAvatar]);

	return (
		<View style={{ paddingHorizontal: size.s_20, paddingVertical: size.s_10 }}>
			<Text style={styles.headerCustomGroup}>{t('customiseGroup')}</Text>
			<View style={{ paddingVertical: size.s_20, alignItems: 'center' }}>
				<MezonImagePicker
					ref={avatarPickerRef}
					defaultValue={avatarUrl}
					rounded
					height={size.s_60}
					width={size.s_60}
					autoUpload
					onLoad={(url) => setAvatarUrl(url)}
					localValue={defaultAvatar()}
					autoCloseBottomSheet={false}
				/>
				<TouchableOpacity onPress={handleAvatarPicker}>
					<Text style={styles.removeAvatarText}>{shouldDisableRemoveAvatar ? t('uploadImage') : t('removeAvatar')}</Text>
				</TouchableOpacity>
			</View>
			<Text style={styles.labelInput}>{t('groupName')}</Text>
			<MezonInput value={nameGroup} onTextChange={handelChangeText} />
			<TouchableOpacity style={[styles.saveButton, !canSave && { opacity: 0.5 }]} onPress={onPressSaveGroup} disabled={!canSave}>
				<Text style={styles.saveText}>{t('save')}</Text>
			</TouchableOpacity>
		</View>
	);
};

export default CustomGroupDm;
