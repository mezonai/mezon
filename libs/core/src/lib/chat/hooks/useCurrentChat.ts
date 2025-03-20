import {
	getStore,
	selectAllUserClans,
	selectClanView,
	selectDmGroupCurrentId,
	selectEntitesUserClans,
	selectGrouplMembers,
	selectGroupMembersEntities,
	useAppSelector
} from '@mezon/store';

export function useCurrentChat() {
	const directId = useAppSelector(selectDmGroupCurrentId);
	const isClanView = useAppSelector((state) => selectClanView(state));
	const allClanUsersEntities = useAppSelector(selectEntitesUserClans);
	const allDmUsersEntities = useAppSelector((state) => selectGroupMembersEntities(state, directId));
	const allClanUsers = useAppSelector(selectAllUserClans);
	const allDmUsers = useAppSelector((state) => selectGrouplMembers(state, directId));

	const currentChatUsers = isClanView ? allClanUsers : allDmUsers;

	const currentChatUsersEntities = isClanView ? allClanUsersEntities : allDmUsersEntities;

	return {
		currentChatUsers,
		currentChatUsersEntities
	};
}

export function getCurrentChatData() {
	const state = getStore().getState();

	const directId = selectDmGroupCurrentId(state);
	const isClanView = selectClanView(state);
	const allClanUsersEntities = selectEntitesUserClans(state);
	const allDmUsersEntities = selectGroupMembersEntities(state, directId);
	const allClanUsers = selectAllUserClans(state);
	const allDmUsers = selectGrouplMembers(state, directId);

	const currentChatUsers = isClanView ? allClanUsers : allDmUsers;
	const currentChatUsersEntities = isClanView ? allClanUsersEntities : allDmUsersEntities;

	return {
		currentChatUsers,
		currentChatUsersEntities
	};
}
