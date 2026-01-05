import { BottomSheetFlatList, BottomSheetModal } from '@gorhom/bottom-sheet';
import { size, useTheme } from '@mezon/mobile-ui';
import { ClansEntity, addBotChat, getApplicationDetail, selectAppDetail, selectOrderedClans, useAppDispatch } from '@mezon/store-mobile';
import { normalizeString } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import MezonClanAvatar from '../../componentUI/MezonClanAvatar';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import MezonInput from '../../componentUI/MezonInput';
import Backdrop from '../../components/BottomSheetRootListener/backdrop';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import { style } from './styles';
const ITEM_HEIGHT = size.s_60;

const InstallClanScreen = ({ route }: { route: any }) => {
	const appId = route?.params?.appId;
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const dispatch = useAppDispatch();
	const navigation = useNavigation<any>();
	const { t } = useTranslation('linkAppInstall');
	const applicationDetail = useSelector(selectAppDetail);
	const clanListUser = useSelector(selectOrderedClans);
	const [searchText, setSearchText] = React.useState<string>('');
	const [clan, setClans] = React.useState<ClansEntity>();
	const BottomSheetRef = useRef<BottomSheetModal>(null);

	useEffect(() => {
		dispatch(getApplicationDetail({ appId }));
	}, [appId]);

	const filteredOptionsClan = useMemo(() => {
		if (!searchText) {
			return clanListUser;
		}
		return clanListUser.filter((item) => normalizeString(item.clan_name.toLowerCase()).includes(normalizeString(searchText.toLowerCase())));
	}, [clanListUser, searchText]);

	const handleSearchText = debounce((value: string) => {
		setSearchText(value);
	}, 500);

	const handleSelectClan = (clan: ClansEntity) => {
		setClans(clan);
		BottomSheetRef?.current?.dismiss();
	};

	const getItemLayout = useCallback(
		(data, index) => ({
			length: ITEM_HEIGHT,
			offset: ITEM_HEIGHT * index,
			index
		}),
		[]
	);

	const renderItem = ({ item }: { item: ClansEntity }) => {
		return (
			<Pressable key={`channel_event_${item.clanId}`} onPress={() => handleSelectClan(item)} style={styles.items}>
				<Text style={styles.inputValue} numberOfLines={1} ellipsizeMode="tail">
					{item.clan_name}
				</Text>
			</Pressable>
		);
	};

	const handleShowBottomSheetClan = () => {
		Keyboard.dismiss();
		setSearchText('');
		BottomSheetRef?.current?.present();
	};

	const handleAddBotOrApp = useCallback(async () => {
		try {
			const result = await dispatch(
				addBotChat({
					appId,
					clanId: clan?.clanId
				})
			);
			if (result.meta.requestStatus === 'rejected') {
				throw new Error();
			} else {
				Toast.show({ type: 'success', props: { text2: t('successInstall') } });
			}
		} catch (err) {
			console.error('Error adding bot/app to clan:', err);
			Toast.show({ type: 'error', props: { text2: t('errorInstall') } });
		}

		onDismiss();
	}, [appId, clan?.clanId, dispatch]);

	const onDismiss = async () => {
		navigation.navigate(APP_SCREEN.BOTTOM_BAR);
	};
	return (
		<View style={styles.container}>
			<View style={styles.inviteContainer}>
				<View style={styles.clanInfo}>
					<View style={styles.clanAvatar}>
						<MezonClanAvatar image={applicationDetail?.applogo} imageHeight={100} imageWidth={100} />
					</View>
					<Text style={styles.inviteTitle}>{applicationDetail?.appname}</Text>
					<Text style={styles.appDescription}>{t('description')}</Text>
					<Text style={styles.appDescription}>{t('subDescription')}</Text>
				</View>

				<Text style={styles.clanTitle}>{t('addToClan')}</Text>
				<TouchableOpacity style={styles.fakeInput} onPress={handleShowBottomSheetClan}>
					<Text style={styles.inputValue}>{clan?.clan_name || t('placeholder')} </Text>
					<View style={styles.chevronDownIcon}>
						<MezonIconCDN icon={IconCDN.chevronDownSmallIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
					</View>
				</TouchableOpacity>

				<TouchableOpacity style={styles.joinButton} activeOpacity={0.8} onPress={handleAddBotOrApp} disabled={!clan?.clanId}>
					<Text style={styles.joinButtonText}>{t('invite')}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={[styles.joinButton, styles.disMissButton]} onPress={onDismiss} activeOpacity={0.8}>
					<Text style={styles.joinButtonText}>{t('back')}</Text>
				</TouchableOpacity>
				<BottomSheetModal
					ref={BottomSheetRef}
					enableDynamicSizing={false}
					snapPoints={['80%']}
					backdropComponent={Backdrop}
					android_keyboardInputMode="adjustResize"
					style={styles.bottomSheet}
					backgroundStyle={{ backgroundColor: themeValue.primary }}
				>
					<MezonInput
						autoFocus={true}
						inputWrapperStyle={styles.searchText}
						placeHolder={t('selectClan')}
						onTextChange={handleSearchText}
						prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={20} width={20} />}
					/>

					<BottomSheetFlatList
						keyExtractor={(item) => item?.clanId.toString()}
						keyboardShouldPersistTaps="handled"
						data={filteredOptionsClan}
						renderItem={renderItem}
						getItemLayout={getItemLayout}
						style={{
							borderRadius: size.s_8,
							marginTop: size.s_10
						}}
						contentContainerStyle={styles.bottomSheetContent}
						removeClippedSubviews
						maxToRenderPerBatch={10}
						initialNumToRender={15}
						windowSize={5}
						updateCellsBatchingPeriod={50}
					/>
				</BottomSheetModal>
			</View>
		</View>
	);
};

export default InstallClanScreen;
