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
import { DONE_ONBOARDING_STATUS, titleMission } from '@mezon/utils';
import type { ApiOnboardingItem } from 'mezon-js/api.gen';
import { useCallback, useEffect, useMemo } from 'react';
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

	const handleDoMission = useCallback(
		(mission: ApiOnboardingItem, index: number) => {
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
		},
		[missionSum]
	);

	const doneAllMission = (indexMision: number) => {
		if (indexMision + 1 === missionSum) {
			dispatch(onboardingActions.doneOnboarding({ clan_id: currentClanId as string }));
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
		dispatch(fetchOnboarding({ clan_id: currentClanId as string }));
	}, []);

	return (
		<div className="w-full h-full pt-4 ">
			<div className="flex gap-6">
				<div className="flex-1 flex flex-col gap-2">
					<div className="flex flex-col gap-2">
						<p className="p-2 text-xl font-bold ">{t('guide.questions')}</p>
						<div className=" flex flex-col gap-2 rounded-lg relative shadow-sm dark:shadow-none">
							{onboardingItem?.question.length > 0 ? (
								<>
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
								</>
							) : (
								<>
									{(!onboadingMode || (onboadingMode && formOnboarding?.questions?.length === 0)) && (
										<div className="flex gap-2 h-20 p-4 w-full text-lg items-center font-semibold justify-between bg-item-theme rounded-lg shadow-sm">
											{t('guide.noQuestions')}
										</div>
									)}
								</>
							)}
						</div>
					</div>
					<div className="flex flex-col gap-2">
						<p className="p-2 text-xl font-bold ">{t('guide.resources')}</p>
						{onboardingItem?.rule?.length > 0 ? (
							onboardingItem.rule.map((rule) => (
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
						) : (
							<>
								{(!onboadingMode || (onboadingMode && formOnboarding?.rules?.length === 0)) && (
									<div className="flex gap-2 h-20 p-4 w-full text-lg items-center  font-semibold justify-between  rounded-lg shadow-sm bg-item-theme">
										{t('guide.noRules')}
									</div>
								)}
							</>
						)}
						{onboadingMode &&
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

					<div className="flex flex-col gap-2">
						<p className="p-2 text-xl font-bold ">{t('guide.missions')} </p>
						{onboardingItem?.mission?.length > 0 ? (
							onboardingItem.mission.map((mission, index) => (
								<GuideItemMission
									key={mission.id}
									mission={mission}
									onClick={() => handleDoMission(mission, index)}
									tick={missionDone > index || selectUserProcessing?.onboarding_step === DONE_ONBOARDING_STATUS}
								/>
							))
						) : (
							<>
								{(!onboadingMode || (onboadingMode && formOnboarding?.task?.length === 0)) && (
									<div className="flex gap-2 h-20 p-4 w-full text-lg items-center  font-semibold justify-between  rounded-lg shadow-sm bg-item-theme">
										{t('guide.noMissions')}
									</div>
								)}
							</>
						)}
						{onboadingMode &&
							formOnboarding?.task?.length > 0 &&
							formOnboarding.task.map((mission, index) => (
								<GuideItemMission key={mission.title} mission={mission} onClick={() => handleDoMission(mission, index)} tick={true} />
							))}
					</div>
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
			icon={<Icons.TargetIcon defaultSize="w-6 h-6 " />}
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
							<Icons.Tick fill="#40C174" defaultSize="w-6 h-6" />
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
	const hightLight = useCallback(
		(index: number) => {
			if (selectAnswer.includes(index)) {
				return 'bg-blue-50 dark:bg-bgSurface hover:border-blue-200 dark:hover:border-bgSurface hover:bg-blue-100 dark:hover:bg-[#212121] text-blue-700 dark:text-primary hover:border-gray-400 dark:hover:border-white border-blue-500 dark:border-channelActiveColor';
			}
			return;
		},
		[selectAnswer.length]
	);
	return (
		<div className="w-full p-4 flex flex-col gap-2 bg-white dark:bg-transparent">
			<p className="text-blue-600 dark:text-channelActiveColor font-semibold">{question.title}</p>
			<div className="flex flex-wrap gap-2 flex-1">
				{question.answers &&
					question.answers.map((answer, index) => (
						<GuideItemLayout
							key={answer.title}
							icon={answer.emoji}
							description={<span className="">{answer.description}</span>}
							title={answer.title}
							height={'h-auto'}
							onClick={() => handleOnClickQuestion(index)}
							className={` w-fit h-fit rounded-xl hover:bg-transparent  justify-center items-center px-4 py-2 border-2 border-gray-200 dark:border-[#4e5058] hover:border-gray-400 dark:hover:border-[#7d808c] font-medium flex gap-2 ${hightLight(index)}`}
							background="bg-white dark:bg-transparent"
						/>
					))}
			</div>
		</div>
	);
};

export default GuideBody;
