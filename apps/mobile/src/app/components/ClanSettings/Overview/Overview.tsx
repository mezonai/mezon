import { useClans, usePermissionChecker } from '@mezon/core';
import { Icons } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import { checkDuplicateNameClan, getStoreAsync } from '@mezon/store-mobile';
import { EPermission } from '@mezon/utils';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import MezonImagePicker from '../../../componentUI/MezonImagePicker';
import MezonInput from '../../../componentUI/MezonInput';
import MezonMenu, { IMezonMenuItemProps, IMezonMenuSectionProps, reserve } from '../../../componentUI/MezonMenu';
import MezonOption from '../../../componentUI/MezonOption';
import { APP_SCREEN, MenuClanScreenProps } from '../../../navigation/ScreenTypes';
import { validInput } from '../../../utils/validate';
import DeleteClanModal from '../../DeleteClanModal';
import { ErrorInput } from '../../ErrorInput';
import { style } from './styles';

export const { width } = Dimensions.get('window');
type ClanSettingsScreen = typeof APP_SCREEN.MENU_CLAN.OVERVIEW_SETTING;
export function ClanOverviewSetting({ navigation }: MenuClanScreenProps<ClanSettingsScreen>) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { currentClan, updateClan } = useClans();
	const { t } = useTranslation(['clanOverviewSetting']);
	const [isVisibleDeleteModal, setIsVisibleDeleteModal] = useState<boolean>(false);
	const [clanName, setClanName] = useState<string>(currentClan?.clan_name ?? '');
	const [banner, setBanner] = useState<string>(currentClan?.banner ?? '');
	const [loading, setLoading] = useState<boolean>(false);
	const [hasAdminPermission, hasManageClanPermission, clanOwnerPermission] = usePermissionChecker([
		EPermission.administrator,
		EPermission.manageClan,
		EPermission.clanOwner
	]);
	const [isCheckValid, setIsCheckValid] = useState<boolean>();
	const [errorMessage, setErrorMessage] = useState<string>('');

	const handleCheckDuplicateClanname = async () => {
		const store = await getStoreAsync();
		const isDuplicate = await store.dispatch(checkDuplicateNameClan(clanName?.trim()));
		return isDuplicate?.payload || false;
	};

	useEffect(() => {
		if (clanName === currentClan?.clan_name) {
			setIsCheckValid(banner !== (currentClan?.banner || ''));
			return;
		} else {
			if (!validInput(clanName)) {
				setErrorMessage(t('menu.serverName.errorMessage'));
			}
			setIsCheckValid(validInput(clanName));
		}
	}, [clanName, banner]);

	const disabled = useMemo(() => {
		return !(hasAdminPermission || hasManageClanPermission || clanOwnerPermission);
	}, [clanOwnerPermission, hasAdminPermission, hasManageClanPermission]);

	navigation.setOptions({
		headerBackTitleVisible: false,
		headerRight: () => {
			if (disabled) return <View />;
			return (
				<Pressable onPress={handleSave} disabled={loading || !isCheckValid}>
					<Text style={{ ...styles.headerActionTitle, opacity: loading || !isCheckValid ? 0.5 : 1 }}>{t('header.save')}</Text>
				</Pressable>
			);
		}
	});

	async function handleSave() {
		setLoading(true);

		if (banner === currentClan?.banner) {
			const isDuplicateClan = await handleCheckDuplicateClanname();
			if (isDuplicateClan) {
				setErrorMessage(t('menu.serverName.duplicateNameMessage'));
				setIsCheckValid(false);
				setLoading(false);
				return;
			}
		}

		await updateClan({
			clan_id: currentClan?.clan_id ?? '',
			request: {
				banner: banner,
				clan_name: clanName?.trim() || (currentClan?.clan_name ?? ''),
				creator_id: currentClan?.creator_id ?? '',
				is_onboarding: currentClan?.is_onboarding,
				logo: currentClan?.logo ?? '',
				welcome_channel_id: currentClan?.welcome_channel_id ?? ''
			}
		});

		setLoading(false);
		Toast.show({
			type: 'info',
			text1: t('toast.saveSuccess')
		});

		navigation.goBack();
	}

	function handleLoad(url: string) {
		setBanner(url);
	}

	const handleClearBanner = () => {
		setBanner('');
	};

	const inactiveMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.inactive.inactiveChannel'),
			expandable: true,
			previewValue: 'No Active channel',
			onPress: () => reserve(),
			disabled: disabled
		},
		{
			title: t('menu.inactive.inactiveTimeout'),
			expandable: true,
			previewValue: '5 mins',
			disabled: disabled,
			onPress: () => reserve()
		}
	];

	const systemMessageMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.systemMessage.channel'),
			expandable: true,
			component: <Text style={{ color: 'white', fontSize: 11 }}>general</Text>,
			onPress: () => reserve(),
			disabled: disabled
		}
		// {
		// 	title: t('menu.systemMessage.sendRandomWelcome'),
		// 	component: <MezonSwitch disabled={disabled} />,
		// 	onPress: () => reserve(),
		// 	disabled: disabled
		// },
		// {
		// 	title: t('menu.systemMessage.promptMembersReply'),
		// 	component: <MezonSwitch disabled={disabled} />,
		// 	onPress: () => reserve(),
		// 	disabled: disabled
		// },
		// {
		// 	title: t('menu.systemMessage.sendMessageBoost'),
		// 	component: <MezonSwitch disabled={disabled} />,
		// 	onPress: () => reserve(),
		// 	disabled: disabled
		// },
		// {
		// 	title: t('menu.systemMessage.sendHelpfulTips'),
		// 	component: <MezonSwitch disabled={disabled} />,
		// 	onPress: () => reserve(),
		// 	disabled: disabled
		// },
	];

	const deleteMenu: IMezonMenuItemProps[] = [
		{
			title: t('menu.deleteServer.delete'),
			textStyle: { color: 'red' },
			onPress: () => {
				setIsVisibleDeleteModal(true);
			}
		}
	];

	const generalMenu: IMezonMenuSectionProps[] = [
		{
			items: inactiveMenu,
			title: t('menu.inactive.title'),
			bottomDescription: t('menu.inactive.description')
		},
		{
			items: systemMessageMenu,
			title: t('menu.systemMessage.title'),
			bottomDescription: t('menu.systemMessage.description')
		}
	];

	const dangerMenu: IMezonMenuSectionProps[] = [
		{
			items: deleteMenu
		}
	];

	const optionData = [
		{
			title: t('fields.defaultNotification.allMessages'),
			value: 0,
			disabled: disabled
		},
		{
			title: t('fields.defaultNotification.onlyMentions'),
			value: 1,
			disabled: disabled
		}
	];

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: themeValue.secondary
			}}
		>
			<ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps={'handled'}>
				<MezonImagePicker
					disabled={disabled}
					defaultValue={banner}
					height={200}
					width={width - 40}
					onLoad={handleLoad}
					showHelpText
					autoUpload
				/>

				<Pressable style={{ position: 'absolute', right: size.s_14, top: size.s_34 }} onPress={handleClearBanner}>
					<Icons.CircleXIcon height={25} width={25} color={themeValue.white} />
				</Pressable>

				<View style={{ marginVertical: 10 }}>
					<MezonInput
						label={t('menu.serverName.title')}
						onTextChange={setClanName}
						value={clanName}
						maxCharacter={64}
						disabled={disabled}
					/>
					{!isCheckValid && !!errorMessage && <ErrorInput style={styles.errorInput} errorMessage={errorMessage} />}
				</View>

				<MezonMenu menu={generalMenu} />

				<MezonOption
					title={t('fields.defaultNotification.title')}
					bottomDescription={t('fields.defaultNotification.description')}
					data={optionData}
				/>
				{!disabled && <MezonMenu menu={dangerMenu} />}
			</ScrollView>
			{!disabled && (
				<DeleteClanModal
					isVisibleModal={isVisibleDeleteModal}
					visibleChange={(isVisible) => {
						setIsVisibleDeleteModal(isVisible);
					}}
				></DeleteClanModal>
			)}
		</View>
	);
}
