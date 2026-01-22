import { useChatSending } from '@mezon/core';
import { debounce, type IUserMention } from '@mezon/mobile-components';
import { size, useTheme } from '@mezon/mobile-ui';
import type { FriendsEntity } from '@mezon/store-mobile';
import {
	EStateFriend,
	selectAllFriends,
	selectCurrentChannel,
	selectCurrentDM,
	selectCurrentTopicId,
	selectIsShowCreateTopic,
	selectLoadingStatusFriend
} from '@mezon/store-mobile';
import { TypeMessage } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import type { ApiChannelDescription } from 'mezon-js/api.gen';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { useSelector } from 'react-redux';
import Images from '../../../../../../assets/Images';
import MezonIconCDN from '../../../../../componentUI/MezonIconCDN';
import MezonInput from '../../../../../componentUI/MezonInput';
import { SeparatorWithLine } from '../../../../../components/Common/Common';
import LoadingModal from '../../../../../components/LoadingModal/LoadingModal';
import StatusBarHeight from '../../../../../components/StatusBarHeight/StatusBarHeight';
import UserInfoSearch from '../../../../../components/ThreadDetail/SearchMessageChannel/SearchOptionPage/UserInfoSearch';
import { IconCDN } from '../../../../../constants/icon_cdn';
import { style } from './styles';

const DEBOUNCE_SEARCH_MS = 300;

const ShareContactScreen = () => {
	const navigation = useNavigation();
	const { t } = useTranslation(['message', 'common']);
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const [searchText, setSearchText] = useState<string>('');
	const [debouncedSearchText, setDebouncedSearchText] = useState<string>('');

	const allFriends = useSelector(selectAllFriends);
	const currentChannel = useSelector(selectCurrentChannel);
	const currentDM = useSelector(selectCurrentDM);
	const isCreateTopic = useSelector(selectIsShowCreateTopic);
	const currentTopicId = useSelector(selectCurrentTopicId);
	const loadingStatus = useSelector(selectLoadingStatusFriend);
	const channelOrDirect = useMemo(() => {
		return (currentDM || currentChannel) as ApiChannelDescription | undefined;
	}, [currentDM, currentChannel]);

	const friendList = useMemo(() => {
		return allFriends?.length > 0 && allFriends.filter((friend) => friend?.state === EStateFriend.FRIEND);
	}, [allFriends]);

	const mode = useMemo(() => {
		switch (channelOrDirect?.type) {
			case ChannelType.CHANNEL_TYPE_DM:
				return ChannelStreamMode.STREAM_MODE_DM;
			case ChannelType.CHANNEL_TYPE_GROUP:
				return ChannelStreamMode.STREAM_MODE_GROUP;
			case ChannelType.CHANNEL_TYPE_THREAD:
				return ChannelStreamMode.STREAM_MODE_THREAD;
			default:
				return ChannelStreamMode.STREAM_MODE_CHANNEL;
		}
	}, [channelOrDirect?.type]);

	const { sendMessage } = useChatSending({ mode, channelOrDirect, fromTopic: isCreateTopic || !!currentTopicId });

	const debouncedSetSearchText = useMemo(
		() =>
			debounce((value: string) => {
				setDebouncedSearchText(value);
			}, DEBOUNCE_SEARCH_MS),
		[]
	);

	const handleSearchTextChange = useCallback(
		(value: string) => {
			setSearchText(value);
			debouncedSetSearchText(value);
		},
		[debouncedSetSearchText]
	);

	const filteredUsers = useMemo(() => {
		const query = debouncedSearchText.trim().toLowerCase();
		if (!query) return friendList || [];

		return friendList?.filter(({ user }) => [user?.display_name, user?.username].some((name) => name?.toLowerCase()?.includes(query))) || [];
	}, [debouncedSearchText, friendList]);

	const onClose = useCallback(() => navigation.goBack(), [navigation]);

	const handleSelectMember = useCallback(
		async (user: FriendsEntity) => {
			try {
				sendMessage(
					{
						t: '',
						embed: [
							{
								fields: [
									{ name: 'key', value: 'share_contact', inline: true },
									{ name: 'user_id', value: user?.user?.id || user?.id || '', inline: true },
									{ name: 'username', value: user?.user?.username || '', inline: true },
									{
										name: 'display_name',
										value: user?.user?.display_name || user?.user?.username || '',
										inline: true
									},
									{ name: 'avatar', value: user?.user?.avatar_url || '', inline: true }
								]
							}
						]
					},
					[],
					[],
					[],
					undefined,
					undefined,
					undefined,
					TypeMessage.ShareContact
				);
				onClose();
			} catch (error) {
				Toast.show({
					type: 'error',
					text1: t('common:somethingWentWrong')
				});
			}
		},
		[sendMessage, t, onClose]
	);

	const renderMemberItem = useCallback(
		({ item }: { item: FriendsEntity }) => {
			const userData: IUserMention = {
				id: item?.user?.id || item?.id || '',
				avatarUrl: item?.user?.avatar_url || '',
				display: item?.user?.display_name || item?.user?.username || '',
				subDisplay: item?.user?.username ? `@${item.user.username}` : ''
			};
			return <UserInfoSearch userData={userData} onSelectUserInfo={() => handleSelectMember(item)} />;
		},
		[handleSelectMember]
	);

	return (
		<View style={styles.container}>
			<StatusBarHeight />
			<View style={styles.wrapper}>
				<View style={styles.header}>
					<TouchableOpacity onPress={onClose} style={styles.container}>
						<MezonIconCDN icon={IconCDN.closeLargeIcon} color={themeValue.textStrong} width={size.s_18} height={size.s_18} />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>{t('common:shareContactTitle')}</Text>
					<View style={styles.container} />
				</View>

				<MezonInput
					placeHolder={t('common:search')}
					onTextChange={handleSearchTextChange}
					value={searchText}
					prefixIcon={<MezonIconCDN icon={IconCDN.magnifyingIcon} color={themeValue.text} height={size.s_18} width={size.s_18} />}
					inputWrapperStyle={styles.inputWrapper}
				/>

				<View style={styles.contentWrapper}>
					{loadingStatus === 'loading' ? (
						<View style={styles.loadingView}>
							<LoadingModal isVisible={true} isTransparent />
						</View>
					) : loadingStatus === 'loaded' ? (
						filteredUsers.length > 0 ? (
							<FlatList
								data={filteredUsers}
								keyExtractor={(user, index) => `${user?.user?.id || user?.id}_${index}_user`}
								ItemSeparatorComponent={SeparatorWithLine}
								renderItem={({ item }: { item: FriendsEntity }) => renderMemberItem({ item })}
								keyboardShouldPersistTaps={'handled'}
								onEndReachedThreshold={0.1}
								initialNumToRender={5}
								maxToRenderPerBatch={5}
								windowSize={15}
								updateCellsBatchingPeriod={10}
								decelerationRate={'fast'}
								disableVirtualization
								removeClippedSubviews
								getItemLayout={(_, index) => ({
									length: size.s_60,
									offset: size.s_60 * index,
									index
								})}
							/>
						) : (
							<View style={styles.emptyContainer}>
								<Image source={Images.EMPTY_FRIEND} style={styles.emptyImage} />
								<Text style={styles.emptyText}>{t('noContactsFound')}</Text>
							</View>
						)
					) : null}
				</View>
			</View>
		</View>
	);
};

export default memo(ShareContactScreen);
