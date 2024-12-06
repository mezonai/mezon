import { appActions, useAppDispatch } from '@mezon/store';
import { useCallback, useMemo } from 'react';

export function useSettingFooter() {
	const dispatch = useAppDispatch();
	const setIsShowSettingFooterStatus = useCallback(
		(status: boolean) => {
			dispatch(appActions.setIsShowSettingFooterStatus(status));
		},
		[dispatch]
	);

	const setIsShowSettingFooterInitTab = useCallback(
		(value: string) => {
			dispatch(appActions.setIsShowSettingFooterInitTab(value));
		},
		[dispatch]
	);

	const setIsShowSettingProfileInitTab = useCallback(
		(value: string) => {
			dispatch(appActions.setIsShowSettingProfileInitTab(value));
		},
		[dispatch]
	);

	const setClanIdSettingProfile = useCallback(
		(value: string) => {
			dispatch(appActions.setClanIdSettingProfile(value));
		},
		[dispatch]
	);

	const setIsUserProfile = useCallback(
		(isUserProfile: boolean) => {
			dispatch(appActions.setIsUserProfile(isUserProfile));
		},
		[dispatch]
	);

	return useMemo(
		() => ({
			setIsShowSettingFooterStatus,
			setIsShowSettingFooterInitTab,
			setIsUserProfile,
			setIsShowSettingProfileInitTab,
			setClanIdSettingProfile
		}),
		[setIsShowSettingFooterStatus, setIsShowSettingFooterInitTab, setIsUserProfile, setIsShowSettingProfileInitTab, setClanIdSettingProfile]
	);
}
