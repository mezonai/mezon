import { AvatarImage, NavLinkComponent } from '@mezon/components';
import { DMMetaEntity, directActions, directMetaActions, selectDirectById, useAppDispatch, useAppSelector } from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { NavLink, useNavigate } from 'react-router-dom';

export type DirectMessUnreadProp = {
	readonly directMessage: Readonly<DMMetaEntity>;
};

function DirectUnread({ directMessage }: DirectMessUnreadProp) {
	const dispatch = useAppDispatch();
	const direct = useAppSelector((state) => selectDirectById(state, directMessage.id)) || {};
	const navigate = useNavigate();
	const handleClick = async () => {
		await dispatch(
			directActions.joinDirectMessage({
				directMessageId: direct.id,
				channelName: '',
				type: direct.type
			})
		);

		navigate(`/chat/direct/message/${direct.channel_id}/${direct.type}`);
		const timestamp = Date.now() / 1000;
		dispatch(directMetaActions.setDirectLastSeenTimestamp({ channelId: direct.id || '', timestamp }));
	};
	return (
		<NavLink to="#" onClick={handleClick}>
			<NavLinkComponent>
				<div>
					<AvatarImage
						alt={direct.usernames || ''}
						userName={direct.usernames}
						className="min-w-12 min-h-12 max-w-12 max-h-12"
						srcImgProxy={
							direct.type === ChannelType.CHANNEL_TYPE_DM
								? createImgproxyUrl(direct?.channel_avatar?.at(0) ?? '', { width: 300, height: 300, resizeType: 'fit' })
								: 'assets/images/avatar-group.png'
						}
						src={direct.type === ChannelType.CHANNEL_TYPE_DM ? direct?.channel_avatar?.at(0) : 'assets/images/avatar-group.png'}
					/>
					{directMessage?.count_mess_unread && (
						<div className="absolute border-[4px] dark:border-bgPrimary border-white w-[24px] h-[24px] rounded-full bg-colorDanger text-[#fff] font-bold text-[11px] flex items-center justify-center top-7 right-[-6px]">
							{directMessage?.count_mess_unread >= 100 ? '99+' : directMessage?.count_mess_unread}
						</div>
					)}
				</div>
			</NavLinkComponent>
		</NavLink>
	);
}

export default DirectUnread;
