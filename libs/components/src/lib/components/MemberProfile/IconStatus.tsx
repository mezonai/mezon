import { selectIsUserTypingInChannel, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserStatus } from '@mezon/utils';
import { RenderTypingIndicator, StatusUser } from '../StatusUser';

export const UserStatusIconDM = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <StatusUser status="online" />;
		case EUserStatus.IDLE:
			return (
				<span className="flex justify-end items-end h-full">
					<Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-3 h-3 bg-theme-primary p-[2px] rounded-full" />
				</span>
			);
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser status="dnd" />;
		case EUserStatus.INVISIBLE:
			return (
				<span className="flex justify-end items-end h-full">
					<Icons.OfflineStatus className=" w-3 h-3 bg-theme-primary p-[2px] rounded-full" />
				</span>
			);
		default:
			return <StatusUser status="offline" />;
	}
};

export const UserStatusIcon = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <StatusUser status="online" className="w-5 h-5 p-1" />;
		case EUserStatus.IDLE:
			return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-5 h-5 bg-theme-primary p-1 rounded-full" />;
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser status="dnd" className="w-5 h-5 p-1" />;
		case EUserStatus.INVISIBLE:
			return <Icons.OfflineStatus className="w-5 h-5 bg-theme-primary p-1 rounded-full" />;
		default:
			return <StatusUser status="offline" className="w-5 h-5 p-1" />;
	}
};

export const UserStatusIconClan = ({
	status,
	channelId,
	userId,
	isShareContact = false
}: {
	status?: EUserStatus;
	channelId?: string;
	userId?: string;
	isShareContact?: boolean;
}) => {
	const normalizedStatus = status?.toUpperCase();
	const isTyping = useAppSelector((state) => selectIsUserTypingInChannel(state, channelId || '', userId || ''));

	if (isTyping && !isShareContact) {
		return RenderTypingIndicator();
	}

	switch (normalizedStatus) {
		case 'IDLE':
			return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-[10px] h-[10px]" />;
		case 'DO NOT DISTURB':
			return <StatusUser status="dnd" />;
		case 'INVISIBLE':
			return <StatusUser status="offline" />;
		case 'ONLINE':
			return <StatusUser status="online" />;
		default:
			return <StatusUser status="offline" />;
	}
};
