export const avatarOverrideStore = {
	userAvatars: new Map<string, string>(),
	clanAvatars: new Map<string, string>(),
	version: 0
};

export const setUserAvatarOverride = (userId: string, avatar: string) => {
	avatarOverrideStore.userAvatars.set(userId, avatar);
	avatarOverrideStore.version++;
};

export const setUserClanAvatarOverride = (userId: string, clanId: string, avatar: string) => {
	const key = `${userId}_${clanId}`;
	avatarOverrideStore.clanAvatars.set(key, avatar);
	avatarOverrideStore.version++;
};

export const getUserAvatarOverride = (userId: string): string | undefined => {
	return avatarOverrideStore.userAvatars.get(userId);
};

export const getUserClanAvatarOverride = (userId: string, clanId: string): string | undefined => {
	const key = `${userId}_${clanId}`;
	return avatarOverrideStore.clanAvatars.get(key);
};
