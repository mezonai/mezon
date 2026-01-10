import type { RootState } from '@mezon/store';
import { selectAllAccount, selectUserAddedByUserId } from '@mezon/store';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
export type MemberItemProps = {
	groupId: string;
	userId: string;
};

function AddedByUser({ groupId, userId }: MemberItemProps) {
	const { t } = useTranslation('memberPage');
	const userProfile = useSelector(selectAllAccount);
	const addedByUser = useSelector((state: RootState) => selectUserAddedByUserId(state, groupId, userId));

	const nameUserAdded = useMemo(() => {
		if (addedByUser?.id === userProfile?.user?.id) return 'you';
		return addedByUser?.displayName || addedByUser?.username;
	}, [addedByUser?.displayName, addedByUser?.id, addedByUser?.username, userProfile?.user?.id]);

	if (!nameUserAdded) return;
	return (
		<p className={`text-theme-primary opacity-70 w-full text-[14px] line-clamp-1 break-all max-w-[176px] mt-1`} title={nameUserAdded}>
			{t('addedBy', { name: nameUserAdded })}
		</p>
	);
}

export default AddedByUser;
