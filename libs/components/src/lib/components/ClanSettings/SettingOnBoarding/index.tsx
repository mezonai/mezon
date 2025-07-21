import { MemberProvider } from '@mezon/core';
import { onboardingActions, selectCurrentClan, selectCurrentClanId, selectFormOnboarding, useAppDispatch } from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { Button, Icons, Image } from '@mezon/ui';
import { Snowflake } from '@theinternetfolks/snowflake';
import { ClanUpdatedEvent } from 'mezon-js';
import { ApiOnboardingContent } from 'mezon-js/api.gen';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ModalLayout } from '../../../components';
import EnableCommunity from '../../EnableComnunity';
import ModalSaveChanges from '../ClanSettingOverview/ModalSaveChanges';
import GuideItemLayout from './GuideItemLayout';
import ClanGuideSetting from './Mission/ClanGuideSetting';
import ModalBanner from './ModalEditBanner';
import Questions from './Questions/Questions';

export enum EOnboardingStep {
	QUESTION,
	MISSION,
	MAIN
}
const SettingOnBoarding = ({ onClose }: { onClose?: () => void }) => {
	const dispatch = useAppDispatch();
	const currentClan = useSelector(selectCurrentClan);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isCommunityEnabled, setIsCommunityEnabled] = useState(!!currentClan?.is_onboarding);
	const [currentPage, setCurrentPage] = useState<EOnboardingStep>(EOnboardingStep.MAIN);
	const [description, setDescription] = useState('');
	const [about, setAbout] = useState('');
	const [openModalSaveChanges, setOpenModalSaveChanges] = useState(false);

	const [initialDescription, setInitialDescription] = useState('');
	const [initialAbout, setInitialAbout] = useState('');
	const [showOnboardingHighlight, setShowOnboardingHighlight] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showModalBanner, setShowModalBanner] = useState(false);
	const [editBanner, setEditBanner] = useState<ClanUpdatedEvent | null>(null);
	const [bannerPreview, setBannerPreview] = useState<string | null>(currentClan?.onboarding_banner ?? null);
	const handleEnableCommunity = () => {
		setIsModalOpen(true);
	};

	const toggleEnableStatus = (enable: boolean) => {
		if (!enable) {
			dispatch(
				onboardingActions.enableOnboarding({
					clan_id: currentClan?.clan_id as string,
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
				toast.error('You need to create at least one task, question, or rule before enabling the community.!');
				setShowOnboardingHighlight(true);
				setTimeout(() => setShowOnboardingHighlight(false), 2000);
				return;
			}
			await handleCreateOnboarding();
			await dispatch(
				onboardingActions.enableOnboarding({
					clan_id: currentClan?.clan_id as string,
					onboarding: true
				})
			);
			setIsCommunityEnabled(true);
			setIsModalOpen(false);
			setInitialDescription(description);
			setInitialAbout(about);
			setOpenModalSaveChanges(false);
			toast.success('Community enabled successfully!');
		} catch (error) {
			console.error('Error enabling community:', error);
			toast.error('Failed to enable community. Please try again.');
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
				const path = 'onboarding/' + id + '.webp';
				if (clientRef.current && sessionRef.current) {
					return handleUploadEmoticon(clientRef.current, sessionRef.current, path, item.file);
				}
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
					clan_id: currentClan?.clan_id as string,
					content: formOnboardingData
				})
			);

			setInitialDescription(description);
			setInitialAbout(about);
			setOpenModalSaveChanges(false);
			toast.success('Changes saved successfully!');
		} catch (error) {
			console.error('Error saving changes:', error);
			toast.error('Failed to save changes. Please try again.');
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
	const handleChangeDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setOpenModalSaveChanges(true);
		setDescription(e.target.value.slice(0, 300));
	};
	const handleChangeAbout = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setOpenModalSaveChanges(true);
		setAbout(e.target.value.slice(0, 300));
	};
	const handleOpenModalUpload = () => {
		setShowModalBanner(true);
	};
	const handleUploadBanner = async (file: File) => {
		const objectUrl = URL.createObjectURL(file);
		setBannerPreview(objectUrl); 
		setShowModalBanner(false); 
		console.log('Banner file:', file);
		setOpenModalSaveChanges(true);
	};
	const handleDeleteBanner = () => {
		setBannerPreview(null); 
		setOpenModalSaveChanges(true); 
	};
	const handleCloseModal = () => {
		setShowModalBanner(false);
	};
	const isDescriptionOrAboutChanged = useMemo(() => {
		return description !== initialDescription || about !== initialAbout;
	}, [description, about, initialDescription, initialAbout]);
	const isBannerChanged = useMemo(() => {
		return bannerPreview !== (currentClan?.onboarding_banner ?? null);
	}, [bannerPreview, currentClan?.onboarding_banner]);

	const renderOnboardingContent = () => (
		<div className="text-theme-primary text-sm">
			{currentPage === EOnboardingStep.MAIN && (
				<MainIndex
					handleGoToPage={handleGoToPage}
					isEnableOnBoarding={isCommunityEnabled}
					toggleEnableStatus={toggleEnableStatus}
					onCloseSetting={onClose}
					showOnboardingHighlight={showOnboardingHighlight}
				/>
			)}
			{currentPage === EOnboardingStep.QUESTION && <Questions handleGoToPage={handleGoToPage} />}
			{currentPage === EOnboardingStep.MISSION && (
				<MemberProvider>
					<div className="flex flex-col gap-8">
						<div onClick={() => handleGoToPage(EOnboardingStep.MAIN)} className="flex gap-3 cursor-pointer">
							<Icons.LongArrowRight className="rotate-180 w-3 text-theme-primary" />
							<div className="font-semibold text-theme-primary">BACK</div>
						</div>
						<ClanGuideSetting setOpenModalSaveChanges={setOpenModalSaveChanges} />
					</div>
				</MemberProvider>
			)}
			{/* upload banner */}
			{showModalBanner && (
				<ModalLayout onClose={handleCloseModal}>
					<ModalBanner
						// graphic={
						// 	bannerPreview
						// 		? { id: currentClan?.clan_id ?? '', source: bannerPreview }
						// 		: currentClan?.onboarding_banner
						// 			? { id: currentClan.clan_id, source: currentClan.onboarding_banner }
						// 			: undefined
						// }
						handleCloseModal={handleCloseModal}
						onUpload={handleUploadBanner}
					/>
				</ModalLayout>
			)}

			<div className="bg-theme-setting-nav p-4 rounded-lg mt-6">
				<h4 className="text-lg font-semibold text-theme-primary-active mb-2">Upload Banner</h4>
				{bannerPreview ? (
					<div className="flex flex-col gap-4">
						<Image
							src={bannerPreview}
							className="w-full max-w-md rounded-lg object-cover"
						/>
						<div className="flex gap-2">
							<Button
								className="px-2 btn-primary btn-primary-hover rounded-lg"
								onClick={handleOpenModalUpload}
							>
								Update Banner
							</Button>
							<Button
								className="px-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
								onClick={handleDeleteBanner}
							>
								Delete
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col items-start gap-2">
						<div
							onClick={handleOpenModalUpload}
							className="cursor-pointer group relative text-xs w-[116px] h-[140px] rounded-lg flex flex-col items-center p-3 border-[0.08px] border-dashed border-borderDivider justify-center"
						>
							<Icons.ImageUploadIcon className="w-7 h-7 group-hover:scale-110 ease-in-out duration-75" />
						</div>
						<Button
							className="px-2 btn-primary btn-primary-hover rounded-lg"
							onClick={handleOpenModalUpload}
						>
							Upload Banner
						</Button>
					</div>
				)}
			</div>



			{/* Description Section */}
			<div className="bg-theme-setting-nav p-4 rounded-lg mt-6 ">
				<h4 className="text-lg font-semibold text-theme-primary-active mb-2">Description</h4>
				<div className="relative">
					<textarea
						className="w-full h-32 bg-theme-setting-primary text-theme-primary rounded-md p-2 resize-none border border-theme-primary bg-theme-setting-primary focus-input"
						placeholder="Enter your clan description..."
						value={description}
						onChange={handleChangeDescription}
						maxLength={300}
					/>
					<div className="absolute bottom-2 right-2 text-sm text-theme-primary">{description.length}/300</div>
				</div>
			</div>

			{/* About Section */}
			<div className="bg-theme-setting-nav p-4 rounded-lg mt-6 ">
				<h4 className="text-lg font-semibold text-theme-primary-active mb-2">About</h4>
				<div className="relative">
					<textarea
						className="w-full h-32 bg-theme-setting-primary text-theme-primary rounded-md p-2 resize-none border border-theme-primary bg-theme-setting-primary focus-input"
						placeholder="Tell us about your clan..."
						value={about}
						onChange={handleChangeAbout}
						maxLength={300}
					/>
					<div className="absolute bottom-2 right-2 text-sm text-theme-primary">{about.length}/300</div>
				</div>
			</div>
		</div>
	);

	if (!isCommunityEnabled) {
		return (
			<>
				<EnableCommunity onEnable={handleEnableCommunity} />
				{isModalOpen && (
					<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
						<div className="bg-theme-setting-primary p-6 rounded-lg w-[800px] max-h-[80vh] overflow-y-auto scrollbar-thin  [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[#5865F2] [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-track]:bg-gray-200">
							<div className="flex justify-between items-center mb-6">
								<h3 className="text-xl font-semibold text-theme-primary-active">Community Settings</h3>
								<button onClick={() => setIsModalOpen(false)} className=" hover:text-white ">
									<Icons.CloseIcon className="w-6 h-6" />
								</button>
							</div>
							{renderOnboardingContent()}
							<div className="flex justify-end gap-4 mt-6">
								<button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:underline" disabled={isSaving}>
									Cancel
								</button>
								<button
									onClick={handleConfirm}
									className="px-4 py-2 rounded-lg btn-primary btn-primary-hover flex items-center justify-center min-w-[100px]"
									disabled={isSaving}
								>
									{isSaving ? (
										<>
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
											Saving...
										</>
									) : (
										'Confirm'
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
			{/* Onboarding Modal */}
			{isModalOpen && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-theme-setting-primary p-6 rounded-lg w-[800px] max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-xl font-semibold text-theme-primary">Community Settings</h3>
							<button onClick={() => setIsModalOpen(false)} className=" bg-item-theme hover:text-white">
								<Icons.CloseIcon className="w-6 h-6" />
							</button>
						</div>
						{renderOnboardingContent()}
						<div className="flex justify-end gap-4 mt-6">
							<button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md hover:underline" disabled={isSaving}>
								Cancel
							</button>
							<button
								onClick={handleConfirm}
								className="px-4 py-2 rounded-lg btn-primary btn-primary-hover flex items-center justify-center min-w-[100px]"
								disabled={isSaving}
							>
								{isSaving ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
										Saving...
									</>
								) : (
									'Confirm'
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Main Onboarding UI */}
			{isCommunityEnabled && (
				<div className="text-theme-primary text-sm pb-10">
					<div className="flex items-center justify-between p-4 bg-theme-setting-primary rounded-lg mb-6">
						<div className="flex flex-col">
							<h3 className="text-lg font-semibold text-theme-primary">Community Onboarding</h3>
							<p className="text-sm text-theme-primary">Community features are enabled</p>
						</div>
						<button
							onClick={() => toggleEnableStatus(false)}
							className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
						>
							Disable Community
						</button>
					</div>
					{renderOnboardingContent()}
					{!isModalOpen && openModalSaveChanges && (isDescriptionOrAboutChanged || checkCreateValidate ) && (
						<ModalSaveChanges onSave={handleCreateOnboarding} onReset={handleResetOnboarding} isLoading={isSaving} />
					)}
				</div>
			)}
		</>
	);
};

interface IMainIndexProps {
	isEnableOnBoarding: boolean;
	toggleEnableStatus: (enable: boolean) => void;
	handleGoToPage: (page: EOnboardingStep) => void;
	onCloseSetting?: () => void;
	showOnboardingHighlight?: boolean;
}

const MainIndex = ({ isEnableOnBoarding, toggleEnableStatus, handleGoToPage, onCloseSetting, showOnboardingHighlight }: IMainIndexProps) => {
	const dispatch = useAppDispatch();
	const openOnboardingPreviewMode = () => {
		dispatch(onboardingActions.openOnboardingPreviewMode());
		if (onCloseSetting) {
			onCloseSetting();
		}
	};
	const currentClanId = useSelector(selectCurrentClanId);

	useEffect(() => {
		dispatch(onboardingActions.fetchOnboarding({ clan_id: currentClanId as string }));
	}, []);

	return (
		<div className="flex flex-col gap-6 flex-1">
			<div className="flex flex-col gap-2">
				<div className="text-[20px] text-theme-primary-active font-semibold">On Boarding</div>
				<div className="font-medium text-theme-primary">
					Give your members a simple starting experience with custom channels, roles and first steps.
				</div>
				<div className="flex gap-2 items-center">
					<div className="cursor-pointer text-blue-500 hover:underline">See examples</div>
					<div className="w-1 h-1 rounded-full bg-item-theme" />
					<div className="cursor-pointer text-blue-500 hover:underline" onClick={openOnboardingPreviewMode}>
						Preview
					</div>
					<div className="w-1 h-1 rounded-full bg-item-theme" />
					<div className="cursor-pointer text-blue-500 hover:underline">Switch to Advanced Mode</div>
				</div>
			</div>
			<GuideItemLayout
				icon={
					<Image
						src={`assets/images/wumpus_addbba.svg`}
						width={40}
						height={40}
						className="aspect-square object-cover w-[40px] text-theme-primary bg-theme-setting-nav"
					/>
				}
				title="Recent Updates"
				description={
					<div className="font-medium text-sm text-theme-primary">
						<div>• You can now upload custom images for New-Member To-Dos and Resource Pages.</div>
						<div>• Added a custom description option for Resource pages</div>
					</div>
				}
			/>

			<div className="text-theme-primary">
				<GuideItemLayout
					title="Onboarding Is Enabled"
					description="Changes will not take effect until you save."
					className=" bg-theme-setting-nav rounded-none rounded-t-lg "
					noNeedHover
				/>

				<GuideItemLayout
					hightLightIcon
					icon={<Icons.HashIcon className="w-6 text--theme-primary" />}
					title="Default Channels"
					description="You have 7 Default Channels"
					className={` rounded-none ${showOnboardingHighlight ? 'border-2 border-red-500' : ''}`}
					action={
						<div className="w-[60px] h-[32px] flex justify-center items-center rounded-lg border-theme-primary bg-secondary-button-hover">
							Edit
						</div>
					}
				/>
				<div className="mx-4 border-t border-theme-primary text-theme-primary-hover" />

				<GuideItemLayout
					hightLightIcon
					icon={<Icons.People className="w-6 text-theme-primary" />}
					title="Questions"
					description="7 of 7 public channels are assignable through Questions and Default Channels."
					className={` rounded-none ${showOnboardingHighlight ? 'border-2 border-red-500' : ''}`}
					action={
						<div
							onClick={() => handleGoToPage(EOnboardingStep.QUESTION)}
							className="px-3 py-2 flex gap-2 justify-center items-center rounded-lg btn-primary btn-primary-hover  cursor-pointer"
						>
							<div>Set up</div> <Icons.LongArrowRight className="w-3" />
						</div>
					}
				/>
				<div className="mx-4 border-t border-theme-primary text-theme-primary-hover" />
				<GuideItemLayout
					hightLightIcon
					icon={<Icons.GuideIcon defaultSize="w-6  " className="text-theme-primary" />}
					title="Clan Guide"
					description="Your Welcome Message, Banner, To-Do tasks and Resources are all set up"
					className={` rounded-none ${showOnboardingHighlight ? 'border-2 border-red-500' : ''}`}
					action={
						<div className="flex items-center gap-4">
							<div
								className="w-[60px] h-[32px] flex justify-center items-center rounded-lg border-theme-primary bg-secondary-button-hover  cursor-pointer"
								onClick={() => handleGoToPage(EOnboardingStep.MISSION)}
							>
								Edit
							</div>
						</div>
					}
				/>
			</div>
		</div>
	);
};

export default SettingOnBoarding;
