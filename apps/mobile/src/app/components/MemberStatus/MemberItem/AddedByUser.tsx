import { size, useTheme } from '@mezon/mobile-ui';
import { RootState, selectAllAccount, selectUserAddedByUserId } from '@mezon/store-mobile';
import { useMemo } from 'react';
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

	const nameUserAdded = useMemo(() => {
		if (addedByUser?.id === userProfile?.user?.id) return 'you';
		return addedByUser?.display_name || addedByUser?.username;
	}, [addedByUser?.display_name, addedByUser?.id, addedByUser?.username, userProfile?.user?.id]);

	if (!nameUserAdded) return;
	return (
		<Text
			style={{
				position: 'absolute',
				bottom: size.s_2,
				left: size.s_36 + size.s_24,
				fontSize: size.s_10,
				color: themeValue.textDisabled,
				maxWidth: '85%'
			}}
			numberOfLines={1}
		>
			Add By {nameUserAdded}
		</Text>
	);
}
