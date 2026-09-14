/* eslint-disable react/jsx-no-useless-fragment */
import { GuideItemLayout } from '@mezon/components';
import { useAppNavigation } from '@mezon/core';
import {
	ETypeMission,
	fetchOnboarding,
	onboardingActions,
	selectAnswerByClanId,
	selectAnswerByQuestionId,
	selectChannelById,
	selectCurrentClanId,
	selectFormOnboarding,
	selectMissionDone,
	selectMissionSum,
	selectOnboardingByClan,
	selectOnboardingMode,
	selectProcessingByClan,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import { DONE_ONBOARDING_STATUS, generateE2eId, titleMission } from '@mezon/utils';
import type { ApiOnboardingItem } from 'mezon-js';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

function GuideBody() {
	const { t } = useTranslation('common');
	const onboadingMode = useSelector(selectOnboardingMode);
	const currentClanId = useSelector(selectCurrentClanId);
	const { navigate, toChannelPage } = useAppNavigation();
	const dispatch = useAppDispatch();
	const formOnboarding = useSelector(selectFormOnboarding);
	const missionSum = useSelector((state) => selectMissionSum(state, currentClanId as string));
	const missionDone = useSelector((state) => selectMissionDone(state, currentClanId as string));
	const selectUserProcessing = useSelector((state) => selectProcessingByClan(state, currentClanId as string));
	const answerByClanId = useAppSelector((state) => selectAnswerByClanId(state, currentClanId as string));

	const doneAllMission = (indexMision: number) => {
		if (indexMision + 1 === missionSum) {
			dispatch(onboardingActions.doneOnboarding({ clan_id: currentClanId as string }));
		}
	};

	const handleDoMission = (mission: ApiOnboardingItem, index: number) => {
		if (index === missionDone || selectUserProcessing?.onboarding_step === DONE_ONBOARDING_STATUS) {
			switch (mission.task_type) {
				case ETypeMission.SEND_MESSAGE: {
					const link = toChannelPage(mission.channel_id as string, currentClanId as string);
					navigate(link);
					break;
				}
				case ETypeMission.VISIT: {
					const linkChannel = toChannelPage(mission.channel_id as string, currentClanId as string);
					navigate(linkChannel);
					dispatch(onboardingActions.doneMission({ clan_id: currentClanId as string }));
					doneAllMission(index);
					break;
				}
				case ETypeMission.DOSOMETHING: {
					dispatch(onboardingActions.doneMission({ clan_id: currentClanId as string }));
					doneAllMission(index);
					break;
				}
				default:
					break;
			}
		}
	};

	const onboardingItem = useAppSelector((state) => selectOnboardingByClan(state, currentClanId as string));

	const totalAnswersLength = useMemo(() => {
		return onboardingItem.question.reduce((sum, question) => {
			return sum + (question.answers?.length || 0);
		}, 0);
	}, [onboardingItem.question]);

	const totalNumberAnswer = answerByClanId?.length || 0;

	const answerPercent = totalAnswersLength > 0 ? (totalNumberAnswer * 100) / totalAnswersLength : 0;

	useEffect(() => {
		if (!currentClanId) return;
		dispatch(fetchOnboarding({ clan_id: currentClanId }));
	}, [currentClanId, dispatch]);

	return (
		<div className="w-full h-full pt-4 ">
			<div className="flex gap-6">
				<div className="flex-1 flex flex-col gap-2">
					{onboardingItem?.question.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="p-2 text-xl font-bold " data-e2e={generateE2eId('onboarding.clan_guide_page.label')}>
								{t('guide.questions')}
							</p>
							<div className=" flex flex-col gap-2 rounded-lg relative shadow-sm dark:shadow-none">
								{onboardingItem?.question.map((question) => <QuestionItems question={question} key={question.id} />)}
								<div className="absolute top-0 -left-4 w-1 h-full">
									<div className="flex  relative rounded-2xl w-1 h-full overflow-hidden">
										<div
											className="absolute w-1 h-full transition-transform duration-1000 bg-green-600 dark:bg-[#16A34A] rounded-2xl"
											style={{
												height: `${answerPercent}%`,
												transition: 'height 1s ease-out'
											}}
										></div>
									</div>
								</div>
							</div>
						</div>
					)}
					{(onboardingItem?.rule?.length > 0 || (onboadingMode?.open && formOnboarding?.rules?.length > 0)) && (
						<div className="flex flex-col gap-2">
							<p className="p-2 text-xl font-bold " data-e2e={generateE2eId('onboarding.clan_guide_page.label')}>
								{t('guide.resources')}
							</p>
							{onboardingItem?.rule?.length > 0
								? onboardingItem.rule.map((rule) => (
										<GuideItemLayout
											key={rule.id}
											title={rule.title}
											hightLightIcon={true}
											description={rule.content}
											icon={<Icons.RuleIcon defaultFill="#e4e4e4" />}
											background=""
											className="shadow-sm bg-item-theme"
											action={
												<div className="w-[72px] aspect-square  rounded-lg flex overflow-hidden">
													{rule.image_url && <img src={rule.image_url} className="w-full h-full object-cover" />}
												</div>
											}
										/>
									))
								: null}
							{onboadingMode?.open &&
								formOnboarding?.rules?.length > 0 &&
								formOnboarding.rules.map((rule, index) => (
									<GuideItemLayout
										key={index}
										title={rule.title}
										hightLightIcon={true}
										description={rule.content}
										icon={<Icons.RuleIcon />}
										background=""
										className="shadow-sm dark:shadow-none text-theme-primary bg-theme-setting-nav"
										action={<div className="w-[72px] aspect-square  rounded-lg"></div>}
									/>
								))}
						</div>
					)}
					{(onboardingItem?.mission?.length > 0 || (onboadingMode?.open && formOnboarding?.task?.length > 0)) && (
						<div className="flex flex-col gap-2">
							<p className="p-2 text-xl font-bold " data-e2e={generateE2eId('onboarding.clan_guide_page.label')}>
								{t('guide.missions')}{' '}
							</p>
							{onboardingItem?.mission?.length > 0
								? onboardingItem.mission.map((mission, index) => (
										<GuideItemMission
											key={mission.id}
											mission={mission}
											onClick={() => handleDoMission(mission, index)}
											tick={missionDone > index || selectUserProcessing?.onboarding_step === DONE_ONBOARDING_STATUS}
										/>
									))
								: null}
							{onboadingMode?.open &&
								formOnboarding?.task?.length > 0 &&
								formOnboarding.task.map((mission, index) => (
									<GuideItemMission
										key={mission.title}
										mission={mission}
										onClick={() => handleDoMission(mission, index)}
										tick={true}
									/>
								))}
						</div>
					)}
					{onboardingItem?.question.length === 0 && onboardingItem?.rule.length === 0 && onboardingItem?.mission.length === 0 && (
						<p className="p-2 text-xl font-bold " data-e2e={generateE2eId('onboarding.clan_guide_page.label')}>
							{t('guide.emptyGuideLine')}
						</p>
					)}
				</div>
				<div className="mt-8 flex flex-col gap-2 h-20 p-4 w-[300px] bg-item-theme text-base justify-between  rounded-lg shadow-sm ">
					<div className="font-bold ">{t('guide.about')}</div>
					<div className=" text-xs">{t('guide.membersOnline')}</div>
				</div>
			</div>
		</div>
	);
}

type TypeItemMission = {
	mission: ApiOnboardingItem;
	onClick: () => void;
	tick: boolean;
};

const GuideItemMission = ({ mission, onClick, tick }: TypeItemMission) => {
	const channelById = useSelector((state) => selectChannelById(state, mission.channel_id as string));
	return (
		<GuideItemLayout
			key={mission.id}
			title={mission.title}
			className="cursor-pointer shadow-sm dark:shadow-none text-theme-primary bg-item-theme"
			hightLightIcon={true}
			icon={<Icons.TargetIcon className="w-6 h-6 " />}
			onClick={onClick}
			background=""
			description={
				<span className="">
					{titleMission[mission.task_type ? mission.task_type - 1 : 0] || ''}{' '}
					<span className="font-semibold text-theme-primary-active"> #{channelById?.channel_label} </span>{' '}
				</span>
			}
			action={
				<>
					{tick && (
						<div className={`w-6 aspect-square rounded-full flex items-center justify-center`}>
							<Icons.Tick fill="#40C174" className="w-6 h-6" />
						</div>
					)}
				</>
			}
		/>
	);
};

const QuestionItems = ({ question }: { question: ApiOnboardingItem }) => {
	const dispatch = useAppDispatch();
	const selectAnswer = useSelector((state) => selectAnswerByQuestionId(state, question.id as string));
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const currentClanId = useSelector(selectCurrentClanId);
	const handleOnClickQuestion = (index: number) => {
		dispatch(
			onboardingActions.doAnswer({
				answer: index,
				idQuestion: question.id as string
			})
		);

		dispatch(
			onboardingActions.setAnswerByClanId({
				clanId: currentClanId as string,
				answerState: {
					clanIdQuestionIdAndIndex: `${currentClanId}-${question.id}-${index}`
				}
			})
		);
	};
	return (
		<div className="w-full p-4 flex flex-col gap-2 bg-white dark:bg-transparent">
			<p className="text-theme-primary-active font-semibold" data-e2e={generateE2eId('onboarding.clan_guide_page.question')}>
				{question.title}
			</p>
			<div className="flex flex-wrap gap-2 flex-1">
				{question.answers &&
					question.answers.map((answer, index) => {
						const isActive = selectAnswer.includes(index) || hoveredIndex === index;
						return (
							<GuideItemLayout
								key={`${question.id}-${index}`}
								icon={answer.emoji}
								description={<span className="">{answer.description}</span>}
								title={answer.title}
								height={'h-auto'}
								onClick={() => handleOnClickQuestion(index)}
								onMouseEnter={() => setHoveredIndex(index)}
								onMouseLeave={() => setHoveredIndex(null)}
								noNeedHover
								className={`w-fit h-fit rounded-xl justify-center items-center px-4 py-2 border-2 cursor-pointer font-medium flex gap-2 transition-colors ${
									isActive
										? 'bg-item-theme text-theme-primary-active border-theme-primary'
										: 'bg-white dark:bg-transparent text-theme-primary border-gray-200 dark:border-gray-700'
								}`}
							/>
						);
					})}
			</div>
		</div>
	);
};

export default GuideBody;
