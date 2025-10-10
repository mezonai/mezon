import {
	EGuideType,
	onboardingActions,
	selectCurrentClanId,
	selectFormOnboarding,
	selectOnboardingByClan,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { ApiOnboardingItem, OnboardingAnswer } from 'mezon-js/api.gen';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from 'react-modal-hook';
import { useSelector } from 'react-redux';
import { EOnboardingStep } from '..';
import GuideItemLayout from '../GuideItemLayout';
import ModalControlRule, { ControlInput } from '../ModalControlRule';

interface IQuestionsProps {
	handleGoToPage: (page: EOnboardingStep) => void;
	setOpenModalSaveChanges?: (isOpen: boolean) => void;
}

const Questions = ({ handleGoToPage, setOpenModalSaveChanges }: IQuestionsProps) => {
	const { t } = useTranslation('onBoardingClan');
	const [showChannelNotAssigned, setShowChannelNotAssigned] = useState(false);

	const toggleChannelNotAssigned = () => {
		setShowChannelNotAssigned(!showChannelNotAssigned);
	};

	const formOnboarding = useSelector(selectFormOnboarding);

	const dispatch = useAppDispatch();
	const handleAddPreJoinQuestion = () => {
		dispatch(
			onboardingActions.addQuestion({
				data: {
					answers: [],
					title: '',
					guide_type: EGuideType.QUESTION
				}
			})
		);
	};

	const currentClanId = useSelector(selectCurrentClanId);
	const onboardingByClan = useAppSelector((state) => selectOnboardingByClan(state, currentClanId as string));

	const checkQuestionValid = useMemo(() => formOnboarding.questions.some((question) => question.title), [formOnboarding.questions]);

	useEffect(() => {
		setOpenModalSaveChanges && setOpenModalSaveChanges(checkQuestionValid);
	}, [checkQuestionValid, setOpenModalSaveChanges]);

	return (
		<div className="flex flex-col gap-8">
			<div onClick={() => handleGoToPage(EOnboardingStep.MAIN)} className="flex gap-3 cursor-pointer">
				<Icons.LongArrowRight className="rotate-180 w-3 text-theme-primary" />
				<div className="font-semibold text-theme-primary">{t('buttons.back').toUpperCase()}</div>
			</div>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<div className="text-[20px] text-theme-primary font-semibold">{t('questionsPage.title')}</div>
					<div className="font-medium text-theme-primary">{t('questionsPage.description')}</div>
				</div>
				<div>
					<div
						className={`flex items-center justify-between gap-2 bg-theme-setting-nav py-3 px-4 ${showChannelNotAssigned ? 'rounded-t-xl' : 'rounded-xl'}`}
					>
						<div className="text-[12px] font-semibold text-theme-primary-active">{t('questionsPage.noChannelsMissing')}</div>
						<div className="flex items-center gap-3">
							<div className="w-[120px] h-[6px] bg-gray-200 dark:bg-[#3b3d44] rounded-lg flex justify-start">
								<div className="w-[70%] h-full rounded-lg bg-green-600" />
							</div>
							<div onClick={toggleChannelNotAssigned}>
								<Icons.ArrowRight defaultSize={`${showChannelNotAssigned ? 'rotate-90' : '-rotate-90'} w-6 duration-200`} />
							</div>
						</div>
					</div>
					{showChannelNotAssigned && (
						<div className="bg-theme-setting-primary px-4 py-3 rounded-b-xl flex flex-col gap-5 duration-200 border border-gray-200 dark:border-transparent border-t-0">
							<div className="uppercase font-semibold text-theme-primary-active">{t('questionsPage.channelNotAssigned')}</div>
							<div className="tex-[12px] font-medium text-gray-600 dark:text-channelTextLabel">{t('questionsPage.noChannelsHere')}</div>
						</div>
					)}
				</div>
				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-2 cursor-pointer">
						<div className="text-[16px] text-theme-primary-active font-bold">{t('questionsPage.preJoinQuestions.title')}</div>
						<div className="text-theme-primary">{t('questionsPage.preJoinQuestions.description')}</div>
						{onboardingByClan.question.map((question, index) => (
							<QuestionItem key={question.id} question={question} index={index} />
						))}
						{formOnboarding.questions.map((question, index) => (
							<QuestionItem key={index} question={question} index={index + onboardingByClan.question.length} tempId={index} />
						))}
						<div
							onClick={handleAddPreJoinQuestion}
							className="rounded-xl text-indigo-500 dark:text-[#949cf7] justify-center items-center p-4 border-2 border-gray-300 dark:border-[#4e5058] border-dashed font-medium flex gap-2 hover:border-indigo-400 dark:hover:border-[#7d808c] transition-colors"
						>
							<Icons.CirclePlusFill className="w-5" />
							<div>{t('questionsPage.addQuestion')}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const QuestionItem = ({ question, index, tempId }: { question: ApiOnboardingItem; index: number; tempId?: number }) => {
	const { t } = useTranslation('onBoardingClan');
	const [titleQuestion, setTitleQuestion] = useState(question?.title || '');
	const [answers, setAnswer] = useState<OnboardingAnswer[]>(question?.answers || []);
	const [indexEditAnswer, setIndexEditAnswer] = useState<number | undefined>(undefined);
	const [error, setError] = useState('');
	const dispatch = useAppDispatch();

	const handleAddAnswers = (answer: OnboardingAnswer, _edit?: number) => {
		if (indexEditAnswer !== undefined) {
			const listAnswers = [...answers];
			listAnswers[indexEditAnswer] = answer;
			setAnswer(listAnswers);
			handleCloseEditAnswer();
			return;
		}
		setAnswer([...answers, answer]);
	};

	const handleRemoveAnswer = () => {
		if (indexEditAnswer !== undefined) {
			const newAnswers = [...answers];
			newAnswers.splice(indexEditAnswer, 1);
			setAnswer(newAnswers);
			if (question.id) {
				dispatch(
					onboardingActions.editOnboarding({
						clan_id: question.clan_id as string,
						idOnboarding: question.id as string,
						content: {
							...question,
							title: titleQuestion,
							answers: newAnswers,
							task_type: EGuideType.QUESTION
						}
					})
				);
			}
		}
		handleCloseEditAnswer();
	};

	const handleCloseEditAnswer = () => {
		closeAnswerPopup();
		setIndexEditAnswer(undefined);
	};
	const [openAnswerPopup, closeAnswerPopup] = useModal(
		() => (
			<ModalAddAnswer
				closeAnswerPopup={closeAnswerPopup}
				handleRemove={handleRemoveAnswer}
				editValue={indexEditAnswer !== undefined ? answers[indexEditAnswer] : undefined}
				setAnswer={handleAddAnswers}
				titleQuestion={titleQuestion}
				index={index}
			/>
		),
		[titleQuestion, answers.length, indexEditAnswer]
	);

	const openPopupAnswer = useCallback(() => {
		setIndexEditAnswer(undefined);
		openAnswerPopup();
	}, [openAnswerPopup]);

	useEffect(() => {
		if (indexEditAnswer !== undefined) {
			openAnswerPopup();
		}
	}, [indexEditAnswer, openAnswerPopup]);

	const handleOpenEditAnswer = (index: number) => {
		setIndexEditAnswer(index);
	};
	const [isExpanded, setIsExpanded] = useState(question ? false : true);

	const handleQuestionOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTitleQuestion(e.target.value);
	};

	const toggleExpand = () => {
		setIsExpanded(!isExpanded);
	};

	const handleAddQuestion = () => {
		if (!titleQuestion) {
			setError(t('errors.questionRequired'));
			return;
		}
		setError('');
		toggleExpand();
		if (tempId !== undefined) {
			dispatch(
				onboardingActions.addQuestion({
					data: {
						title: titleQuestion,
						answers,
						guide_type: EGuideType.QUESTION
					},
					update: tempId
				})
			);
			return;
		}
		dispatch(
			onboardingActions.editOnboarding({
				clan_id: question.clan_id as string,
				idOnboarding: question.id as string,
				content: {
					...question,
					title: titleQuestion,
					answers,
					task_type: EGuideType.QUESTION
				}
			})
		);
	};

	const handleRemoveQuestion = () => {
		if (tempId !== undefined) {
			dispatch(
				onboardingActions.removeTempTask({
					idTask: tempId,
					type: EGuideType.QUESTION
				})
			);
			return;
		}
		if (question.id) {
			dispatch(
				onboardingActions.removeOnboardingTask({
					idTask: question.id,
					type: EGuideType.QUESTION,
					clan_id: question.clan_id as string
				})
			);
		}
	};

	const handleOpenWrap = () => {
		if (!isExpanded) {
			setIsExpanded(true);
		}
	};

	return (
		<div
			className="flex flex-col gap-6 bg-white dark:bg-bgSecondary p-4 rounded-lg border border-gray-200 dark:border-transparent"
			onClick={handleOpenWrap}
		>
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center">
					<div className="uppercase text-xs font-medium text-gray-700 dark:text-channelTextLabel">
						{t('questionsPage.questionNumber', { number: index + 1 })}
					</div>
					<div className="flex gap-2 items-center">
						<div onClick={handleRemoveQuestion} className="text-gray-500 dark:text-white hover:text-red-500 dark:hover:text-red-400">
							<Icons.TrashIcon className="w-4" />
						</div>
						<div onClick={toggleExpand} className="text-gray-500 dark:text-white hover:text-gray-700 dark:hover:text-gray-300">
							<Icons.ArrowRight defaultSize={`${isExpanded ? 'rotate-90' : '-rotate-90'} w-4`} />
						</div>
					</div>
				</div>
				{isExpanded ? (
					<>
						<input
							className="text-[20px] bg-gray-100 dark:bg-bgTertiary text-gray-800 dark:text-white font-semibold outline-none focus:outline-indigo-500 dark:focus:outline-blue-500 rounded-lg p-[10px]"
							type="text"
							placeholder={t('questionsPage.enterQuestion')}
							value={titleQuestion}
							onChange={handleQuestionOnchange}
						/>
						{error && <p className="text-red-500">{error}</p>}
					</>
				) : (
					<div className="text-gray-800 dark:text-white text-xl font-semibold truncate">{titleQuestion}</div>
				)}
			</div>
			{isExpanded && (
				<>
					<div className="flex flex-col gap-2">
						<div className="text-gray-700 dark:text-channelTextLabel">
							{t('questionsPage.availableAnswers', { count: answers.length })}
						</div>
						<div className="flex gap-1 gap-y-2 flex-wrap">
							{answers.map((answer, index) => (
								<GuideItemLayout
									onClick={() => handleOpenEditAnswer(index)}
									key={answer.title}
									icon={answer.emoji}
									description={answer.description}
									title={answer.title}
									className={`w-fit min-h-6 rounded-xl hover:bg-transparent text-gray-800 dark:text-white justify-center items-center p-4 border-2 border-gray-300 dark:border-[#4e5058] hover:border-indigo-400 dark:hover:border-[#7d808c] font-medium flex gap-2 ${answer.description ? 'py-2' : ''}`}
								/>
							))}
							<GuideItemLayout
								onClick={openPopupAnswer}
								icon={<Icons.CirclePlusFill className="w-5" />}
								title={t('questionsPage.addAnswer')}
								className="w-fit hover:bg-transparent rounded-xl text-gray-800 dark:text-white justify-center items-center p-4 border-2 border-gray-300 dark:border-[#4e5058] hover:border-indigo-400 dark:hover:border-[#7d808c] border-dashed font-medium flex gap-2"
							/>
						</div>
					</div>
					<div className="flex justify-end">
						<div
							className="rounded-md w-28 h-9 bg-indigo-500 hover:bg-indigo-600 dark:bg-primary dark:hover:bg-blue-600 text-white flex items-center font-semibold justify-center transition-colors cursor-pointer"
							onClick={handleAddQuestion}
						>
							{t('buttons.save')}
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default Questions;
type ModalAddAnswerProp = {
	closeAnswerPopup: () => void;
	setAnswer: (answers: OnboardingAnswer, edit?: number) => void;
	titleQuestion: string;
	index: number;
	editValue?: OnboardingAnswer;
	handleRemove?: () => void;
};
const ModalAddAnswer = ({ closeAnswerPopup, index, setAnswer, titleQuestion, editValue, handleRemove }: ModalAddAnswerProp) => {
	const { t } = useTranslation('onBoardingClan');
	const [titleAnswer, setTitleAnswer] = useState(editValue?.title || '');
	const [answerDescription, setAnswerDescription] = useState(editValue?.description || '');

	const handleChangeTitleAnswer = (e: ChangeEvent<HTMLInputElement>) => {
		setTitleAnswer(e.target.value);
	};

	const handleChangeTitleDescription = (e: ChangeEvent<HTMLInputElement>) => {
		setAnswerDescription(e.target.value);
	};

	const handleSaveAnswer = () => {
		setAnswer({ title: titleAnswer, description: answerDescription }, editValue ? index : undefined);
		setTitleAnswer('');
		setAnswerDescription('');
		closeAnswerPopup();
	};
	const handleRemoveAnswer = () => {
		if (handleRemove) {
			handleRemove();
		}
	};
	return (
		<ModalControlRule
			bottomLeftBtn={t('questionsPage.remove')}
			bottomLeftBtnFunction={handleRemoveAnswer}
			onClose={closeAnswerPopup}
			onSave={handleSaveAnswer}
		>
			<>
				<div className="absolute top-5 flex flex-col gap-2 w-[400px] ">
					<div className="uppercase text-xs font-medium ">{t('questionsPage.questionNumber', { number: index + 1 })}</div>
					<div className="text-xl  font-semibold truncate">{titleQuestion || t('questionsPage.questionPlaceholder')} ?</div>
				</div>
				<div className="pb-5 pt-10 flex flex-col gap-2">
					<ControlInput
						title={t('questionsPage.answerTitle')}
						message={t('questionsPage.titleRequired')}
						onChange={handleChangeTitleAnswer}
						value={titleAnswer}
						placeholder={t('questionsPage.enterAnswer')}
						required
					/>
					<ControlInput
						title={t('questionsPage.answerDescription')}
						onChange={handleChangeTitleDescription}
						value={answerDescription}
						placeholder={t('questionsPage.enterDescription')}
					/>
				</div>
			</>
		</ModalControlRule>
	);
};
