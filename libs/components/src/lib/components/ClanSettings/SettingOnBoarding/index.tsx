import { channelSettingActions, selectEnableStatusOfOnBoarding, useAppDispatch } from '@mezon/store';
import { Icons, Image } from '@mezon/ui';
import { useSelector } from 'react-redux';

const SettingOnBoarding = () => {
	const dispatch = useAppDispatch();
	const toggleEnableStatus = () => {
		dispatch(channelSettingActions.toggleOnBoarding());
	};

	const isEnableOnBoarding = useSelector(selectEnableStatusOfOnBoarding);

	return (
		<div className="flex flex-col gap-6 flex-1 dark:text-channelTextLabel text-colorTextLightMode text-sm">
			<div className="flex flex-col gap-2">
				<div className="text-[20px] text-white font-semibold">On Boarding</div>
				<div className="font-medium">Give your members a simple starting experience with custom channels, roles and first steps.</div>
				<div className="flex gap-2 items-center">
					<div className="cursor-pointer text-blue-500 hover:underline">See examples</div>
					<div className="w-1 h-1 rounded-full bg-gray-600" />
					<div className="cursor-pointer text-blue-500 hover:underline">Preview</div>
					<div className="w-1 h-1 rounded-full bg-gray-600" />
					<div className="cursor-pointer text-blue-500 hover:underline">Switch to Advanced Mode</div>
				</div>
			</div>
			<div className="flex gap-4 items-center rounded-lg dark:bg-[#2b2d31] p-4">
				<div className="w-fit">
					<Image
						src={`assets/images/wumpus_addbba.svg`}
						alt={'wumpus'}
						width={40}
						height={40}
						className="aspect-square object-cover w-[40px]"
					/>
				</div>
				<div className="flex flex-col gap-2 text-[14px]">
					<div className="font-semibold text-white">Recent Updates</div>
					<div className="font-medium">
						<div>• You can now upload custom images for New-Member To-Dos and Resource Pages.</div>
						<div>• Added a custom description option for Resource pages</div>
					</div>
				</div>
			</div>
			<div className="text-white">
				<div className="bg-bgTertiary rounded-t-lg px-4 py-3 flex justify-between items-center">
					<div>
						<div className="text-white font-semibold">Onboarding Is Enabled</div>
						<div className="text-[12px] text-channelTextLabel">Changes will not take effect until you save.</div>
					</div>
					<div>
						<input
							className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
                            bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
                            after:bg-slate-500 after:transition-all checked:bg-blue-200 checked:after:left-4 checked:after:bg-blue-500
                            hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-blue-300 checked:after:hover:bg-blue-600
                            focus:outline-none checked:focus:bg-blue-400 checked:after:focus:bg-blue-700 focus-visible:outline-none disabled:cursor-not-allowed
                            disabled:bg-slate-200 disabled:after:bg-slate-300"
							type="checkbox"
							checked={isEnableOnBoarding}
							onChange={toggleEnableStatus}
						/>
					</div>
				</div>
				<div className="p-4 bg-bgSecondary flex justify-between items-center">
					<div className="flex gap-4">
						<div className="w-10 h-10 flex justify-center items-center bg-bgTertiary rounded-full">
							<Icons.HashIcon className="w-6 text-channelTextLabel" />
						</div>
						<div>
							<div className="font-semibold">Default Channels</div>
							<div className="text-[12px]">You have 7 Default Channels</div>
						</div>
					</div>
					<div className="w-[60px] h-[32px] flex justify-center items-center rounded-sm border border-bgModifierHover hover:bg-bgModifierHover cursor-pointer">
						Edit
					</div>
				</div>
				<div className="mx-4 border-t border-bgModifierHover" />
				<div className="p-4 bg-bgSecondary flex justify-between items-center">
					<div className="flex gap-4">
						<div className="w-10 h-10 flex justify-center items-center bg-bgTertiary rounded-full">
							<Icons.People className="w-6 text-channelTextLabel" />
						</div>
						<div>
							<div className="font-semibold">Questions</div>
							<div className="text-[12px]">7 of 7 public channels are assignable through Questions and Default Channels.</div>
						</div>
					</div>
					<div className="w-[60px] h-[32px] flex justify-center items-center rounded-sm border border-bgModifierHover hover:bg-bgModifierHover cursor-pointer">
						Edit
					</div>
				</div>
				<div className="mx-4 border-t border-bgModifierHover" />
				<div className="p-4 bg-bgSecondary flex justify-between items-center">
					<div className="flex gap-4">
						<div className="w-10 h-10 flex justify-center items-center bg-bgTertiary rounded-full">
							<Icons.GuideIcon defaultFill="#b5bac1" defaultSize="w-6" />
						</div>
						<div>
							<div className="font-semibold">Server Guide</div>
							<div className="text-[12px]">Your Welcome Message, Banner, To-Do tasks and Resources are all set up</div>
						</div>
					</div>
					<div className="flex items-center gap-4">
						{isEnableOnBoarding && (
							<input
								className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
                            bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
                            after:bg-slate-500 after:transition-all checked:bg-blue-200 checked:after:left-4 checked:after:bg-blue-500
                            hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-blue-300 checked:after:hover:bg-blue-600
                            focus:outline-none checked:focus:bg-blue-400 checked:after:focus:bg-blue-700 focus-visible:outline-none disabled:cursor-not-allowed
                            disabled:bg-slate-200 disabled:after:bg-slate-300"
								type="checkbox"
							/>
						)}
						<div className="w-[60px] h-[32px] flex justify-center items-center rounded-sm border border-bgModifierHover hover:bg-bgModifierHover cursor-pointer">
							Edit
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingOnBoarding;
