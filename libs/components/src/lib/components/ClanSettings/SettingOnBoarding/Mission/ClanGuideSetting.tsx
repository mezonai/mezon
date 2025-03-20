import {
	selectChannelById,
	selectCurrentClan,
	selectCurrentClanId,
	selectFormOnboarding,
	selectMemberClanByUserId,
	selectOnboardingByClan,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { titleMission } from '@mezon/utils';
import { ApiOnboardingItem } from 'mezon-js/api.gen';
import { ReactNode } from 'react';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import GuideItemLayout from '../GuideItemLayout';
import ModalAddMission from './ModalAddMission';
import ModalAddRules from './ModalAddRule';

function ClanGuideSetting() {
	const [openModalAddTask, closeModalAddTask] = useModal(() => {
		return <ModalAddMission onClose={closeModalAddTask} />;
	});

	const [openModalAddRules, closeModalAddRule] = useModal(() => {
		return <ModalAddRules onClose={closeModalAddRule} />;
	});

	const currentClanId = useSelector(selectCurrentClanId);
	const onboardingByClan = useAppSelector((state) => selectOnboardingByClan(state, currentClanId as string));
	const onboardingTemp = useSelector(selectFormOnboarding);

	return (
		<div className="h-full flex gap-8 text-channelTextLabel w-[660px] text-sm font-medium">
			<div className="flex flex-col">
				<SectionDescription
					title="Welcome Sign"
					description="Tell new members what's special about your community and why you're excited to see them!"
				/>

				<OwnerGreeting />
				<div className="w-full h-[1px] my-8 bg-channelTextLabel"></div>
				<SectionDescription
					title="New Member To Do's"
					description={
						<>
							Set 3-5 tasks for your new members to do. Get them to <strong>talk and engage in your channels.</strong>
						</>
					}
				/>

				<div className="flex flex-col gap-2 pb-8">
					<div className="uppercase font-bold">Don't do this : too general</div>
					<GuideItemLayout
						hightLightIcon={true}
						icon={<Icons.IconRemove fill="red" />}
						className="px-3 py-[10px] bg-transparent hover:bg-transparent border-2 border-channelTextarea "
						title="chat with the community"
						description="in #general"
					/>
				</div>

				<div className="flex flex-col gap-3">
					{onboardingByClan.mission.map((mission) => (
						<MissionItem mission={mission} key={mission.title} />
					))}

					{onboardingTemp.task.map((mission, index) => (
						<MissionItem mission={mission} key={mission.title} temp={index} />
					))}

					<GuideItemLayout
						hightLightIcon={true}
						gap={16}
						icon={<Icons.RuleIcon />}
						className="px-3"
						description={<div className="h-full flex items-center text-base text-white font-bold">Read the Rules </div>}
					/>

					<button
						onClick={openModalAddTask}
						className="flex items-center justify-center p-4 text-primary text-base gap-1 border-dashed border-2 border-channelTextLabel rounded-md"
					>
						<Icons.AddIcon className="w-4 h-4" /> Add a task
					</button>
				</div>

				<div className="w-full h-[1px] my-8 bg-channelTextLabel"></div>
				<SectionDescription
					title="Resource Pages"
					description={
						<div className="flex flex-col gap-2">
							<div>
								Turn read-only channels into fancy resource pages in your Server Guide. They will no longer appear on the channel list
								unless you enable All Channels. Resources come with some perks:
							</div>
							<div>
								<li> Members start at the top of pages instead of the bottom of a message thread </li>
								<li> Chat bars and avatars are removed so it looks cleaner </li>
								<li> All the content, embeds, media, and formatting will stay the same </li>
							</div>
						</div>
					}
				/>

				<div className="flex flex-col gap-3">
					{onboardingByClan.rule.map((rule) => (
						<RuleItem rule={rule} key={rule.title} />
					))}

					{onboardingTemp.rules.map((rule, index) => (
						<RuleItem rule={rule} temp={index} key={rule.title} />
					))}

					<button
						className="flex items-center justify-center p-4 text-primary text-base gap-1 border-dashed border-2 border-channelTextLabel rounded-md"
						onClick={openModalAddRules}
					>
						<Icons.AddIcon className="w-4 h-4" /> Add a resource
					</button>
				</div>
				<div className="w-full h-[1px] my-8 bg-channelTextLabel"></div>
				<SectionDescription
					title="Clan Guide Banner"
					description="The recommended minimum size is 1920x480 and recommended aspect ratio is 4:1."
				/>
			</div>
		</div>
	);
}

const SectionDescription = ({ title, description }: { title: string; description: ReactNode }) => {
	return (
		<>
			<h2 className="text-channelActiveColor text-xl font-bold">{title}</h2>
			<div className="pt-2 pb-8">{description}</div>
		</>
	);
};
const OwnerGreeting = () => {
	const currenClan = useSelector(selectCurrentClan);
	const clanOwner = useSelector(selectMemberClanByUserId(currenClan?.creator_id as string));
	return (
		<div className="p-[2px] flex items-center justify-center bg-gradient-to-br from-[#d5ddec] to-[#bbbfc9]">
			<div className="w-full p-4 pt-2 flex flex-col gap-2 bg-gradient-to-br from-[#3d3f3d] to-[#1a1d1e] rounded-md">
				<div className="flex  gap-3">
					<div className="w-12 relative">
						<img
							src={clanOwner?.clan_avatar ?? clanOwner.user?.avatar_url}
							className="w-12 aspect-square rounded-full absolute bottom-0 left-0"
						/>
					</div>
					<div className="flex font-semibold text-white items-center gap-1">
						{clanOwner?.clan_nick ?? clanOwner.user?.display_name ?? clanOwner.user?.username} <Icons.OwnerIcon />
					</div>
				</div>
				<div className="text-base text-white">
					Hi, this my onwner clan's greeting. You will see this message in the first time you join clan!
				</div>
			</div>
		</div>
	);
};

const MissionItem = ({ mission, temp }: { mission: ApiOnboardingItem; temp?: number }) => {
	const channelById = useSelector((state) => selectChannelById(state, mission.channel_id as string));

	const [openEditModal, closeEditModal] = useModal(() => {
		return <ModalAddMission onClose={closeEditModal} missionEdit={mission} tempId={temp} />;
	});

	return (
		<GuideItemLayout
			key={mission.title}
			hightLightIcon={true}
			icon={<Icons.Hashtag />}
			gap={16}
			className="px-3"
			title={mission.title}
			description={
				<span>
					{' '}
					{titleMission[mission?.task_type ? mission?.task_type - 1 : 0]}{' '}
					<span className="font-semibold text-channelActiveColor">#{channelById.channel_label}</span>{' '}
				</span>
			}
			action={
				<button className="w-8 h-8 rounded bg-buttonPrimary flex items-center justify-center text-white" onClick={openEditModal}>
					{' '}
					<Icons.EditMessageRightClick defaultSize="w-5 h-5" />{' '}
				</button>
			}
		/>
	);
};

const RuleItem = ({ rule, temp }: { rule: ApiOnboardingItem; temp?: number }) => {
	const [openEditModal, closeEditModal] = useModal(() => {
		return <ModalAddRules onClose={closeEditModal} ruleEdit={rule} tempId={temp} />;
	});

	return (
		<GuideItemLayout
			key={rule.title}
			icon={<Icons.RuleIcon />}
			gap={16}
			className="px-4 py-3"
			description={rule.content}
			title={rule.title}
			action={
				<button className="w-8 h-8 rounded bg-buttonPrimary flex items-center justify-center text-white" onClick={openEditModal}>
					{' '}
					<Icons.EditMessageRightClick defaultSize="w-5 h-5" />{' '}
				</button>
			}
		/>
	);
};
export default ClanGuideSetting;
