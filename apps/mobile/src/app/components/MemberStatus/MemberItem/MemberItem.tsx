import { useMemberStatus } from '@mezon/core';
import { STORAGE_MY_USER_ID, load } from '@mezon/mobile-components';
import { ChannelMembersEntity, DirectEntity, selectCurrentClan, selectUserClanProfileByClanID } from '@mezon/store-mobile';
import { IChannel, UsersClanEntity } from '@mezon/utils';
import { memo, useMemo } from 'react';
import { TouchableOpacity } from 'react-native-gesture-handler';
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

export function MemberItem({ user, isOffline, onPress, currentChannel, isDMThread, isMobile }: IProps) {
	const userStatus = useMemberStatus(user?.id || '');

	const currentClan = useSelector(selectCurrentClan);
	const clanProfile = useSelector(selectUserClanProfileByClanID(currentClan?.clan_id as string, user?.user?.id as string));
	const userId = useMemo(() => {
		return load(STORAGE_MY_USER_ID);
	}, []);
	const isMe = useMemo(() => {
		return user?.user?.id === userId;
	}, [user?.user?.id, userId]);
	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() => {
				onPress(user);
			}}
		>
			<MemberProfile
				user={user}
				userStatus={{ status: isMe ? true : !isOffline, isMobile }}
				numCharCollapse={30}
				isHideIconStatus={userStatus ? false : true}
				isOffline={isMe ? false : isOffline}
				nickName={clanProfile?.nick_name}
				creatorClanId={currentClan?.creator_id}
				creatorDMId={currentChannel?.creator_id}
				isDMThread={isDMThread}
			/>
		</TouchableOpacity>
	);
}
