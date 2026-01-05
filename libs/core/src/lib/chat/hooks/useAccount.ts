import { clansActions, useAppDispatch } from '@mezon/store';
import React, { useMemo } from 'react';

export function useAccount() {
	const dispatch = useAppDispatch();

	const updateUser = React.useCallback(
		async (name: string, logoUrl: string, displayName: string, aboutMe: string, dob: string, logo: string, noCache?: boolean) => {
			const action = await dispatch(
				clansActions.updateUser({
					avatarUrl: logoUrl,
					displayName: displayName,
					aboutMe: aboutMe,
					dob,
					noCache,
					logo
				})
			);
			const payload = action.payload;
			return payload;
		},
		[dispatch]
	);

	const updateUserName = React.useCallback(
		async (username: string) => {
			const action = await dispatch(clansActions.updateUsername({ username }));
			return action.payload;
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			updateUser,
			updateUserName
		}),
		[updateUser, updateUserName]
	);
}
