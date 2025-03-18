import { selectCurrentChannelId, selectDmGroupCurrentId, selectIsUserTypingInChannel, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserStatus } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import { directMessageValueProps } from '../DmList/DMListItem';
import { UserStatusIcon } from '../MemberProfile';

type StatusUserProps = {
	status?: { status?: boolean; isMobile?: boolean };
	isMemberDMGroup: boolean;
	isMemberChannel: boolean;
	isListDm: boolean;
	directMessageValue?: directMessageValueProps;
	userId?: string;
	isTyping?: boolean;
	sizeStatusIcon?: string;
	customStatus?: EUserStatus;
};

const StatusUser = memo((props: StatusUserProps) => {
	const {
		customStatus,
		status,
		isMemberChannel,
		isMemberDMGroup,
		isListDm,
		directMessageValue,
		userId = '',
		isTyping = true,
		sizeStatusIcon
	} = props;
	const currentDMChannelID = useSelector(selectDmGroupCurrentId);
	const currentChannelID = useSelector(selectCurrentChannelId);
	const isTypingInDM = useAppSelector((state) => selectIsUserTypingInChannel(state, currentDMChannelID || '', userId));
	const isTypingInChannel = useAppSelector((state) => selectIsUserTypingInChannel(state, currentChannelID || '', userId));
	const isTypingInDirectMessage = useAppSelector((state) =>
		selectIsUserTypingInChannel(state, directMessageValue?.dmID || '', directMessageValue?.userId)
	);

	const checkDmGroup = Number(directMessageValue?.type) === ChannelType.CHANNEL_TYPE_GROUP;
	// fix
	let checkTypingUser = false;

	switch (true) {
		case isMemberDMGroup:
			checkTypingUser = isTypingInDM;
			break;
		case isMemberChannel:
			checkTypingUser = isTypingInChannel;
			break;
		case isListDm:
			checkTypingUser = isTypingInDirectMessage;
			break;
		default:
			checkTypingUser = false;
			break;
	}

	const renderTypingIndicator = () => (
		<span
			className={`absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-white dark:bg-bgSecondary bg-bgLightMode ${
				checkTypingUser ? 'rounded-lg -right-2' : 'rounded-full right-[-4px]'
			}`}
		>
			<Icons.IconLoadingTyping bgFill="bg-colorSuccess" />
		</span>
	);

	const renderStatusIcon = () => {
		if (isTyping && checkTypingUser) {
			return <Icons.IconLoadingTyping bgFill="bg-colorSuccess" />;
		}

		if (status?.status === false) {
			return <Icons.OfflineStatus defaultSize={sizeStatusIcon} />;
		}

		if (status?.status) {
			if (customStatus) {
				return <UserStatusIcon status={customStatus} />;
			}

			if (status?.isMobile) {
				return <Icons.IconMobileDevice defaultSize="w-3 h-3" />;
			}

			return <Icons.OnlineStatus defaultSize={sizeStatusIcon} />;
		}

		return <Icons.OfflineStatus defaultSize={sizeStatusIcon} />;
	};

	return checkDmGroup ? (
		isTyping && checkTypingUser ? (
			renderTypingIndicator()
		) : null
	) : (
		<span
			className={`absolute bottom-0 inline-flex items-center justify-center gap-1 p-[3px] text-sm text-white dark:bg-bgSecondary bg-bgLightMode ${
				checkTypingUser ? 'rounded-lg -right-2' : 'rounded-full right-[-4px]'
			}`}
		>
			{renderStatusIcon()}
		</span>
	);
});

export default StatusUser;
