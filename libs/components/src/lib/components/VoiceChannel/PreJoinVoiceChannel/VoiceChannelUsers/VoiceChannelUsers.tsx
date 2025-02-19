import { useWindowSize } from '@mezon/core';
import { selectMemberClanByGoogleId, selectMemberClanByUserId2, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { IChannelMember, createImgproxyUrl, getAvatarForPrioritize } from '@mezon/utils';
import { useCallback, useState } from 'react';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';

export type VoiceChannelUsersProps = {
	readonly memberJoin: IChannelMember[];
	readonly memberMax?: number;
	readonly isShowChat?: boolean;
};

export function VoiceChannelUsers({ memberJoin = [], memberMax, isShowChat }: VoiceChannelUsersProps) {
	const [displayedMembers, setDisplayedMembers] = useState<IChannelMember[]>(memberJoin);
	const [remainingCount, setRemainingCount] = useState(0);

	const handleSizeWidth = useCallback(() => {
		const membersToShow = [...memberJoin];
		let maxMembers = memberMax ?? 7;

		if (window.innerWidth < 1000) {
			maxMembers = isShowChat ? 1 : 2;
		} else if (window.innerWidth < 1200) {
			maxMembers = isShowChat ? 2 : 3;
		} else if (window.innerWidth < 1300) {
			maxMembers = isShowChat ? 3 : 4;
		} else if (window.innerWidth < 1400) {
			maxMembers = isShowChat ? 4 : 5;
		} else if (window.innerWidth < 1700) {
			maxMembers = isShowChat ? 5 : 6;
		}

		const extraMembers = membersToShow.length - maxMembers;

		setDisplayedMembers(membersToShow.slice(0, maxMembers));
		setRemainingCount(extraMembers > 0 ? extraMembers : 0);
	}, [memberJoin, memberMax, isShowChat]);

	useWindowSize(() => {
		handleSizeWidth();
	});

	return (
		<div className="flex items-center gap-2">
			{displayedMembers.map((item: IChannelMember) => (
				<div key={item.id} className="flex items-center">
					<UserItem user={item} />
				</div>
			))}
			{remainingCount > 0 && (
				<div className="w-14 h-14 rounded-full bg-gray-300 text-black font-medium flex items-center justify-center">+{remainingCount}</div>
			)}
		</div>
	);
}

function UserItem({ user }: { user: IChannelMember }) {
	const userId = user.user_id ?? '';
	const member = useAppSelector((state) => selectMemberClanByGoogleId(state, userId));
	const userStream = useAppSelector((state) => selectMemberClanByUserId2(state, userId));

	const data = member || userStream;
	const username = data?.user?.username;
	const avatar = getAvatarForPrioritize(data?.clan_avatar, data?.user?.avatar_url);
	const avatarUrl = createImgproxyUrl(avatar ?? '', {
		width: 300,
		height: 300,
		resizeType: 'fit'
	});

	return (
		<div className="size-14 rounded-full">
			{data ? (
				<AvatarImage alt={username || ''} username={username} className="size-14" srcImgProxy={avatarUrl} src={avatar} />
			) : (
				<Icons.AvatarUser />
			)}
		</div>
	);
}
