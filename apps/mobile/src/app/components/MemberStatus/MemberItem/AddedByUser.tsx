import { size, useTheme } from '@mezon/mobile-ui';
import { RootState, selectAllAccount, selectUserAddedByUserId } from '@mezon/store-mobile';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';
export type AddedByUserProps = {
	groupId: string;
	userId: string;
};
export function AddedByUser({ groupId, userId }: AddedByUserProps) {
	const userProfile = useSelector(selectAllAccount);
	const addedByUser = useSelector((state: RootState) => selectUserAddedByUserId(state, groupId, userId));
	const { themeValue } = useTheme();
	const { t } = useTranslation('friends');

	const nameUserAdded = useMemo(() => {
		if (addedByUser?.id === userProfile?.user?.id) return t('you');
		return addedByUser?.displayName || addedByUser?.username;
	}, [addedByUser?.displayName, addedByUser?.id, addedByUser?.username, userProfile?.user?.id, t]);

	if (!nameUserAdded) return;
	return (
		<Text
			style={{
				bottom: size.s_2,
				fontSize: size.s_10,
				color: themeValue.textDisabled,
				maxWidth: '85%'
			}}
			numberOfLines={1}
		>
			{t('addFriend.addByUsername', { username: nameUserAdded })}
		</Text>
	);
}
