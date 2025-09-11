import { AvatarImage } from '@mezon/components';
import { useCustomNavigate } from '@mezon/core';
import type { DMMetaEntity } from '@mezon/store';
import { directActions, directMetaActions, selectDirectById, useAppDispatch, useAppSelector } from '@mezon/store';
import { createImgproxyUrl } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';

export type DirectMessUnreadProp = {
	readonly directMessage: Readonly<DMMetaEntity>;
	checkMoveOut: string[];
	onMemberClick?: () => void;
	isHiding?: boolean;
};

function DirectUnread({ directMessage, checkMoveOut, onMemberClick, isHiding }: DirectMessUnreadProp) {
	const dispatch = useAppDispatch();
	const direct = useAppSelector((state) => selectDirectById(state, directMessage.id)) || {};
	const navigate = useCustomNavigate();
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

		onMemberClick?.();
	};

	const isMoveOutAnimation = useMemo(() => {
		return !checkMoveOut.includes(directMessage.id) || isHiding;
	}, [checkMoveOut, directMessage.id, isHiding]);

	return (
		<NavLink
			to="#"
			onClick={handleClick}
			draggable="false"
			className={`flex items-end animate-height_logo ${isMoveOutAnimation ? 'animate-move_out_logo ' : ''}`}
		>
			<div className={`relative animate-scale_up origin-center delay-200 ${isMoveOutAnimation ? '!animate-scale_down !delay-0' : ''}`}>
				<AvatarImage
					draggable="false"
					alt={direct.usernames?.toString() ?? ''}
					username={direct.usernames?.toString() ?? ''}
					className="w-[40px] h-[40px]"
					srcImgProxy={
						direct.type === ChannelType.CHANNEL_TYPE_DM
							? createImgproxyUrl(direct?.channel_avatar?.at(0) ?? '', { width: 300, height: 300, resizeType: 'fill-down' })
							: createImgproxyUrl(direct?.topic ?? 'assets/images/avatar-group.png', {
									width: 300,
									height: 300,
									resizeType: 'fill-down'
								})
					}
					src={
						direct.type === ChannelType.CHANNEL_TYPE_DM
							? direct?.channel_avatar?.at(0)
							: (direct?.topic ?? 'assets/images/avatar-group.png')
					}
				/>
				{directMessage?.count_mess_unread && (
					<div
						className={`flex items-center text-center justify-center text-[12px] font-bold rounded-full bg-colorDanger absolute bottom-[-1px] right-[-2px] ${
							directMessage?.count_mess_unread >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'
						}`}
					>
						{directMessage?.count_mess_unread >= 100 ? '99+' : directMessage?.count_mess_unread}
					</div>
				)}
			</div>
		</NavLink>
	);
}

export default DirectUnread;
