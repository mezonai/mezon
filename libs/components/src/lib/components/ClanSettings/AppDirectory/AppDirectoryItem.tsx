import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { useTranslation } from 'react-i18next';
import type { IAppDirectoryItem } from './AppDirectoryList';

interface AppDirectoryItemProps {
	appDirectory: IAppDirectoryItem;
}

const AppDirectoryItem: React.FC<AppDirectoryItemProps> = ({ appDirectory }) => {
	const { t } = useTranslation('clanSettings');
	return (
		<div className="p-4 h-[164px] flex-1 flex flex-col rounded-md dark:bg-[#2b2d31] bg-bgLightModeThird cursor-pointer dark:hover:bg-[#232428] hover:bg-bgLightModeButton">
			<div className="h-12 flex gap-4">
				<img
					alt=""
					className="h-full aspect-square rounded-full object-cover"
					src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQJmekrSbFxQAfknxhfWeI0UGsECFiVM5_ng&s"
				/>
				<div className="h-full flex-1 flex flex-col justify-center">
					<p className="flex-1 text-base font-medium">{appDirectory.botName}</p>
					<p className="flex-1 text-xs">{appDirectory.botCate}</p>
				</div>
			</div>
			<div className="pt-4 flex flex-1 overflow-hidden text-sm w-full">
				<p className="line-clamp-2">{appDirectory.botDescription}</p>
			</div>
			<div className="pt-4 flex text-xs gap-2">
				<MezonIcon icon={MzIcons20.mzDiscover} />
				<p>{t('appDirectory.inServers', { count: appDirectory.botNumber })}</p>
			</div>
		</div>
	);
};

export default AppDirectoryItem;
