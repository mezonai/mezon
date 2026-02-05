import { getShowName, useColorsRoleById } from '@mezon/core';
import { selectMemberClanByUserId, useAppSelector } from '@mezon/store';
import type { IMessageWithUser } from '@mezon/utils';
import { DEFAULT_MESSAGE_CREATOR_NAME_DISPLAY_COLOR, convertTimeStringI18n, convertUnixSecondsToTimeString, generateE2eId } from '@mezon/utils';
import { ChannelStreamMode } from 'mezon-js';
import { useTranslation } from 'react-i18next';
import getPendingNames from './usePendingNames';

type IMessageHeadProps = {
	message: IMessageWithUser;
	mode?: number;
	onClick?: (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => void;
	isDM?: boolean;
	isSearchMessage?: boolean;
};

const BaseMessageHead = ({
	message,
	mode,
	onClick,
	isDM,
	userRolesClan,
	clanNickFromStore
}: IMessageHeadProps & { userRolesClan?: ReturnType<typeof useColorsRoleById>; clanNickFromStore?: string }) => {
	const { t, i18n } = useTranslation('common');
	const messageTime = message?.create_time_seconds
		? convertUnixSecondsToTimeString(message.create_time_seconds, t, i18n.language)
		: convertTimeStringI18n((message as any)?.create_time || '', t, i18n.language);
	const usernameSender = message?.username;
	const clanNick = message?.clan_nick || clanNickFromStore || '';
	const displayName = message?.display_name;

	const { pendingClannick, pendingDisplayName, pendingUserName } = getPendingNames(
		message,
		clanNick ?? '',
		displayName ?? '',
		usernameSender ?? '',
		clanNick ?? '',
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
				className={`text-base font-medium tracking-normal break-all username text-theme-primary-active flex items-center ${onClick ? 'cursor-pointer hover:underline' : ''}`}
				onClick={onClick}
				role={onClick ? 'button' : undefined}
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

export const DMMessageHead = (props: Omit<IMessageHeadProps, 'isDM' | 'isSearchMessage'>) => {
	return <BaseMessageHead {...props} isDM={true} />;
};

export const ClanMessageHead = (props: Omit<IMessageHeadProps, 'isDM' | 'isSearchMessage'>) => {
	const userRolesClan = useColorsRoleById(props.message?.sender_id);
	return <BaseMessageHead {...props} isDM={false} userRolesClan={userRolesClan} />;
};

export const SearchClanMessageHead = (props: Omit<IMessageHeadProps, 'isDM' | 'isSearchMessage'>) => {
	const userRolesClan = useColorsRoleById(props.message?.sender_id);
	const userClan = useAppSelector((state) => selectMemberClanByUserId(state, props.message?.sender_id || ''));
	const clanNickFromStore = userClan?.clan_nick;
	return <BaseMessageHead {...props} isDM={false} userRolesClan={userRolesClan} clanNickFromStore={clanNickFromStore} />;
};

const MessageHead = (props: IMessageHeadProps) => {
	const { isSearchMessage, ...headProps } = props;

	if (headProps.isDM || headProps.mode === ChannelStreamMode.STREAM_MODE_DM || headProps.mode === ChannelStreamMode.STREAM_MODE_GROUP) {
		return <DMMessageHead {...headProps} />;
	}

	if (isSearchMessage) {
		return <SearchClanMessageHead {...headProps} />;
	}

	return <ClanMessageHead {...headProps} />;
};

export default MessageHead;
