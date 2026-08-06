import { EInvoice, selectMemberClanByUserId, selectStatusInVoice, useAppSelector } from '@mezon/store';
import { Icons, NameComponent } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { memo } from 'react';
import { AvatarImage } from '../../components';

function UserListItem({ id, user_name, user_avatar }: { id: string; user_name: string; user_avatar: string }) {
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, id ?? ''));
	const name = getNameForPrioritize(userStream?.clan_nick || user_name, userStream?.user?.display_name, userStream?.user?.username);
	const avatar = getAvatarForPrioritize(userStream?.clan_avatar || user_avatar, userStream?.user?.avatar_url);
	const invoiceStatus = useAppSelector((state) => selectStatusInVoice(state, id));
	return (
		<div
			className={`bg-item-hover text-theme-primary-hover w-[90%] flex justify-between p-1 pr-2 rounded-lg ml-[18px] items-center gap-3 cursor-pointer`}
			data-e2e={generateE2eId('clan_page.channel_list.item.user_list.item')}
		>
			<div className="flex items-center gap-2">
				<div className="w-5 h-5">
					{avatar ? (
						<AvatarImage
							alt={avatar || ''}
							username={avatar}
							className="min-w-5 min-h-5 max-w-5 max-h-5"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
					) : (
						<Icons.AvatarUser />
					)}
				</div>
				<div>{name ? <NameComponent id={id || ''} name={name || ''} /> : null}</div>
			</div>
			{invoiceStatus?.status === EInvoice.SHARING_SCREEN ? (
				<Icons.VoiceScreenShareIcon
					color="#22c55e"
					className="w-4 h-4"
					data-e2e={generateE2eId('clan_page.channel_list.item.user_list.item.screen_share')}
				/>
			) : null}
		</div>
	);
}

export default memo(UserListItem, (prevProps, nextProps) => prevProps.id === nextProps.id);
