import { useMemberStatus } from '@mezon/core';
import { STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { ChannelMembersEntity, DirectEntity, selectCurrentClan } from '@mezon/store-mobile';
import { IChannel, UsersClanEntity } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { MemberProfile } from '../MemberProfile';

interface IProps {
	user: ChannelMembersEntity;
	listProfile?: boolean;
	isOffline?: boolean;
	onPress?: (user: ChannelMembersEntity) => void;
	currentChannel?: IChannel | DirectEntity;
	isDMThread?: boolean;
	isMobile?: boolean;
	isHiddenStatus?: boolean;
}

type MemberItemProps = {
	user: ChannelMembersEntity | UsersClanEntity;
	isDMThread?: boolean;
	onPress?: (user: ChannelMembersEntity) => void;
	currentChannel?: IChannel | DirectEntity;
	isMobile?: boolean;
};

export const MemoizedMemberItem = memo((props: MemberItemProps) => {
	const { user, ...rest } = props;

	return <MemberItem {...rest} user={user} listProfile={true} isOffline={!user?.user?.online} isMobile={user?.user?.is_mobile} />;
});

export const MemberItem = memo(({ user, isOffline, onPress, currentChannel, isDMThread, isMobile, isHiddenStatus = false }: IProps) => {
	const userStatus = useMemberStatus(user?.id || '');

	const currentClan = useSelector(selectCurrentClan);
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);

	const isMe = useMemo(() => {
		return user?.user?.id === userId;
	}, [user?.user?.id, userId]);

	const defaultStatus = { status: false, isMobile: false };
	return (
		<Pressable
			onPress={() => {
				onPress(user);
			}}
		>
			<MemberProfile
				user={user}
				userStatus={isHiddenStatus ? defaultStatus : { status: isMe ? true : !isOffline, isMobile }}
				numCharCollapse={30}
				isHideIconStatus={userStatus ? false : true}
				isOffline={isMe ? false : isOffline}
				nickName={user?.clan_nick}
				creatorClanId={currentClan?.creator_id}
				creatorDMId={currentChannel?.creator_id}
				isDMThread={isDMThread}
			/>
		</Pressable>
	);
});
