import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import { getStore, selectAllChannelMembersClan, selectCurrentUserId, selectMemberByGroupId, useAppSelector } from '@mezon/store-mobile';
import type { ChannelMembersEntity, UsersClanEntity } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, SectionList, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import InviteToChannel from '../../screens/home/homedrawer/components/InviteToChannel';
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
	const rawMembers = useAppSelector((state) => selectMemberByGroupId(state, currentChannel?.channel_id));
	const currentUserId = useSelector(selectCurrentUserId);

	const [selectedUser, setSelectedUser] = useState<ChannelMembersEntity | null>(null);
	const { t } = useTranslation();

	const actionButtons: Record<EActionButton, string> = {
		[EActionButton.AddMembers]: t('common:addMembers'),
		[EActionButton.InviteMembers]: t('common:inviteMembers')
	};

	const isChatWithMyself = useMemo(() => {
		if (Number(currentChannel?.type) !== ChannelType.CHANNEL_TYPE_DM) return false;
		return currentChannel?.user_ids?.[0] === currentUserId;
	}, [currentChannel?.type, currentChannel?.user_ids, currentUserId]);

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

	const listMembersChannelGroupDM = useMemo(() => {
		const store = getStore();
		const members = isDMThread ? rawMembers : selectAllChannelMembersClan(store.getState() as any, currentChannel?.id as string);

		if (!members) {
			return {
				online: [],
				offline: []
			};
		}

		members?.sort((a, b) => {
			if (a.user?.online === b.user?.online) {
				return getName(a).localeCompare(getName(b));
			}
			return a.user?.online ? -1 : 1;
		});
		const firstOfflineIndex = members.findIndex((user) => !user?.user?.online);
		const onlineUsers = firstOfflineIndex === -1 ? members : members?.slice(0, firstOfflineIndex);
		const offlineUsers = firstOfflineIndex === -1 ? [] : members?.slice(firstOfflineIndex);

		return {
			online: onlineUsers?.map((item) => item),
			offline: offlineUsers?.map((item) => item)
		};
	}, [currentChannel?.id, isDMThread, rawMembers]);

	const { online, offline } = listMembersChannelGroupDM;

	const navigateToNewGroupScreen = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.NEW_GROUP,
			params: { directMessageId: currentChannel?.id || currentChannel?.channel_id || '' }
		});
	};

	const onClose = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const handleUserPress = useCallback((user) => {
		setSelectedUser(user);
	}, []);

	const renderMemberItem = useCallback(
		({ item }) => {
			return <MemoizedMemberItem onPress={handleUserPress} user={item} creatorChannelId={currentChannel?.creator_id} isDMThread={isDMThread} />;
		},
		[currentChannel?.creator_id, handleUserPress, isDMThread]
	);

	return (
		<View style={styles.container}>
			{currentChannel?.type === ChannelType.CHANNEL_TYPE_DM && currentChannel?.usernames?.[0] ? (
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

			{(online?.length > 0 || offline?.length > 0) && !isChatWithMyself ? (
				<SectionList
					sections={[
						{ title: t('common:onlines'), data: online, key: 'onlineMembers' },
						{ title: t('common:offlines'), data: offline, key: 'offlineMembers' }
					]}
					keyExtractor={(item, index) => `channelMember[${index}]_${item?.id}`}
					renderItem={renderMemberItem}
					renderSectionHeader={({ section: { title } }) => (
						<Text style={styles.text}>
							{title} - {title === t('common:members') ? online?.length : offline?.length}
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
