import { RootState, selectAllAccount, selectUserAddedByUserId } from '@mezon/store';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
export type MemberItemProps = {
	groupId: string;
	userId: string;
};

function AddedByUser({ groupId, userId }: MemberItemProps) {
	const userProfile = useSelector(selectAllAccount);
	const addedByUser = useSelector((state: RootState) => selectUserAddedByUserId(state, groupId, userId));

	const nameUserAdded = useMemo(() => {
		if (addedByUser?.id === userProfile?.user?.id) return 'you';
		return addedByUser?.display_name || addedByUser?.username;
	}, [addedByUser?.display_name, addedByUser?.id, addedByUser?.username, userProfile?.user?.id]);

	if (!nameUserAdded) return;
	return (
		<p className={`text-theme-primary opacity-70 w-full text-[14px] line-clamp-1 break-all max-w-[176px] mt-1`} title={nameUserAdded}>
			Added by {nameUserAdded}
		</p>
	);
}

export default AddedByUser;
