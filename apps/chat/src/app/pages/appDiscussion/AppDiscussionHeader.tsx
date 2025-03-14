import { appActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ApiChannelDescription } from 'mezon-js/api.gen';
import { useCallback } from 'react';

type AppDiscussionHeaderProps = {
	appChannel?: ApiChannelDescription | null;
};

const AppDiscussionHeader = ({ appChannel }: AppDiscussionHeaderProps) => {
	const dispatch = useAppDispatch();
	const handleCloseModal = useCallback(
		(event?: React.MouseEvent) => {
			event?.stopPropagation();
			dispatch(appActions.setIsShowAppDiscussion(false));
		},
		[dispatch]
	);

	return (
		<div className="flex flex-row items-center justify-between px-4 h-[58px] min-h-[60px] border-b-[1px] dark:border-bgTertiary border-bgLightTertiary z-10 dark:bg-bgPrimary bg-bgLightPrimary">
			<div className="flex flex-row items-center gap-2 pointer-events-none">
				<Icons.Chat />
				<span className="text-base font-semibold dark:text-white text-colorTextLightMode">{appChannel?.channel_label}</span>
			</div>
			<button onClick={(e) => handleCloseModal(e)} className="relative right-0">
				<Icons.Close />
			</button>
		</div>
	);
};

export default AppDiscussionHeader;
