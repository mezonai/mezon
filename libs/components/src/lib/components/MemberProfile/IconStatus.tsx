import { useIsUserTyping } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EUserStatus } from '@mezon/utils';
import { RenderTypingIndicator, StatusUser } from '../StatusUser';

export const UserStatusIconDM = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <StatusUser status="online" />;
		case EUserStatus.IDLE:
			return (
				<span className="flex justify-end items-end h-full w-[10px] h-[10px]">
					<Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-[10px] h-[10px] bg-theme-primary p-[2px] rounded-full" />
				</span>
			);
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser status="dnd" />;
		default:
			return null;
	}
};

export const UserStatusIcon = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <StatusUser status="online" className="w-5 h-5 p-1" />;
		case EUserStatus.IDLE:
			return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-[10px] h-[10px]  bg-theme-primary p-1 rounded-full" />;
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser status="dnd" className="w-[10px] h-[10px] p-1" />;
		default:
			return null;
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
	const isTyping = useIsUserTyping(channelId || '', userId || '');
	if (channelId && userId && isTyping && !isShareContact) {
		return <RenderTypingIndicator />;
	}

	switch (status) {
		case EUserStatus.IDLE:
			return <Icons.DarkModeIcon className="text-[#F0B232] -rotate-90 w-[10px] h-[10px]" />;
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser status="dnd" />;
		case EUserStatus.ONLINE:
			return <StatusUser status="online" />;
		case EUserStatus.INVISIBLE:
		default:
			return null;
	}
};
