import { useIsUserTyping } from '@mezon/store';
import { MezonIcon, MzIcons16, MzIcons20 } from '@mezon/ui';
import { EUserStatus } from '@mezon/utils';
import { RenderTypingIndicator, StatusUser } from '../StatusUser';

export const UserStatusIconDM = ({ status }: { status?: EUserStatus }) => {
	switch (status) {
		case EUserStatus.ONLINE:
			return <StatusUser status="online" />;
		case EUserStatus.IDLE:
			return (
				<span className="flex justify-end items-end h-full w-[10px] h-[10px]">
					<span className="flex rounded-full bg-theme-primary p-[2px]">
						<MezonIcon icon={MzIcons16.mzMoon} className="w-2 h-2 text-[#F0B232] -rotate-90" />
					</span>
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
			return (
				<span className="inline-flex rounded-full bg-theme-primary p-1">
					<MezonIcon icon={MzIcons20.mzMoon} className="text-[#F0B232] -rotate-90" />
				</span>
			);
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser status="dnd" className="w-[20px] h-[20px] p-1" />;
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
			return <MezonIcon icon={MzIcons16.mzMoon} className="text-[#F0B232] -rotate-90" />;
		case EUserStatus.DO_NOT_DISTURB:
			return <StatusUser status="dnd" />;
		case EUserStatus.ONLINE:
			return <StatusUser status="online" />;
		case EUserStatus.INVISIBLE:
		default:
			return null;
	}
};
