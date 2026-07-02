import { EInvoice, selectMemberClanByUserId, selectStatusInVoice, useAppSelector } from '@mezon/store';
import { Icons, NameComponent } from '@mezon/ui';
import { createImgproxyUrl, generateE2eId, getAvatarForPrioritize, getNameForPrioritize } from '@mezon/utils';
import { AvatarImage } from '../../components';

function UserListItem({ id }: { id: string }) {
	const userStream = useAppSelector((state) => selectMemberClanByUserId(state, id ?? ''));
	const name = getNameForPrioritize(userStream?.clan_nick, userStream?.user?.display_name, userStream?.user?.username);
	const avatar = getAvatarForPrioritize(userStream?.clan_avatar, userStream?.user?.avatar_url);
	const invoiceStatus = useAppSelector((state) => selectStatusInVoice(state, id));
	return (
		<div
			className={`bg-item-hover text-theme-primary-hover w-[90%] flex justify-between p-1 pr-2 rounded-lg ml-[18px] items-center gap-3 cursor-pointer`}
			data-e2e={generateE2eId('clan_page.channel_list.item.user_list.item')}
		>
			<div className="flex items-center gap-2">
				<div className="w-5 h-5">
					{userStream ? (
						<AvatarImage
							alt={userStream?.user?.username || ''}
							username={userStream?.user?.username}
							className="min-w-5 min-h-5 max-w-5 max-h-5"
							srcImgProxy={createImgproxyUrl(avatar ?? '')}
							src={avatar}
						/>
					) : (
						<Icons.AvatarUser />
					)}
				</div>
				<div>{userStream ? <NameComponent id={userStream.id || ''} name={name || ''} /> : null}</div>
			</div>
			{invoiceStatus.status === EInvoice.SHARING_SCREEN ? <Icons.VoiceScreenShareIcon color="#22c55e" className="w-4 h-4" /> : null}
		</div>
	);
}

export default UserListItem;
