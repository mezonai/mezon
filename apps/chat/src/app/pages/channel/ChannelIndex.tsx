import { isLinuxDesktop, isWindowsDesktop } from '@mezon/utils';
import { useChannelRedirect } from '../../hooks/useChannelRedirect';

export default function ChannelIndex() {
	useChannelRedirect();

	return (
		<div className="flex flex-col flex-1 shrink min-w-0 dark:bg-bgPrimary bg-bgLightModeSecond h-[100%] overflow-hidden">
			<div className={`flex ${isWindowsDesktop || isLinuxDesktop ? 'h-heightTitleBarWithoutTopBar' : 'h-heightWithoutTopBar'} flex-row `}>
				<div className="flex flex-col flex-1 w-full h-full">
					<div
						className={`overflow-y-auto bg-transparent max-w-widthMessageViewChat overflow-x-hidden ${isWindowsDesktop || isLinuxDesktop ? ' max-h-heightTitleBarMessageViewChat h-heightTitleBarMessageViewChat' : ' max-h-heightMessageViewChat h-heightMessageViewChat'}`}
					></div>
					<div className="flex-shrink-0 flex flex-col bg-transparent h-auto"></div>
				</div>
			</div>
		</div>
	);
}
