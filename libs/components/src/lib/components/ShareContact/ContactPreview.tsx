import { createImgproxyUrl } from '@mezon/utils';
import { AvatarImage } from '../AvatarImage/AvatarImage';

type ContactPreviewProps = {
	displayName: string;
	username: string;
	avatar: string;
	t: (key: string) => string;
};

export const ContactPreview = ({ displayName, username, avatar, t }: ContactPreviewProps) => {
	return (
		<div className="px-4">
			<div className="mb-2">
				<label className="text-xs uppercase font-semibold text-theme-primary">{t('modal.contactPreview')}</label>
			</div>
			<div className="bg-item-theme p-3 flex items-center gap-3 border-l-4 border-[#5865F2]">
				<AvatarImage
					alt={displayName}
					username={username}
					className="min-w-10 min-h-10 max-w-10 max-h-10 rounded-full"
					srcImgProxy={createImgproxyUrl(avatar ?? '')}
					src={avatar}
				/>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-theme-primary truncate">{displayName}</p>
					<p className="text-xs text-theme-secondary truncate">@{username}</p>
				</div>
			</div>
		</div>
	);
};
