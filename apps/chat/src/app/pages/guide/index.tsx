import {
	clansActions,
	selectCurrentClanBanner,
	selectCurrentClanCreatorId,
	selectCurrentClanLogo,
	selectCurrentClanName,
	selectMemberClanByUserId,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { MezonIcon, MzIcons24 } from '@mezon/ui';
import { createImgproxyUrl } from '@mezon/utils';
import { useTranslation } from 'react-i18next';
import GuideBody from './GuideBody';

function GuideMain() {
	const { t } = useTranslation('common');
	const dispatch = useAppDispatch();
	const currentClanName = useAppSelector(selectCurrentClanName);
	const currentClanBanner = useAppSelector(selectCurrentClanBanner);
	const currentClanLogo = useAppSelector(selectCurrentClanLogo);
	const currentClanCreatorId = useAppSelector(selectCurrentClanCreatorId);
	const clanOwner = useAppSelector((state) => selectMemberClanByUserId(state, currentClanCreatorId as string));
	return (
		<div className="w-full h-full overflow-x-hidden p-8 overflow-y-scroll text-theme-primary scrollbar-hide flex flex-col items-center">
			<div className="flex flex-col w-[104%]">
				<div
					className={`h-36 w-full object-cover ${currentClanBanner ? '' : 'bg-private-theme'} rounded-xl flex items-center justify-center`}
				>
					{currentClanBanner ? (
						<img
							src={createImgproxyUrl(currentClanBanner, { width: 0, height: 0, resizeType: 'force' })}
							alt=""
							className="w-full h-full object-cover  rounded-xl"
						/>
					) : null}
				</div>
			</div>
			<div className="flex flex-col w-full relative justify-end pt-2">
				<div
					className={`absolute -top-12 h-28 w-28 rounded-3xl object-cover shadow-sm ${currentClanLogo ? '' : 'bg-zinc-950'} flex items-center justify-center`}
				>
					{currentClanLogo ? (
						<img
							src={createImgproxyUrl(currentClanLogo, { width: 256, height: 256, resizeType: 'fill-down' })}
							alt=""
							className="w-full h-full object-cover  rounded-3xl"
						/>
					) : (
						<p className="text-4xl font-bold">{currentClanName?.charAt(0)}</p>
					)}
				</div>
				<div className=" flex gap-3 items-end h-28">
					<div className="text-[32px] font-bold leading-8 truncate overflow-hidden max-w-[70%]" title="">
						{currentClanName ?? `${clanOwner?.user?.display_name ?? clanOwner?.user?.username}'s ${t('guide.clan')}`}
					</div>
					<div className="relative h-6 w-6 text-theme-primary">
						<MezonIcon icon={MzIcons24.mzClanBadge} className="text-[var(--mz-icon)]" />
					</div>
					<div className="flex-1 flex justify-end">
						<button
							type="button"
							onClick={() => dispatch(clansActions.toggleInvitePeople({ status: true }))}
							className="w-24 h-9 py-[2px] flex items-center justify-center rounded-lg border-theme-primary bg-theme-input text-theme-primary-hover bg-secondary-button-hover "
						>
							{t('guide.invite')}
						</button>
					</div>
				</div>
			</div>
			<div className="pt-8 w-full">
				<GuideBody />
			</div>
		</div>
	);
}

export default GuideMain;
