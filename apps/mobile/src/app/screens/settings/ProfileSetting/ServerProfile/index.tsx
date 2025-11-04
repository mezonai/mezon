import { useClanProfileSetting } from '@mezon/core';
import { ActionEmitEvent } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import {
	ClansEntity,
	appActions,
	checkDuplicateClanNickName,
	selectAllAccount,
	selectAllClans,
	selectCurrentClan,
	selectUserClanProfileByClanID
} from '@mezon/store-mobile';
import { unwrapResult } from '@reduxjs/toolkit';
import { forwardRef, memo, useEffect, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Dimensions, FlatList, KeyboardAvoidingView, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useDispatch, useSelector } from 'react-redux';
import { IClanProfileValue, IUserProfileValue } from '..';
import { SeparatorWithLine } from '../../../../../app/components/Common';
import MezonClanAvatar from '../../../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../componentUI/MezonInput';
import { IconCDN } from '../../../../constants/icon_cdn';
import BannerAvatar from '../UserProfile/components/Banner';
import { style } from './styles';

interface IServerProfile {
	navigation?: any;
}

const ServerProfile = forwardRef(function ServerProfile({ navigation }: IServerProfile, ref) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const userProfile = useSelector(selectAllAccount);
	const { t } = useTranslation(['profileSetting']);
	const clans = useSelector(selectAllClans);
	const currentClan = useSelector(selectCurrentClan);
	const dispatch = useDispatch();

	const [isDuplicateClanNickname, setIsDuplicateClanNickname] = useState(false);
	const [selectedClan, setSelectedClan] = useState<ClansEntity>(currentClan);
	const { updateUserClanProfile } = useClanProfileSetting({ clanId: selectedClan?.id });
	const userClansProfile = useSelector(selectUserClanProfileByClanID(selectedClan?.id, userProfile?.user?.id ?? ''));
	const [currentClanProfileValue, setCurrentClanProfileValue] = useState<IClanProfileValue>({
		username: '',
		imgUrl: '',
		displayName: ''
	});

	useEffect(() => {
		const { username } = userProfile?.user || {};
		const { nick_name } = userClansProfile || {};
		const initialValue: IUserProfileValue = {
			username: username || '',
			imgUrl: userClansProfile?.avatar || userProfile?.user?.avatar_url || '',
			displayName: nick_name || '',
			aboutMe: ''
		};

		setCurrentClanProfileValue(initialValue);
	}, [userClansProfile, userProfile?.user]);

	const checkIsDuplicateClanNickname = async (value: string) => {
		try {
			if (!value || value.trim() === '') {
				setIsDuplicateClanNickname(false);
				return;
			}

			const result = unwrapResult(
				await dispatch(
					checkDuplicateClanNickName({
						clanNickName: value,
						clanId: selectedClan?.id ?? ''
					}) as any
				)
			);

			if (result) {
				setIsDuplicateClanNickname(true);
				return true;
			} else {
				setIsDuplicateClanNickname(false);
				return false;
			}
		} catch (e) {
			return false;
		}
	};

	const onValueChange = (newValue: Partial<IClanProfileValue>) => {
		setCurrentClanProfileValue((prevValue) => ({ ...prevValue, ...newValue }));
	};

	const updateClanProfile = async () => {
		const { displayName, imgUrl } = currentClanProfileValue;
		const isDuplicateNickname = await checkIsDuplicateClanNickname(displayName?.trim() || '');
		if (isDuplicateNickname) return;

		try {
			dispatch(appActions.setLoadingMainMobile(true));
			const response = await updateUserClanProfile(selectedClan?.clan_id ?? '', displayName?.trim() || '', imgUrl || '');

			dispatch(appActions.setLoadingMainMobile(false));
			if (response) {
				Toast.show({
					type: 'info',
					text1: t('updateClanProfileSuccess')
				});
				navigation.goBack();
			}
		} catch (e) {
			dispatch(appActions.setLoadingMainMobile(false));
		}
	};

	const switchClan = (clan: ClansEntity) => {
		setSelectedClan(clan);
		setIsDuplicateClanNickname(false);
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: true });
	};

	const handleAvatarChange = (url: string) => {
		setCurrentClanProfileValue((prevValue) => ({ ...prevValue, imgUrl: url }));
	};

	const openBottomSheet = () => {
		const data = {
			title: t('selectAClan'),
			snapPoint: ['80%'],
			children: (
				<View style={styles.bottomSheetContainer}>
					<FlatList
						data={clans}
						keyExtractor={(item) => item?.id}
						ItemSeparatorComponent={SeparatorWithLine}
						initialNumToRender={1}
						maxToRenderPerBatch={1}
						windowSize={2}
						renderItem={({ item }) => {
							return (
								<TouchableOpacity style={styles.clanItem} onPress={() => switchClan(item)}>
									<View style={styles.optionTitle}>
										<View style={[styles.clanAvatarWrapper]}>
											<MezonClanAvatar alt={item?.clan_name} image={item?.logo} />
										</View>

										<Text style={styles.clanName}>{item?.clan_name}</Text>
									</View>
									{item?.clan_id === selectedClan?.clan_id ? (
										<MezonIconCDN icon={IconCDN.checkmarkSmallIcon} color="green" />
									) : null}
								</TouchableOpacity>
							);
						}}
					/>
				</View>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};

	useImperativeHandle(ref, () => ({
		triggerSave: () => {
			updateClanProfile();
		}
	}));

	return (
		<KeyboardAvoidingView behavior={'position'} style={[styles.keyboardAvoidingView, { width: Dimensions.get('screen').width }]}>
			<TouchableOpacity onPress={() => openBottomSheet()} style={styles.actionItem}>
				<View style={[styles.clanAvatarWrapper]}>
					<MezonClanAvatar image={selectedClan?.logo} alt={selectedClan?.clan_name} />
				</View>
				<View style={styles.clanNameWrapper}>
					<Text style={styles.clanName}>{selectedClan?.clan_name}</Text>
				</View>
				<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={size.s_15} width={size.s_15} color={themeValue.text} />
			</TouchableOpacity>

			<BannerAvatar
				avatar={currentClanProfileValue?.imgUrl || userProfile?.user?.avatar_url}
				alt={currentClanProfileValue?.username}
				onLoad={handleAvatarChange}
				defaultAvatar={userProfile?.user?.avatar_url || ''}
			/>

			<View style={styles.clanProfileDetail}>
				<View style={styles.nameWrapper}>
					<Text style={styles.displayNameText}>{currentClanProfileValue?.displayName}</Text>
					<Text style={styles.usernameText}>{currentClanProfileValue?.username}</Text>
				</View>

				<MezonInput
					value={currentClanProfileValue?.displayName}
					onTextChange={(newValue) => onValueChange({ displayName: newValue })}
					placeHolder={currentClanProfileValue?.username}
					maxCharacter={32}
					label={t('fields.clanNickname.label')}
					errorMessage={isDuplicateClanNickname ? 'The nick name already exists in the clan. Please enter another nick name.' : ''}
					isValid={!isDuplicateClanNickname}
					inputWrapperStyle={[{ backgroundColor: themeValue.primary }]}
				/>
			</View>

			<View style={styles.spacer} />
		</KeyboardAvoidingView>
	);
});

export default memo(ServerProfile);
