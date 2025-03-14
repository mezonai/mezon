import { appActions, useAppDispatch } from '@mezon/store';
import { ApiChannelDescription } from 'mezon-js/api.gen';
import { useEffect } from 'react';
import ChannelMain from '../channel';
import AppDiscussionHeader from './AppDiscussionHeader';

type AppDiscussionMainProps = {
	appChannel: ApiChannelDescription | null;
};

const AppDiscussionMain = ({ appChannel }: AppDiscussionMainProps) => {
	const dispatch = useAppDispatch();

	useEffect(() => {
		return () => {
			dispatch(appActions.setIsShowAppDiscussion(false));
		};
	}, [dispatch]);

	return (
		<div className="flex flex-col h-full border-l dark:border-borderDivider border-bgLightTertiary">
			<AppDiscussionHeader appChannel={appChannel} />
			<ChannelMain isAppDiscussion={true} />
		</div>
	);
};

export default AppDiscussionMain;
