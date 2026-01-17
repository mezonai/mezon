import { useDirect } from '@mezon/core';
import type { IEmbedProps } from '@mezon/utils';
import { createImgproxyUrl } from '@mezon/utils';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AvatarImage } from '../AvatarImage/AvatarImage';

interface ShareContactCardProps {
	embed: IEmbedProps;
}

const ShareContactCard = ({ embed }: ShareContactCardProps) => {
	const { t } = useTranslation('shareContact');
	const { createDirectMessageWithUser } = useDirect();

	const fields = embed.fields || [];
	const getFieldValue = (name: string) => fields.find((f) => f.name === name)?.value || '';

	const userId = getFieldValue('user_id');
	const username = getFieldValue('username');
	const displayName = getFieldValue('display_name');
	const avatar = getFieldValue('avatar');

	const handleMessage = useCallback(async () => {
		if (!userId) return;
		await createDirectMessageWithUser(userId, displayName || username, username, avatar);
	}, [userId, displayName, username, avatar, createDirectMessageWithUser]);

	if (!userId) return null;

	return (
		<div className="w-[280px] rounded-lg overflow-hidden shadow-lg mt-2 border border-theme-primary">
			<div className="bg-theme-primary p-3 ">
				<div className="flex items-center gap-3">
					<AvatarImage
						alt={displayName || username}
						username={username}
						className="w-12 h-12 rounded-full border-2 border-white/30"
						srcImgProxy={createImgproxyUrl(avatar ?? '')}
						src={avatar}
					/>
					<div className="flex-1 min-w-0">
						<p className="text-theme-primary-active font-semibold text-base truncate">{displayName || username}</p>
						<p className="text-theme-primary  text-sm truncate">@{username}</p>
					</div>
				</div>
			</div>

			<div className="bg-theme-primary flex border-t border-theme-primary">
				<button onClick={handleMessage} className="flex-1 py-3 text-theme-primary text-sm font-medium hover:bg-white/10 transition-colors">
					{t('card.message')}
				</button>
			</div>
		</div>
	);
};

export default ShareContactCard;
