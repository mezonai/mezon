import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAuth } from '@mezon/core';
import { ActionEmitEvent, CheckIcon, Icons } from '@mezon/mobile-components';
import { Text, size, useTheme } from '@mezon/mobile-ui';
import { ClansEntity, selectAllClans, selectCurrentClan } from '@mezon/store-mobile';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Dimensions, FlatList, Keyboard, KeyboardAvoidingView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import { IClanProfileValue } from '..';
import { SeparatorWithLine } from '../../../../../app/components/Common';
import { MezonClanAvatar, MezonInput } from '../../../../componentUI';
import { normalizeString } from '../../../../utils/helpers';
import BannerAvatar from '../UserProfile/components/Banner';
import { style } from './styles';

interface IServerProfile {
	clanProfileValue: IClanProfileValue;
	isClanProfileNotChanged?: boolean;
	setCurrentClanProfileValue: (updateFn: (prevValue: IClanProfileValue) => IClanProfileValue) => void;
	onSelectedClan: (clan: ClansEntity) => void;
}

export default function ServerProfile({ clanProfileValue, isClanProfileNotChanged, setCurrentClanProfileValue, onSelectedClan }: IServerProfile) {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { userProfile, userId } = useAuth();
	const bottomSheetDetail = useRef<BottomSheetModal>(null);
	const { t } = useTranslation(['profileSetting']);
	const clans = useSelector(selectAllClans);
	const currentClan = useSelector(selectCurrentClan);
	const [selectedClan, setSelectedClan] = useState<ClansEntity>(currentClan);
	const [searchClanText, setSearchClanText] = useState('');

	const onPressHashtag = () => {
		Toast.show({
			type: 'info',
			text1: 'Original known as ' + userProfile?.user?.username + '#' + userId
		});
	};

	const onValueChange = (newValue: Partial<IClanProfileValue>) => {
		setCurrentClanProfileValue((prevValue) => ({ ...prevValue, ...newValue }));
	};

	const switchClan = (clan: ClansEntity) => {
		if (isClanProfileNotChanged) {
			setSelectedClan(clan);
			onSelectedClan(clan);
			bottomSheetDetail.current?.close();
			return;
		}

		Alert.alert(
			t('changedAlert.title'),
			t('changedAlert.description'),
			[
				{
					text: t('changedAlert.keepEditing'),
					style: 'cancel'
				},
				{
					text: t('changedAlert.discard'),
					onPress: () => {
						setSelectedClan(clan);
						onSelectedClan(clan);
					}
				}
			],
			{ cancelable: false }
		);
		bottomSheetDetail.current?.close();
	};

	const handleAvatarChange = (url: string) => {
		setCurrentClanProfileValue((prevValue) => ({ ...prevValue, imgUrl: url }));
	};

	useEffect(() => {
		const keyboardListener = Keyboard.addListener('keyboardDidShow', () => {
			bottomSheetDetail?.current?.snapToIndex(1);
		});
		const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
			bottomSheetDetail?.current?.snapToIndex(0);
		});
		return () => {
			keyboardListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	const filteredClanList = useMemo(() => {
		return clans?.filter((it) => normalizeString(it?.clan_name)?.includes(normalizeString(searchClanText)));
	}, [searchClanText, clans]);

	const openBottomSheet = () => {
		bottomSheetDetail.current?.present();
		const data = {
			title: t('selectAClan'),
			heightFitContent: true,
			children: (
				<View style={styles.bottomSheetContainer}>
					<MezonInput value={searchClanText} onTextChange={setSearchClanText} placeHolder={t('searchClanPlaceholder')} />
					<FlatList
						data={filteredClanList}
						keyExtractor={(item) => item?.id}
						ItemSeparatorComponent={SeparatorWithLine}
						renderItem={({ item }) => {
							return (
								<TouchableOpacity style={styles.clanItem} onPress={() => switchClan(item)}>
									<View style={styles.optionTitle}>
										<View style={[styles.clanAvatarWrapper]}>
											<MezonClanAvatar alt={item?.clan_name} image={item?.logo} />
										</View>

										<Text style={styles.clanName}>{item?.clan_name}</Text>
									</View>
									{item?.clan_id === selectedClan?.clan_id ? <CheckIcon color="green" /> : null}
								</TouchableOpacity>
							);
						}}
					/>
				</View>
			)
		};
		DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
	};
	return (
		<KeyboardAvoidingView behavior={'position'} style={{ width: Dimensions.get('screen').width }}>
			<TouchableOpacity onPress={() => openBottomSheet()} style={styles.actionItem}>
				<View style={[styles.clanAvatarWrapper]}>
					<MezonClanAvatar image={selectedClan?.logo} alt={selectedClan?.clan_name} />
				</View>
				<View style={{ flex: 1 }}>
					<Text style={styles.clanName}>{selectedClan?.clan_name}</Text>
				</View>
				<Icons.ChevronSmallRightIcon height={size.s_15} width={size.s_15} color={themeValue.text} />
			</TouchableOpacity>

			<BannerAvatar
				avatar={clanProfileValue?.imgUrl}
				alt={clanProfileValue?.username}
				onLoad={handleAvatarChange}
				defaultAvatar={userProfile?.user?.avatar_url || ''}
			/>

			<View style={styles.btnGroup}>
				<TouchableOpacity onPress={() => onPressHashtag()} style={styles.btnIcon}>
					<Icons.TextIcon width={size.s_16} height={size.s_16} />
				</TouchableOpacity>
			</View>

			<View style={styles.clanProfileDetail}>
				<View style={styles.nameWrapper}>
					<Text style={styles.displayNameText}>{clanProfileValue?.displayName || clanProfileValue?.username}</Text>
					<Text style={styles.usernameText}>{clanProfileValue?.username}</Text>
				</View>

				<MezonInput
					value={clanProfileValue?.displayName || clanProfileValue?.username}
					onTextChange={(newValue) => onValueChange({ displayName: newValue })}
					placeHolder={clanProfileValue?.username}
					maxCharacter={32}
					label={t('fields.clanName.label')}
				/>
			</View>

			<View style={{ height: 250 }} />
		</KeyboardAvoidingView>
	);
}
