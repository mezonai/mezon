import { IMessageWithUser } from '@mezon/utils';

const getPendingName = (isMe: boolean | undefined, messageUsername: string | undefined, nameFromMemList: string, nameFromMessage: string) => {
	if (isMe && !messageUsername) {
		return nameFromMemList;
	} else {
		return nameFromMessage;
	}
};

const getPendingNames = (
	message: IMessageWithUser,
	clanNickFromMemList?: string,
	displayNameFromMemList?: string,
	usernameFromMemList?: string,
	userClanNicknameFromMessage?: string,
	userDisplayNameFromMessage?: string,
	usernameFromMessage?: string,
	avatarFromMemberList?: string,
	avatarFromMessage?: string,
	clanAvatarFromMemList?: string,
	clanAvatarFormMessage?: string
) => {
	const pendingClannick = getPendingName(message.isMe, message.username, clanNickFromMemList ?? '', userClanNicknameFromMessage ?? '');
	const pendingDisplayName = getPendingName(message.isMe, message.username, displayNameFromMemList ?? '', userDisplayNameFromMessage ?? '');
	const pendingUserName = getPendingName(message.isMe, message.username, usernameFromMemList ?? '', usernameFromMessage ?? '');
	const pendingUserAvatar = getPendingName(message.isMe, message.username, avatarFromMemberList ?? '', avatarFromMessage ?? '');
	const pendingClanAvatar = getPendingName(message.isMe, message.username, clanAvatarFromMemList ?? '', clanAvatarFormMessage ?? '');

	return {
		pendingClannick,
		pendingDisplayName,
		pendingUserName,
		pendingUserAvatar,
		pendingClanAvatar
	};
};

export default getPendingNames;
