import { getShowName, useColorsRoleById } from '@mezon/core';
import type { IMessageWithUser } from '@mezon/utils';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, convertTimeStringI18n, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useTranslation } from 'react-i18next';
import getPendingNames from './usePendingNames';

type IMessageHeadProps = {
	message: IMessageWithUser;
	mode?: number;
	onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
	isDM?: boolean;
};

const BaseMessageHead = ({
	message,
	mode,
	onClick,
	isDM,
	userRolesClan
}: IMessageHeadProps & { userRolesClan?: ReturnType<typeof useColorsRoleById> }) => {
	const { t, i18n } = useTranslation('common');
	const messageTime = convertTimeStringI18n(message?.create_time_seconds || 0, t, i18n.language);
	const usernameSender = message?.username;
	const clanNick = message?.clan_nick;
	const displayName = message?.display_name;

	const { pendingClannick, pendingDisplayName, pendingUserName } = getPendingNames(
		message,
		clanNick ?? '',
		displayName ?? '',
		usernameSender ?? '',
		message.clan_nick ?? '',
		message?.display_name ?? '',
		message?.username ?? ''
	);

	const nameShowed = getShowName(
		clanNick ? clanNick : (pendingClannick ?? ''),
		displayName ? displayName : (pendingDisplayName ?? ''),
		usernameSender ? usernameSender : (pendingUserName ?? ''),
		message?.sender_id ?? ''
	);

	const priorityName = message.display_name ? message.display_name : message.username;

	return (
		<>
			<div
				className="text-base font-medium tracking-normal cursor-pointer break-all username text-theme-primary-active hover:underline flex items-center"
				onClick={onClick}
				role="button"
				style={{
					letterSpacing: '-0.01rem',
					color:
						mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD
							? (userRolesClan?.highestPermissionRoleColor ?? DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR)
							: DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR
				}}
				data-e2e={generateE2eId('base_profile.display_name')}
			>
				{mode === ChannelStreamMode.STREAM_MODE_CHANNEL || mode === ChannelStreamMode.STREAM_MODE_THREAD ? nameShowed : priorityName}
				{userRolesClan?.highestPermissionRoleIcon &&
					mode !== ChannelStreamMode.STREAM_MODE_DM &&
					mode !== ChannelStreamMode.STREAM_MODE_GROUP && (
						<img loading="lazy" src={userRolesClan.highestPermissionRoleIcon} alt="" className="'w-5 h-5 ml-1" />
					)}
			</div>
			<div className="pl-1 pt-[5px] text-theme-primary text-[12px] font-medium">{messageTime}</div>
		</>
	);
};

export const DMMessageHead = (props: Omit<IMessageHeadProps, 'isDM'>) => {
	return <BaseMessageHead {...props} isDM={true} />;
};

export const ClanMessageHead = (props: Omit<IMessageHeadProps, 'isDM'>) => {
	const userRolesClan = useColorsRoleById(props.message?.sender_id);
	return <BaseMessageHead {...props} isDM={false} userRolesClan={userRolesClan} />;
};

const MessageHead = (props: IMessageHeadProps) => {
	if (props.isDM || props.mode === ChannelStreamMode.STREAM_MODE_DM || props.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
		return <DMMessageHead {...props} />;
	}
	return <ClanMessageHead {...props} />;
};

export default MessageHead;
