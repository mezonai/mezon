import { MemberProvider } from '@mezon/core';
import { onboardingActions, selectCurrentClanId, selectCurrentClanIsOnboarding, selectFormOnboarding, useAppDispatch } from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { Snowflake } from '@theinternetfolks/snowflake';
import type { ApiOnboardingContent } from 'mezon-js/api.gen';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import EnableOnboarding from '../../EnableOnboarding';
import ModalSaveChanges from '../ClanSettingOverview/ModalSaveChanges';
import GuideItemLayout from './GuideItemLayout';
import ClanGuideSetting from './Mission/ClanGuideSetting';
import Questions from './Questions/Questions';

export enum EOnboardingStep {
	QUESTION,
	MISSION,
	MAIN
}
const SettingOnBoarding = ({ onClose }: { onClose?: () => void }) => {
	const { t } = useTranslation('onBoardingClan');
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const currentClanIsOnboarding = useSelector(selectCurrentClanIsOnboarding);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isCommunityEnabled, setIsCommunityEnabled] = useState(!!currentClanIsOnboarding);
	const [currentPage, setCurrentPage] = useState<EOnboardingStep>(EOnboardingStep.MAIN);
	const [description, setDescription] = useState('');
	const [about, setAbout] = useState('');
	const [openModalSaveChanges, setOpenModalSaveChanges] = useState(false);
	const [initialDescription, setInitialDescription] = useState('');
	const [initialAbout, setInitialAbout] = useState('');
	const [showOnboardingHighlight, setShowOnboardingHighlight] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	const handleEnableCommunity = () => {
		setIsModalOpen(true);
	};

	const toggleEnableStatus = (enable: boolean) => {
		if (!enable) {
			dispatch(
				onboardingActions.enableOnboarding({
					clan_id: currentClanId as string,
					onboarding: false
				})
			);
			setIsCommunityEnabled(false);
		}
	};

	const handleConfirm = async () => {
		setIsSaving(true);
		try {
			if (!checkCreateValidate) {
				toast.error(t('errors.needAtLeastOneItem'));
				setShowOnboardingHighlight(true);
				setTimeout(() => setShowOnboardingHighlight(false), 2000);
				return;
			}
			await handleCreateOnboarding();
			await dispatch(
				onboardingActions.enableOnboarding({
					clan_id: currentClanId as string,
					onboarding: true
				})
			);
			setIsCommunityEnabled(true);
			setIsModalOpen(false);
			setInitialDescription(description);
			setInitialAbout(about);
			setOpenModalSaveChanges(false);
			toast.success(t('messages.communityEnabledSuccess'));
		} catch (error) {
			console.error('Error enabling community:', error);
			toast.error(t('errors.failedToEnableCommunity'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleGoToPage = (page: EOnboardingStep) => {
		setCurrentPage(page);
	};

	const formOnboarding = useSelector(selectFormOnboarding);
	const { sessionRef, clientRef } = useMezon();

	const handleCreateOnboarding = async () => {
		setIsSaving(true);
		try {
			const uploadImageRule = formOnboarding.rules.map((item) => {
				if (!item.file) {
					return undefined;
				}
				const id = Snowflake.generate();
				const path = `onboarding/${id}.webp`;
				if (clientRef.current && sessionRef.current) {
					return handleUploadEmoticon(clientRef.current, sessionRef.current, path, item.file);
				}
				return undefined;
			});
			const imageUrl = await Promise.all(uploadImageRule);

			const formOnboardingRule = formOnboarding.rules.map((rule, index) => {
				const ruleItem: ApiOnboardingContent = {
					title: rule.title,
					content: rule.content,
					guide_type: rule.guide_type
				};
				if (imageUrl[index]) {
					ruleItem.image_url = imageUrl[index]?.url;
				}
				return ruleItem;
			});

			const formOnboardingData = [...formOnboarding.questions, ...formOnboardingRule, ...formOnboarding.task];

			if (formOnboarding.greeting) {
				formOnboardingData.unshift(formOnboarding.greeting);
			}

			await dispatch(
				onboardingActions.createOnboardingTask({
					clan_id: currentClanId as string,
					content: formOnboardingData
				})
			);

			setInitialDescription(description);
			setInitialAbout(about);
			setOpenModalSaveChanges(false);
			toast.success(t('messages.changesSavedSuccess'));
		} catch (error) {
			console.error('Error saving changes:', error);
			toast.error(t('errors.failedToSaveChanges'));
		} finally {
			setIsSaving(false);
		}
	};

	const checkCreateValidate = useMemo(() => {
		return formOnboarding.questions.length > 0 || formOnboarding.rules.length > 0 || formOnboarding.task.length > 0;
	}, [formOnboarding]);

	const handleResetOnboarding = () => {
		dispatch(onboardingActions.resetOnboarding({}));
		setOpenModalSaveChanges(false);
		setDescription(initialDescription);
		setAbout(initialAbout);
	};

	const isDescriptionOrAboutChanged = useMemo(() => {
		return description !== initialDescription || about !== initialAbout;
	}, [description, about, initialDescription, initialAbout]);

	const renderOnboardingContent = () => (
		<div className="text-theme-primary text-sm">
			{currentPage === EOnboardingStep.MAIN && (
				<MainIndex handleGoToPage={handleGoToPage} onCloseSetting={onClose} showOnboardingHighlight={showOnboardingHighlight} />
			)}
			{currentPage === EOnboardingStep.QUESTION && (
				<Questions handleGoToPage={handleGoToPage} setOpenModalSaveChanges={setOpenModalSaveChanges} />
			)}
			{currentPage === EOnboardingStep.MISSION && (
				<MemberProvider>
					<div className="flex flex-col gap-8">
						<div onClick={() => handleGoToPage(EOnboardingStep.MAIN)} className="flex gap-3 cursor-pointer">
							<Icons.LongArrowRight className="rotate-180 w-3 text-theme-primary" />
							<div className="font-semibold text-theme-primary">{t('buttons.back')}</div>
						</div>
						<ClanGuideSetting setOpenModalSaveChanges={setOpenModalSaveChanges} />
					</div>
				</MemberProvider>
			)}
		</div>
	);

	if (!isCommunityEnabled) {
		return (
			<>
				<EnableOnboarding onEnable={handleEnableCommunity} />
				{isModalOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-theme-setting-primary p-6 rounded-lg w-[800px] max-h-[80vh] overflow-y-auto scrollbar-thin  [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[#5865F2] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-track]:bg-gray-200">
							<div className="flex justify-between items-center mb-6">
								<h3 className="text-xl font-semibold text-theme-primary-active">{t('modal.title')}</h3>
								<button onClick={() => setIsModalOpen(false)} className=" text-theme-primary text-theme-primary-hover ">
									<Icons.CloseIcon className="w-6 h-6" />
								</button>
							</div>
							{renderOnboardingContent()}
							<div className="flex justify-end gap-4 mt-6">
								<button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:underline" disabled={isSaving}>
									{t('buttons.cancel')}
								</button>
								<button
									onClick={handleConfirm}
									className="px-4 py-2 rounded-lg btn-primary btn-primary-hover flex items-center justify-center min-w-[100px]"
									disabled={isSaving}
								>
									{isSaving ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
											{t('buttons.saving')}
										</>
									) : (
										t('buttons.confirm')
									)}
								</button>
							</div>
						</div>
					</div>
				)}
			</>
		);
	}

	return (
		<>
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-theme-setting-primary p-6 rounded-lg w-[800px] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-xl font-semibold text-theme-primary">{t('modal.title')}</h3>
							<button onClick={() => setIsModalOpen(false)} className=" bg-item-theme hover:text-white">
								<Icons.CloseIcon className="w-6 h-6" />
							</button>
						</div>
						{renderOnboardingContent()}
						<div className="flex justify-end gap-4 mt-6">
							<button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:underline" disabled={isSaving}>
								{t('buttons.cancel')}
							</button>
							<button
								onClick={handleConfirm}
								className="px-4 py-2 rounded-lg btn-primary btn-primary-hover flex items-center justify-center min-w-[100px]"
								disabled={isSaving}
							>
								{isSaving ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
										{t('buttons.saving')}
									</>
								) : (
									t('buttons.confirm')
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{isCommunityEnabled && (
				<div className="text-theme-primary text-sm pb-10">
					<div className="flex items-center justify-between p-4 bg-theme-setting-primary rounded-lg mb-6">
						<div className="flex flex-col">
							<h3 className="text-lg font-semibold text-theme-primary">{t('onboarding.title')}</h3>
							<p className="text-sm text-theme-primary">{t('onboarding.featuresEnabled')}</p>
						</div>
						<button
							onClick={() => toggleEnableStatus(false)}
							className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
						>
							{t('buttons.disable')}
						</button>
					</div>
					{renderOnboardingContent()}
					{!isModalOpen && openModalSaveChanges && (isDescriptionOrAboutChanged || checkCreateValidate) && (
						<ModalSaveChanges onSave={handleCreateOnboarding} onReset={handleResetOnboarding} isLoading={isSaving} />
					)}
				</div>
			)}
		</>
	);
};

interface IMainIndexProps {
	handleGoToPage: (page: EOnboardingStep) => void;
	onCloseSetting?: () => void;
	showOnboardingHighlight?: boolean;
}

const MainIndex = ({ handleGoToPage, onCloseSetting, showOnboardingHighlight }: IMainIndexProps) => {
	const { t } = useTranslation('onBoardingClan');
	const currentClanId = useSelector(selectCurrentClanId);
	const dispatch = useAppDispatch();
	const openOnboardingPreviewMode = () => {
		dispatch(
			onboardingActions.openOnboardingPreviewMode({
				clan_id: currentClanId || ''
			})
		);
		if (onCloseSetting) {
			onCloseSetting();
		}
	};

	return (
		<div className="flex flex-col gap-6 flex-1">
			<div className="flex flex-col gap-2">
				<div className="text-[20px] text-theme-primary-active font-semibold">{t('onboarding.title')}</div>
				<div className="font-medium text-theme-primary">
					{t('onboarding.description')}
					<p className="ml-3 inline-block cursor-pointer text-blue-500 hover:underline" onClick={openOnboardingPreviewMode}>
						{t('buttons.preview')}
					</p>
				</div>
			</div>

			<div className="text-theme-primary">
				<GuideItemLayout
					title={t('onboarding.enabledTitle')}
					description={t('onboarding.enabledDescription')}
					className=" bg-theme-setting-nav rounded-none rounded-t-lg "
					noNeedHover
				/>

				<div className="mx-4 border-t border-theme-primary text-theme-primary-hover" />

				<GuideItemLayout
					hightLightIcon
					icon={<Icons.People className="w-6 text-theme-primary" />}
					title={t('questions.title')}
					description={t('questions.description')}
					className={` rounded-none ${showOnboardingHighlight ? 'border-2 border-red-500' : ''}`}
					action={
						<div
							onClick={() => handleGoToPage(EOnboardingStep.QUESTION)}
							className="px-3 py-2 flex gap-2 justify-center items-center rounded-lg btn-primary btn-primary-hover  cursor-pointer"
						>
							<div>{t('buttons.setup')}</div> <Icons.LongArrowRight className="w-3" />
						</div>
					}
				/>
				<div className="mx-4 border-t border-theme-primary text-theme-primary-hover" />
				<GuideItemLayout
					hightLightIcon
					icon={<Icons.GuideIcon defaultSize="w-6  " className="text-theme-primary" />}
					title={t('clanGuide.title')}
					description={t('clanGuide.description')}
					className={` rounded-none ${showOnboardingHighlight ? 'border-2 border-red-500' : ''}`}
					action={
						<div className="flex items-center gap-4">
							<div
								className="w-[60px] h-[32px] flex justify-center items-center rounded-lg border-theme-primary bg-secondary-button-hover  cursor-pointer"
								onClick={() => handleGoToPage(EOnboardingStep.MISSION)}
								data-e2e={generateE2eId('clan_page.settings.onboarding.button.clan_guide')}
							>
								{t('buttons.edit')}
							</div>
						</div>
					}
				/>
			</div>
		</div>
	);
};

export default SettingOnBoarding;
