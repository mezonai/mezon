import { useAppNavigation, useAppParams } from '@mezon/core';
import { selectCategoriesIds, selectDefaultChannelIdByClanId } from '@mezon/store';
import { isWindowsDesktop } from '@mezon/utils';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import ChannelMessages from './ChannelMessages';

export default function ChannelIndex() {
	const { clanId } = useAppParams();
	const categories = useSelector(selectCategoriesIds);
	const defaultChannelId = useSelector(selectDefaultChannelIdByClanId(clanId || '', categories));

	const { navigate } = useAppNavigation();
	useEffect(() => {
		if (defaultChannelId) {
			navigate(`./${defaultChannelId}`);
		}
	}, [defaultChannelId, navigate, clanId]);

	return (
		<div className="flex flex-col flex-1 shrink min-w-0 dark:bg-bgPrimary bg-bgLightModeSecond h-[100%] overflow-hidden">
			<div className="flex h-heightWithoutTopBar flex-row ">
				<div className="flex flex-col flex-1 w-full h-full">
					<div
						className={`overflow-y-auto bg-transparent max-w-widthMessageViewChat overflow-x-hidden max-h-heightMessageViewChat ${isWindowsDesktop ? 'h-heightTitleBarMessageViewChat' : 'h-heightMessageViewChat'}`}
					>
						<ChannelMessages.Skeleton />
					</div>
					<div className="flex-shrink-0 flex flex-col bg-transparent h-auto">
						<ChannelMessages.Skeleton />
					</div>
				</div>
			</div>
		</div>
	);
}
