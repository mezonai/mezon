import { AvatarImage } from '@mezon/components';
import { useCustomNavigate } from '@mezon/core';
import type { DMMetaEntity } from '@mezon/store';
import { directActions, selectDirectById, useAppDispatch, useAppSelector } from '@mezon/store';
import { createImgproxyUrl, generateE2eId } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';

export type DirectMessUnreadProp = {
	readonly directMessage: Readonly<DMMetaEntity>;
	shouldAnimateOut?: boolean;
	onMemberClick?: () => void;
	isHiding?: boolean;
};

const DirectUnreadComponent = ({ directMessage, shouldAnimateOut = false, onMemberClick, isHiding }: DirectMessUnreadProp) => {
	const dispatch = useAppDispatch();
	const direct = useAppSelector((state) => selectDirectById(state, directMessage.id)) || {};
	const navigate = useCustomNavigate();

	const handleClick = useCallback(
		async (e: React.MouseEvent<HTMLAnchorElement>) => {
			e.preventDefault();
			await dispatch(
				directActions.joinDirectMessage({
					directMessageId: direct.id,
					channelName: '',
					type: direct.type
				})
			);

			navigate(`/chat/direct/message/${direct.channel_id}/${direct.type}`);
			onMemberClick?.();
		},
		[dispatch, direct.id, direct.type, direct.channel_id, navigate, onMemberClick]
	);

	const isMoveOutAnimation = shouldAnimateOut || isHiding;

	const linkClassName = useMemo(
		() => `flex items-end animate-height_logo ${isMoveOutAnimation ? 'animate-move_out_logo ' : ''}`,
		[isMoveOutAnimation]
	);

	const innerDivClassName = useMemo(
		() => `relative animate-scale_up origin-center delay-200 ${isMoveOutAnimation ? '!animate-scale_down !delay-0' : ''}`,
		[isMoveOutAnimation]
	);

	const avatarProps = useMemo(() => {
		const isDM = direct.type === ChannelType.CHANNEL_TYPE_DM;
		const avatarSrc = isDM ? (direct?.avatars?.at(0) ?? '') : direct?.channel_avatar || 'assets/images/avatar-group.png';
		const avatarProxyOptions = { width: 300, height: 300, resizeType: 'fill-down' as const };

		return {
			alt: direct.usernames?.toString() ?? '',
			username: direct.usernames?.toString() ?? '',
			className: 'w-[40px] h-[40px]',
			srcImgProxy: createImgproxyUrl(avatarSrc, avatarProxyOptions),
			src: avatarSrc
		};
	}, [direct.type, direct?.avatars, direct?.channel_avatar, direct.usernames]);

	const badgeClassName = useMemo(
		() =>
			`flex items-center text-center justify-center text-[12px] font-bold rounded-full bg-colorDanger absolute bottom-[-1px] right-[-2px] ${
				(directMessage?.count_mess_unread || 0) >= 10 ? 'w-[22px] h-[16px]' : 'w-[16px] h-[16px]'
			}`,
		[directMessage?.count_mess_unread]
	);

	const badgeContent = useMemo(() => {
		if (!directMessage?.count_mess_unread) return null;
		return directMessage.count_mess_unread >= 100 ? '99+' : directMessage.count_mess_unread;
	}, [directMessage?.count_mess_unread]);

	return (
		<NavLink to="#" onClick={handleClick} draggable="false" className={linkClassName}>
			<div className={innerDivClassName} data-e2e={generateE2eId('chat.direct_message.side_bar.item', direct.id)}>
				<AvatarImage draggable="false" {...avatarProps} />
				{badgeContent && <div className={badgeClassName}>{badgeContent}</div>}
			</div>
		</NavLink>
	);
};

const arePropsEqual = (prevProps: DirectMessUnreadProp, nextProps: DirectMessUnreadProp) => {
	return (
		prevProps.directMessage.id === nextProps.directMessage.id &&
		prevProps.directMessage.count_mess_unread === nextProps.directMessage.count_mess_unread &&
		prevProps.shouldAnimateOut === nextProps.shouldAnimateOut &&
		prevProps.isHiding === nextProps.isHiding &&
		prevProps.onMemberClick === nextProps.onMemberClick
	);
};

const DirectUnread = memo(DirectUnreadComponent, arePropsEqual);
DirectUnread.displayName = 'DirectUnread';

export default DirectUnread;
