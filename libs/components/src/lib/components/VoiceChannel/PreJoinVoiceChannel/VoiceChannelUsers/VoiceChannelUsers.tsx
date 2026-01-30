import { selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { createImgproxyUrl, getAvatarForPrioritize, useSyncEffect, useWindowSize } from '@mezon/utils';
import { useCallback, useState } from 'react';
import { AvatarImage } from '../../../AvatarImage/AvatarImage';

export type VoiceChannelUsersProps = {
	voiceChannelMembers: string[];
};

export function VoiceChannelUsers({ voiceChannelMembers }: VoiceChannelUsersProps) {
	const [displayedMembers, setDisplayedMembers] = useState<string[]>([]);
	const [remainingCount, setRemainingCount] = useState(0);

	const handleSizeWidth = useCallback(() => {
		const membersToShow = [...voiceChannelMembers];
		let maxMembers = 3;

		if (window.innerWidth < 1000) {
			maxMembers = 2;
		} else if (window.innerWidth < 1200) {
			maxMembers = 3;
		} else if (window.innerWidth < 1300) {
			maxMembers = 4;
		} else if (window.innerWidth < 1400) {
			maxMembers = 5;
		} else if (window.innerWidth < 1700) {
			maxMembers = 6;
		}

		const extraMembers = membersToShow.length - maxMembers;

		setDisplayedMembers(membersToShow.slice(0, maxMembers));
		setRemainingCount(extraMembers > 0 ? extraMembers : 0);
	}, [voiceChannelMembers]);

	useSyncEffect(() => {
		handleSizeWidth();
	}, [voiceChannelMembers]);

	useWindowSize(() => {
		handleSizeWidth();
	});

	return (
		<div className="flex items-center gap-2">
			{displayedMembers.map((id) => (
				<div key={id} className="flex items-center">
					<VoiceUserItem userId={id || ''} />
				</div>
			))}
			{remainingCount > 0 && (
				<div className="w-14 h-14 rounded-full  bg-item-theme text-theme-primary-active font-medium flex items-center justify-center">
					+{remainingCount}
				</div>
			)}
		</div>
	);
}

export function VoiceUserItem({ userId }: { userId: string }) {
	const userVoice = useAppSelector((state) => selectMemberClanByUserId(state, userId));
	const username = userVoice?.user?.username;
	const avatar = getAvatarForPrioritize(userVoice?.clan_avatar, userVoice?.user?.avatar_url);
	const avatarUrl = createImgproxyUrl(avatar ?? '', {
		width: 300,
		height: 300,
		resizeType: 'fit'
	});

	return (
		<div className="size-14 rounded-full">
			{userVoice ? (
				<AvatarImage alt={username || ''} username={username} className="size-14" srcImgProxy={avatarUrl} src={avatar} />
			) : (
				<Icons.AvatarUser />
			)}
		</div>
	);
}
