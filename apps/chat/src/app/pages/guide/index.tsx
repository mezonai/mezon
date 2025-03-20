import { selectCurrentClan, selectMemberClanByUserId } from '@mezon/store';
import { useSelector } from 'react-redux';
import GuideBody from './GuideBody';

function GuideMain() {
	const currentClan = useSelector(selectCurrentClan);
	const clanOwner = useSelector(selectMemberClanByUserId(currentClan?.creator_id as string));
	return (
		<div className="w-full h-full overflow-x-hidden p-8 overflow-y-scroll  scrollbar-hide flex flex-col items-center">
			<div className="flex flex-col w-[104%]">
				<div
					className={`h-36 w-full object-cover ${currentClan?.banner ? '' : 'bg-bgModalDark'} rounded-xl flex items-center justify-center`}
				>
					{currentClan?.banner ? <img src={currentClan.banner} className="w-full h-full object-cover  rounded-xl" /> : null}
				</div>
			</div>
			<div className="flex flex-col w-full relative justify-end pt-2">
				<div
					className={`absolute -top-12 h-28 w-28 rounded-3xl object-cover shadow-sm ${currentClan?.logo ? '' : 'bg-zinc-950'} flex items-center justify-center`}
				>
					{currentClan?.logo ? (
						<img src={currentClan.logo} className="w-full h-full object-cover  rounded-3xl" />
					) : (
						<p className="text-white text-4xl font-bold">{currentClan?.clan_name?.charAt(0)}</p>
					)}
				</div>
				<div className=" flex gap-3 items-end h-28">
					<div className="text-[32px] font-bold leading-8">
						{currentClan?.clan_name ?? `${clanOwner?.user?.display_name ?? clanOwner?.user?.username}'s`} clan
					</div>
					<div className="relative h-6 w-6">
						<svg className="absolute" role="img" width="24" height="24" viewBox="0 0 16 15.2">
							<path
								fill="#ffffff"
								fillRule="evenodd"
								d="m16 7.6c0 .79-1.28 1.38-1.52 2.09s.44 2 0 2.59-1.84.35-2.46.8-.79 1.84-1.54 2.09-1.67-.8-2.47-.8-1.75 1-2.47.8-.92-1.64-1.54-2.09-2-.18-2.46-.8.23-1.84 0-2.59-1.54-1.3-1.54-2.09 1.28-1.38 1.52-2.09-.44-2 0-2.59 1.85-.35 2.48-.8.78-1.84 1.53-2.12 1.67.83 2.47.83 1.75-1 2.47-.8.91 1.64 1.53 2.09 2 .18 2.46.8-.23 1.84 0 2.59 1.54 1.3 1.54 2.09z"
							></path>
						</svg>
						<svg
							className="absolute top-1 right-1"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							fill="none"
							viewBox="0 0 24 24"
						>
							<path
								fill="#000000"
								d="m2.4 8.4 8.38-6.46a2 2 0 0 1 2.44 0l8.39 6.45a2 2 0 0 1-.79 3.54l-.32.07-.82 8.2a2 2 0 0 1-1.99 1.8H16a1 1 0 0 1-1-1v-5a3 3 0 0 0-6 0v5a1 1 0 0 1-1 1H6.31a2 2 0 0 1-1.99-1.8L3.5 12l-.32-.07a2 2 0 0 1-.79-3.54Z"
							></path>
						</svg>
					</div>
					<div className="flex-1 flex justify-end">
						<div className="w-24 h-9 py-[2px] flex items-center justify-center rounded-md bg-bgModifierHover">Invite</div>
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
