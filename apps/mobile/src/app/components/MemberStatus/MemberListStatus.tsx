import { ActionEmitEvent } from '@mezon/mobile-components';
import { baseColor, size, useTheme } from '@mezon/mobile-ui';
import type { DirectEntity } from '@mezon/store-mobile';
import { selectAllChannelMembersClan, selectMemberByGroupId, selectStatusEntities, useAppSelector } from '@mezon/store-mobile';
import type { ChannelMembersEntity, IChannel, UsersClanEntity } from '@mezon/utils';
import { EUserStatus, GROUP_CHAT_MAXIMUM_MEMBERS } from '@mezon/utils';
import { useNavigation } from '@react-navigation/native';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeviceEventEmitter, Pressable, SectionList, Text, TouchableOpacity, View } from 'react-native';
import MezonIconCDN from '../../componentUI/MezonIconCDN';
import { IconCDN } from '../../constants/icon_cdn';
import { APP_SCREEN } from '../../navigation/ScreenTypes';
import InviteToChannel from '../../screens/home/homedrawer/components/InviteToChannel';
import { UserInformationBottomSheet } from '../UserInformationBottomSheet';
import { MemoizedMemberItem } from './MemberItem';
import style from './style';

interface IMemberListStatusProps {
	currentChannel: IChannel | DirectEntity;
	currentUserId: string;
}

enum EActionButton {
	AddMembers = 'Add Members',
	InviteMembers = 'Invite Members'
}

export const getName = (user: UsersClanEntity) =>
	user.clanNick?.toLowerCase() || user.user?.displayName?.toLowerCase() || user.user?.username?.toLowerCase() || '';

export const MemberListStatus = memo(({ currentChannel, currentUserId }: IMemberListStatusProps) => {
	const { themeValue } = useTheme();
	const styles = style(themeValue);
	const navigation = useNavigation<any>();
	const groupMembers = useAppSelector((state) => selectMemberByGroupId(state, currentChannel?.channelId));
	const channelMembers = useAppSelector((state) => selectAllChannelMembersClan(state, currentChannel?.channelId));
	const statusEntities = useAppSelector(selectStatusEntities);

	const [selectedUser, setSelectedUser] = useState<ChannelMembersEntity | null>(null);
	const { t } = useTranslation();

	const actionButtons: Record<EActionButton, string> = {
		[EActionButton.AddMembers]: t('common:addMembers'),
		[EActionButton.InviteMembers]: t('common:inviteMembers')
	};

	const isChatWithMyself = useMemo(() => {
		if (Number(currentChannel?.type) !== ChannelType.CHANNEL_TYPE_DM) return false;
		return currentChannel?.userIds?.[0] === currentUserId;
	}, [currentChannel?.type, currentChannel?.userIds, currentUserId]);

	const isDM = useMemo(() => {
		return [ChannelType.CHANNEL_TYPE_DM, ChannelType.CHANNEL_TYPE_GROUP].includes(currentChannel?.type);
	}, [currentChannel]);

	const isMaximumMembers = useMemo(() => {
		return isDM && groupMembers?.length >= GROUP_CHAT_MAXIMUM_MEMBERS;
	}, [isDM, groupMembers]);

	const handleAddOrInviteMembers = useCallback(
		(action: EActionButton) => {
			if (action === EActionButton.InviteMembers) {
				const data = {
					snapPoints: ['70%', '90%'],
					children: <InviteToChannel isUnknownChannel={false} />
				};
				DeviceEventEmitter.emit(ActionEmitEvent.ON_TRIGGER_BOTTOM_SHEET, { isDismiss: false, data });
			}
			if (action === EActionButton.AddMembers && !isMaximumMembers) navigateToNewGroupScreen();
		},
		[isMaximumMembers]
	);

	const membersByStatus = useMemo(() => {
		const members = isDM ? groupMembers : channelMembers;

		if (!members) {
			return {
				online: [],
				offline: []
			};
		}

		const combinedMembers = members.map((member: ChannelMembersEntity) => ({
			...member,
			user: {
				...member?.user,
				online: !!statusEntities?.[member?.id]?.online,
				status: statusEntities?.[member?.id]?.status
			}
		}));

		combinedMembers.sort((a, b) => {
			const aOnline = !!a?.user?.online && a?.user?.status !== EUserStatus.INVISIBLE;
			const bOnline = !!b?.user?.online && b?.user?.status !== EUserStatus.INVISIBLE;

			if (aOnline === bOnline) {
				const nameA = getName(a as UsersClanEntity);
				const nameB = getName(b as UsersClanEntity);
				return nameA.localeCompare(nameB);
			}

			return aOnline ? -1 : 1;
		});
		const firstOfflineIndex = combinedMembers.findIndex((user) => !user?.user?.online || user?.user?.status === EUserStatus.INVISIBLE);

		return {
			online: firstOfflineIndex === -1 ? combinedMembers : combinedMembers.slice(0, firstOfflineIndex),
			offline: firstOfflineIndex === -1 ? [] : combinedMembers.slice(firstOfflineIndex)
		};
	}, [isDM, groupMembers, channelMembers, statusEntities]);

	const shouldShowNewGroupButton = useMemo(() => {
		return (
			currentChannel?.type === ChannelType.CHANNEL_TYPE_DM && currentChannel?.usernames?.[0] && currentChannel?.userIds?.[0] !== currentUserId
		);
	}, [currentChannel?.type, currentChannel?.userIds?.[0], currentChannel?.usernames?.[0], currentUserId]);

	const { online, offline } = membersByStatus;

	const shouldShowMemberList = useMemo(() => {
		return (online?.length > 0 || offline?.length > 0) && !isChatWithMyself;
	}, [online.length, offline.length, isChatWithMyself]);

	const navigateToNewGroupScreen = () => {
		navigation.navigate(APP_SCREEN.MESSAGES.STACK, {
			screen: APP_SCREEN.MESSAGES.NEW_GROUP,
			params: { directMessageId: currentChannel?.id || currentChannel?.channelId || '', fromUser: true }
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
			return <MemoizedMemberItem onPress={handleUserPress} user={item} isDM={isDM} currentChannel={currentChannel} />;
		},
		[currentChannel, handleUserPress, isDM]
	);

	return (
		<View style={styles.container}>
			{shouldShowNewGroupButton ? (
				<TouchableOpacity onPress={() => navigateToNewGroupScreen()} style={styles.actionItem}>
					<View style={[styles.actionIconWrapper]}>
						<MezonIconCDN icon={IconCDN.groupIcon} height={size.s_16} width={size.s_16} color={baseColor.white} />
					</View>
					<View style={{ flex: 1 }}>
						<Text style={styles.actionTitle}>{t('message:newMessage.newGroup')}</Text>
						<Text style={styles.newGroupContent} numberOfLines={1}>
							{t('message:newMessage.createGroupWith')} {currentChannel?.channelLabel}
						</Text>
					</View>
					<MezonIconCDN icon={IconCDN.chevronSmallRightIcon} height={size.s_12} width={size.s_12} color={themeValue.text} />
				</TouchableOpacity>
			) : null}

			{currentChannel?.type !== ChannelType.CHANNEL_TYPE_DM ? (
				<Pressable
					onPress={() => {
						handleAddOrInviteMembers(isDM ? EActionButton.AddMembers : EActionButton.InviteMembers);
					}}
				>
					<View style={styles.inviteBtn}>
						<View style={styles.iconNameWrapper}>
							<View style={[styles.iconWrapper, isMaximumMembers && styles.iconWrapperDisabled]}>
								<MezonIconCDN icon={IconCDN.userPlusIcon} height={size.s_16} width={size.s_16} color={baseColor.white} />
							</View>
							<Text style={isMaximumMembers ? styles.textInviteDisabled : styles.textInvite}>
								{isDM ? actionButtons[EActionButton.AddMembers] : actionButtons[EActionButton.InviteMembers]}
							</Text>
						</View>

						<MezonIconCDN
							icon={IconCDN.chevronSmallRightIcon}
							height={size.s_12}
							width={size.s_12}
							color={isMaximumMembers ? themeValue.textDisabled : themeValue.text}
						/>
					</View>
				</Pressable>
			) : null}

			{shouldShowMemberList ? (
				<SectionList
					sections={
						isDM
							? [{ title: t('common:members'), data: [...(online ?? []), ...(offline ?? [])], key: 'onlineMembers' }]
							: [
									{ title: t('common:onlines'), data: online, key: 'onlineMembers' },
									{ title: t('common:offlines'), data: offline, key: 'offlineMembers' }
								]
					}
					keyExtractor={(item, index) => `channelMember[${index}]_${item?.id}`}
					renderItem={renderMemberItem}
					renderSectionHeader={({ section: { title } }) => {
						return (
							<Text style={styles.text}>
								{`${title} - ${
									isDM
										? (online?.length ?? 0) + (offline?.length ?? 0)
										: title === t('common:onlines')
											? online?.length
											: offline?.length
								}`}
							</Text>
						);
					}}
					contentContainerStyle={styles.contentContainerStyle}
					nestedScrollEnabled
					removeClippedSubviews
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
