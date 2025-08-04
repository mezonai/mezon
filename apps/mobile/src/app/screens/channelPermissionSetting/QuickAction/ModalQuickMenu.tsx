import { ActionEmitEvent } from '@mezon/mobile-components';
import { useTheme } from '@mezon/mobile-ui';
import { addQuickMenuAccess, listQuickMenuAccess, updateQuickMenuAccess, useAppDispatch } from '@mezon/store-mobile';
import { QUICK_MENU_TYPE } from '@mezon/utils';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonIconCDN from '../../../componentUI/MezonIconCDN';
import MezonInput from '../../../componentUI/MezonInput';
import { IconCDN } from '../../../constants/icon_cdn';
import { style } from './quickAction.style';

interface ModalQuickMenuProps {
	readonly initialFormKey: string;
	readonly initialFormValue: string;
	readonly editKey: string;
	readonly channelId: string;
	readonly clanId: string;
	readonly menuType: number; // 1 for Flash Message , 2 for Quick Menu
}

const ModalQuickMenu = React.memo(({ initialFormKey, initialFormValue, editKey, channelId, clanId, menuType }: ModalQuickMenuProps) => {
	const { themeValue } = useTheme();
	const styles = useMemo(() => style(themeValue), [themeValue]);
	const { t } = useTranslation('channelSetting');
	const dispatch = useAppDispatch();
	const [formKey, setFormKey] = useState(initialFormKey);
	const [formValue, setFormValue] = useState(initialFormValue);

	const getModalTitle = useCallback(() => {
		if (editKey) {
			return menuType === QUICK_MENU_TYPE.QUICK_MENU ? t('quickAction.editQuickMenu') : t('quickAction.editFlashMessage');
		}
		return menuType === QUICK_MENU_TYPE.QUICK_MENU ? t('quickAction.createQuickMenu') : t('quickAction.createFlashMessage');
	}, [editKey, menuType, t]);

	const modalTitle = useMemo(() => getModalTitle(), [getModalTitle]);

	const onSubmit = useCallback(async () => {
		if (!formKey || !clanId || (menuType === QUICK_MENU_TYPE.FLASH_MESSAGE && !formValue)) return;
		try {
			if (editKey) {
				await dispatch(
					updateQuickMenuAccess({
						id: editKey,
						channelId,
						clanId,
						menu_name: formKey,
						action_msg: formValue || t('quickAction.botEventTrigger'),
						menu_type: menuType
					})
				).unwrap();
			} else {
				await dispatch(
					addQuickMenuAccess({
						channelId,
						clanId,
						menu_name: formKey,
						action_msg: formValue || t('quickAction.botEventTrigger'),
						menu_type: menuType
					})
				).unwrap();
			}

			await dispatch(listQuickMenuAccess({ channelId, menuType }));
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
		} catch (error: any) {
			Toast.show({
				type: 'error',
				text1: `Error: ${error.message}`
			});
		}
	}, [formKey, formValue, clanId, menuType, editKey, channelId, dispatch, t]);

	const onCancel = useCallback(() => {
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_MODAL, { isDismiss: true });
	}, []);

	const handleFormKeyChange = useCallback((value: string) => {
		setFormKey(value);
	}, []);

	const handleFormValueChange = useCallback((value: string) => {
		setFormValue(value);
	}, []);

	const renderFlashMessageContent = useMemo(() => (
		<>
			<MezonInput placeHolder={t('quickAction.keyTitle')} value={formKey} onTextChange={handleFormKeyChange} />
			<MezonInput placeHolder={t('quickAction.valueTitle')} value={formValue} onTextChange={handleFormValueChange} textarea={true} maxCharacter={300} />
		</>
	), [formKey, formValue, t, handleFormKeyChange, handleFormValueChange]);

	const renderQuickMenuContent = useMemo(() => (
		<>
			<View style={styles.inputGroup}>
				<View style={styles.labelContainer}>
					<Text style={styles.inputLabel}>{t('quickAction.menuName')}</Text>
					<Text style={styles.requiredAsterisk}> *</Text>
				</View>
				<MezonInput placeHolder="menu-name" value={formKey} onTextChange={handleFormKeyChange} defaultValue="menu-name" />
				<Text style={styles.helperText}>{t('quickAction.menuNameHelper')}</Text>
			</View>

			<View style={styles.infoBox}>
				<MezonIconCDN icon={IconCDN.circleInformation} color={themeValue.headerInfor} customStyle={styles.infoIcon} />
				<View style={styles.infoContent}>
					<Text style={styles.infoTitle}>{t('quickAction.botEventTrigger')}</Text>
					<Text style={styles.infoDescription}>{t('quickAction.botEventDescription')}</Text>
				</View>
			</View>
		</>
	), [formKey, t, styles, handleFormKeyChange]);

	const buttonText = useMemo(() => editKey ? t('quickAction.save') : t('quickAction.create'), [editKey, t]);

	return (
		<View style={styles.modalContainer}>
			<View style={styles.modalBox}>
				<Text style={styles.modalTitle}>{modalTitle}</Text>

				{menuType === QUICK_MENU_TYPE.FLASH_MESSAGE ? renderFlashMessageContent : renderQuickMenuContent}

				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
						<Text style={styles.cancelButtonText}>{t('quickAction.cancel')}</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.createButton} onPress={onSubmit}>
						<Text style={styles.createButtonText}>{buttonText}</Text>
					</TouchableOpacity>
				</View>
			</View>
			<TouchableOpacity style={styles.backdrop} onPress={onCancel} />
		</View>
	);
});

ModalQuickMenu.displayName = 'ModalQuickMenu';

export default ModalQuickMenu;
