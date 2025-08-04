import { ActionEmitEvent, load, STORAGE_MY_USER_ID } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import {
	DirectEntity,
	selectAllChannelMembers,
	selectAllUserClans,
	selectClanMembersMetaEntities,
	selectGrouplMembers,
	useAppSelector
} from '@mezon/store-mobile';
import { ChannelMembersEntity, EUserStatus, UsersClanEntity } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { ApiUser } from 'mezon-js/api.gen';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import InviteToChannel from '../../screens/home/homedrawer/components/InviteToChannel';
import { getUserStatusByMetadata } from '../../utils/helpers';
import { threadDetailContext } from '../ThreadDetail/MenuThreadDetail';
import { UserInformationBottomSheet } from '../UserInformationBottomSheet';
import { MemoizedMemberItem } from './MemberItem';
import style from './style';

enum EActionButton {
	AddMembers = 'Add Members',
	InviteMembers = 'Invite Members'
}

export const getName = (user: UsersClanEntity) =>
	user.clan_nick?.toLowerCase() || user.user?.display_name?.toLowerCase() || user.user?.username?.toLowerCase() || '';

export const MemberListStatus = React.memo(() => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const currentChannel = useContext(threadDetailContext);
	const navigation = useNavigation<any>();
	const membersChannel = useSelector(selectAllUserClans);
	const membersMetaEntities = useSelector(selectClanMembersMetaEntities);
	const membersDM = useAppSelector((state) => selectGrouplMembers(state, currentChannel?.channel_id as string));

	const [selectedUser, setSelectedUser] = useState<ChannelMembersEntity | null>(null);
	const { t } = useTranslation();

	const actionButtons: Record<EActionButton, string> = {
		[EActionButton.AddMembers]: t('common:addMembers'),
		[EActionButton.InviteMembers]: t('common:inviteMembers')
	};

	const myUserId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);

	const isDMThread = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);
	const handleAddOrInviteMembers = useCallback((action: EActionButton) => {
		if (action === EActionButton.InviteMembers) {
			const data = {
				snapPoints: ['70%', '90%'],
				children: <InviteToChannel isUnknownChannel={false} />
			};
			DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
		}
		if (action === EActionButton.AddMembers) navigateToNewGroupScreen();
	}, []);

	const getUserOnlineStatus = (user: ApiUser) => {
		if (user?.id === myUserId) {
			return getUserStatusByMetadata(user?.metadata) !== EUserStatus.INVISIBLE;
		}
		return user?.online;
	};

	const getIsMobileStatus = (user: ApiUser) => (user?.id === myUserId ? true : user?.is_mobile);

	const listMembersChannelGroupDM = useMemo(() => {
		const members = isDMThread ? membersDM : membersChannel;
		if (!membersMetaEntities || !members) {
			return {
				online: [],
				offline: []
			};
		}

		const users = members?.map((item: ChannelMembersEntity | UsersClanEntity) => ({
			...item,
			user: {
				...item.user,
				online: isDMThread
					? getUserOnlineStatus(item?.user)
					: item?.id === myUserId
						? membersMetaEntities[item.id]?.status !== EUserStatus.INVISIBLE
						: membersMetaEntities[item.id]?.status === EUserStatus.INVISIBLE
							? false
							: !!membersMetaEntities[item.id]?.online,
				is_mobile: isDMThread ? getIsMobileStatus(item?.user) : !!membersMetaEntities[item.id]?.isMobile
			}
		})) as UsersClanEntity[];

		users?.sort((a, b) => {
			if (a.user?.online === b.user?.online) {
				return getName(a).localeCompare(getName(b));
			}
			return a.user?.online ? -1 : 1;
		});
		const firstOfflineIndex = users.findIndex((user) => !user?.user?.online);
		const onlineUsers = firstOfflineIndex === -1 ? users : users?.slice(0, firstOfflineIndex);
		const offlineUsers = firstOfflineIndex === -1 ? [] : users?.slice(firstOfflineIndex);

		return {
			online: onlineUsers?.map((item) => item),
			offline: offlineUsers?.map((item) => item)
		};
	}, [isDMThread, membersDM, membersChannel, membersMetaEntities]);

	const userChannels = useAppSelector((state) => selectAllChannelMembers(state, currentChannel?.channel_id));
	const lisMembers = useMemo(() => {
		if (!userChannels || !listMembersChannelGroupDM) {
			return {
				onlineMembers: [],
				offlineMembers: []
			};
		}
		const users = new Map(userChannels.map((item) => [item.id, true]));
		return {
			onlineMembers: listMembersChannelGroupDM?.online?.filter((m) => users.has(m?.id)),
			offlineMembers: listMembersChannelGroupDM?.offline?.filter((m) => users.has(m?.id))
		};
	}, [listMembersChannelGroupDM, userChannels]);

	const { onlineMembers, offlineMembers } = lisMembers;

	const navigateToNewGroupScreen = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.NEW_GROUP,
			params: { directMessage: currentChannel as DirectEntity }
		});
	};

	const onClose = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const handleUserPress = useCallback((user) => {
		setSelectedUser(user);
	}, []);

	const renderMemberItem = ({ item }) => {
		return <MemoizedMemberItem onPress={handleUserPress} user={item} currentChannel={currentChannel} isDMThread={isDMThread} />;
	};

	return (
		<View style={styles.container}>
			{currentChannel?.type === ChannelType.CHANNEL_TYPE_DM ? (
				<TouchableOpacity onPress={() => navigateToNewGroupScreen()} style={styles.actionItem}>
					<View style={[styles.actionIconWrapper]}>
						<MezonIconCDN icon={IconCDN.groupIcon} height={20} width={20} color={baseColor.white} />
					</View>
					<View style={{ flex: 1 }}>
						<Text style={styles.actionTitle}>{t('message:newMessage.newGroup')}</Text>
						<Text style={styles.newGroupContent} numberOfLines={1}>
							{t('message:newMessage.createGroupWith')} {currentChannel?.channel_label}
						</Text>
					</View>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={15} width={15} color={themeValue.text} />
				</TouchableOpacity>
			) : null}

			{currentChannel?.type !== ChannelType.CHANNEL_TYPE_DM ? (
				<Pressable
					onPress={() => {
						handleAddOrInviteMembers(isDMThread ? EActionButton.AddMembers : EActionButton.InviteMembers);
					}}
				>
					<View style={styles.inviteBtn}>
						<View style={styles.iconNameWrapper}>
							<View style={styles.iconWrapper}>
								<MezonIconCDN icon={IconCDN.userPlusIcon} height={20} width={20} color={baseColor.white} />
							</View>
							<Text style={styles.textInvite}>
								{isDMThread ? actionButtons[EActionButton.AddMembers] : actionButtons[EActionButton.InviteMembers]}
							</Text>
						</View>
						<View>
							<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={15} width={15} color={themeValue.text} />
						</View>
					</View>
				</Pressable>
			) : null}

			{onlineMembers?.length > 0 || offlineMembers?.length > 0 ? (
				<SectionList
					sections={[
						{ title: t('common:members'), data: onlineMembers },
						{ title: t('common:offlines'), data: offlineMembers }
					]}
					keyExtractor={(_, index) => `channelMember[${index}]`}
					renderItem={renderMemberItem}
					renderSectionHeader={({ section: { title } }) => (
						<Text style={styles.text}>
							{title} - {title === t('common:members') ? onlineMembers?.length : offlineMembers?.length}
						</Text>
					)}
					contentContainerStyle={{ paddingBottom: size.s_60 }}
					nestedScrollEnabled
					removeClippedSubviews={true}
					showsVerticalScrollIndicator={false}
					stickySectionHeadersEnabled={false}
					initialNumToRender={5}
					maxToRenderPerBatch={5}
					windowSize={5}
				/>
			) : null}
			<UserInformationBottomSheet userId={selectedUser?.user?.id} user={selectedUser} onClose={onClose} currentChannel={currentChannel} />
		</View>
	);
});
