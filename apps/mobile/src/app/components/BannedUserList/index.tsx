import { size, useTheme } from '@mezon/mobile-ui';
import { selectBanMemberByChannelId, useAppDispatch, useAppSelector, usersClanActions } from '@mezon/store-mobile';
import type { UsersClanEntity } from '@mezon/utils';
import { normalizeString } from '@mezon/utils';
import debounce from 'lodash.debounce';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import type { APP_SCREEN, MenuChannelScreenProps } from '../../navigation/ScreenTypes';
import StatusBarHeight from '../StatusBarHeight/StatusBarHeight';
import BannedUserItem from './BannedUserItem';
import { style } from './styles';

type ChannelSettingsScreen = typeof APP_SCREEN.MENU_CHANNEL.LIST_BANNED_USERS;
const BannedUserListScreen = ({ navigation, route }: MenuChannelScreenProps<ChannelSettingsScreen>) => {
	const { channelId, clanId } = route.params;
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const { t } = useTranslation('userProfile');
	const listUserClanBanned = useAppSelector((state) => selectBanMemberByChannelId(state, channelId || ''));
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(usersClanActions.fetchListBanUser({ clanId, channelId }));
	}, []);

	const [searchText, setSearchText] = useState('');
	const searchInputRef = useRef(null);

	const renderItem = ({ item }: { item: UsersClanEntity }) => {
		return <BannedUserItem user={item} clanId={clanId} channelId={channelId} />;
	};

	const filteredBannedUserList = useMemo(
		() =>
			listUserClanBanned?.filter((user) => {
				return (
					normalizeString(user?.clanNick)?.includes(normalizeString(searchText)) ||
					normalizeString(user?.user?.displayName)?.includes(normalizeString(searchText))
				);
			}) || [],
		[listUserClanBanned, searchText]
	);

	const clearTextInput = () => {
		if (searchInputRef?.current) {
			searchInputRef?.current?.clear();
			setSearchText('');
		}
	};

	const typingSearchDebounce = debounce((text) => {
		setSearchText(text);
	}, 500);

	return (
		<View style={styles.container}>
			<StatusBarHeight />
			<View style={styles.wrapper}>
				<View style={styles.header}>
					<Pressable style={styles.backButton} onPress={navigation.goBack}>
						<MezonIconCDN icon={IconCDN.arrowLargeLeftIcon} height={size.s_20} width={size.s_20} color={themeValue.textStrong} />
					</Pressable>
					<View style={styles.titleWrapper}>
						<Text style={styles.name} numberOfLines={1}>
							{t('ban.banList')}
						</Text>
					</View>
				</View>
				{!listUserClanBanned?.length ? (
					<View style={styles.emptyListWrapper}>
						<MezonIconCDN icon={IconCDN.hammerIcon} height={size.s_80} width={size.s_80} color={themeValue.textDisabled} />
						<Text style={styles.emptyList}>{t('ban.banListEmpty')}</Text>
					</View>
				) : (
					<View>
						<View style={styles.searchBox}>
							<MezonIconCDN icon={IconCDN.magnifyingIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
							<TextInput
								ref={searchInputRef}
								placeholder={t('ban.search')}
								placeholderTextColor={themeValue.textDisabled}
								style={styles.searchInput}
								onChangeText={(text) => typingSearchDebounce(text)}
							/>
							{!!searchText?.length && (
								<Pressable onPress={clearTextInput}>
									<MezonIconCDN icon={IconCDN.circleXIcon} height={size.s_20} width={size.s_20} color={themeValue.text} />
								</Pressable>
							)}
						</View>

						<FlatList
							data={filteredBannedUserList}
							renderItem={renderItem}
							keyExtractor={(item) => `banned_user_${item?.id}`}
							showsVerticalScrollIndicator={false}
							initialNumToRender={1}
							maxToRenderPerBatch={1}
							windowSize={2}
						/>
					</View>
				)}
			</View>
		</View>
	);
};

export default BannedUserListScreen;
