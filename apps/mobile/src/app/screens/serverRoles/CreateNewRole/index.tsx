import { useRoles } from '@mezon/core';
import { CheckIcon, CloseIcon, Icons } from '@mezon/mobile-components';
import { Colors, Text, size, useTheme } from '@mezon/mobile-ui';
import { selectCurrentClanId } from '@mezon/store-mobile';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { MezonInput } from '../../../componentUI';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';

type CreateNewRoleScreen = typeof APP_SCREEN.MENU_CLAN.CREATE_NEW_ROLE;
export const CreateNewRole = ({ navigation }: MenuClanScreenProps<CreateNewRoleScreen>) => {
	const { t } = useTranslation('clanRoles');
	const [roleName, setRoleName] = useState('');
	const currentClanId = useSelector(selectCurrentClanId);
	const { createRole } = useRoles();
	const { themeValue } = useTheme();

	navigation.setOptions({
		headerTitle: t('createNewRole.title'),
		headerLeft: () => (
			<Pressable style={{ padding: 20 }} onPress={() => navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING)}>
				<Icons.CloseSmallBoldIcon height={20} width={20} color={themeValue.textStrong} />
			</Pressable>
		)
	});

	const onRoleNameChange = (roleName: string) => {
		setRoleName(roleName);
	};

	const createNewRole = async () => {
		const response = (await createRole(currentClanId, currentClanId, roleName, [], [])) as any;
		if (response?.id) {
			navigation.navigate(APP_SCREEN.MENU_CLAN.SETUP_PERMISSIONS);
			Toast.show({
				type: 'success',
				props: {
					text2: t('createNewRole.createSuccess', { roleName }),
					leadingIcon: <CheckIcon color={Colors.green} width={20} height={20} />
				}
			});
		} else {
			navigation.navigate(APP_SCREEN.MENU_CLAN.ROLE_SETTING);
			Toast.show({
				type: 'success',
				props: {
					text2: t('failed'),
					leadingIcon: <CloseIcon color={Colors.red} width={20} height={20} />
				}
			});
		}
	};
	return (
		<TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
			<View style={{ backgroundColor: themeValue.primary, flex: 1, paddingHorizontal: size.s_14, justifyContent: 'space-between' }}>
				<View>
					<View style={{ paddingVertical: size.s_10, borderBottomWidth: 1, borderBottomColor: themeValue.borderDim }}>
						<Text color={themeValue.white} h2 center bold>
							{t('createNewRole.createANewRole')}
						</Text>
						<Text color={themeValue.text} center>
							{t('createNewRole.description')}
						</Text>
					</View>
					<View style={{ marginTop: size.s_18 }}>
						<MezonInput
							value={roleName}
							onTextChange={onRoleNameChange}
							placeHolder={t('createNewRole.newRole')}
							label={t('createNewRole.roleName')}
						/>
					</View>
				</View>
				<View style={{ marginBottom: size.s_16 }}>
					<TouchableOpacity
						onPress={() => {
							if (roleName?.trim()?.length === 0) return;
							createNewRole();
						}}
					>
						<View
							style={{
								backgroundColor: roleName?.trim()?.length === 0 ? Colors.bgGrayDark : Colors.bgViolet,
								paddingVertical: size.s_14,
								borderRadius: size.s_8
							}}
						>
							<Text center color={Colors.white}>
								{t('createNewRole.create')}
							</Text>
						</View>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
};
