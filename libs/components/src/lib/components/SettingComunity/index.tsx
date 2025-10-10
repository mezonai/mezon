import React from 'react';

import {
	comunityActions,
	selectCommunityBanner,
	selectComunityAbout,
	selectComunityError,
	selectComunityLoading,
	selectComunityShortUrl,
	selectIsCommunityEnabled,
	useAppDispatch,
	useAppSelector
} from '@mezon/store';
import { handleUploadEmoticon, useMezon } from '@mezon/transport';
import { Icons } from '@mezon/ui';
import { MAX_FILE_SIZE_10MB, fileTypeImage, generateE2eId } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { ModalErrorTypeUpload, ModalOverData, ModalSaveChanges } from '../../components';
import EnableComunity from '../EnableComunityClan';
import { ELimitSize } from '../ModalValidateFile';

const SettingComunity = ({
	clanId,
	onClose: _onClose,
	onCommunityEnabledChange
}: {
	clanId: string;
	onClose?: () => void;
	onCommunityEnabledChange?: (enabled: boolean) => void;
}) => {
	const { t } = useTranslation('onBoardingClan');
	const dispatch = useAppDispatch();
	const isEnabled = useAppSelector((state) => selectIsCommunityEnabled(state, clanId));
	const banner = useAppSelector((state) => selectCommunityBanner(state, clanId));
	const about = useAppSelector((state) => selectComunityAbout(state, clanId));
	const isLoading = useAppSelector((state) => selectComunityLoading(state));
	const _error = useAppSelector((state) => selectComunityError(state));

	useEffect(() => {
		if (clanId) {
			dispatch(comunityActions.getCommunityInfo({ clan_id: clanId }));
		}
	}, [dispatch, clanId]);

	const [isInitialEditing, setIsInitialEditing] = useState(false);
	const [bannerFile, setBannerFile] = useState<File | null>(null);
	const [bannerPreview, setBannerPreview] = useState<string | null>(null);
	const [aboutText, setAboutText] = useState('');
	const [descriptionText, setDescriptionText] = useState('');
	const [vanityUrl, setVanityUrl] = useState('');
	const [initialBanner, setInitialBanner] = useState<string | null>(null);
	const [initialAbout, setInitialAbout] = useState('');
	const [initialDescription, setInitialDescription] = useState('');
	const [initialVanityUrl, setInitialVanityUrl] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [openSaveChange, setOpenSaveChange] = useState(false);
	const [aboutError, setAboutError] = useState(false);
	const [descError, setDescError] = useState(false);
	const [bannerError, setBannerError] = useState(false);
	const [vanityUrlError, setVanityUrlError] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { sessionRef, clientRef } = useMezon();
	const isDirty =
		aboutText !== initialAbout || bannerPreview !== initialBanner || descriptionText !== initialDescription || vanityUrl !== initialVanityUrl;
	const [openModal, setOpenModal] = useState<boolean>(false);
	const [openTypeModal, setOpenTypeModal] = useState<boolean>(false);

	const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.size > MAX_FILE_SIZE_10MB) {
			setOpenModal(true);
			return;
		}
		if (!fileTypeImage.includes(file.type)) {
			setOpenTypeModal(true);
			return;
		}

		setBannerFile(file);
		setBannerPreview(URL.createObjectURL(file));
		if (isEnabled) setOpenSaveChange(true);
		e.target.value = '';
	};

	const handleChangeAbout = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setAboutText(e.target.value);
		if (isEnabled) setOpenSaveChange(true);
	};
	const handleBlurAbout = async () => {
		if (isEnabled && aboutText !== initialAbout) {
			setIsSaving(true);
			try {
				await dispatch(comunityActions.updateCommunityAbout({ clan_id: clanId, about: aboutText })).unwrap();
				setInitialAbout(aboutText);
				toast.success(t('communitySettings.messages.aboutUpdated'));
			} catch {
				toast.error(t('communitySettings.messages.aboutUpdateFailed'));
			} finally {
				setIsSaving(false);
			}
		}
	};

	const handleChangeDescription = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setDescriptionText(e.target.value);
		if (isEnabled) setOpenSaveChange(true);
	};

	const handleChangeVanityUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
		setVanityUrl(value);
		if (isEnabled) setOpenSaveChange(true);
	};
	const handleBlurDescription = async () => {
		if (isEnabled && descriptionText !== initialDescription) {
			setIsSaving(true);
			try {
				await dispatch(comunityActions.updateCommunityDescription({ clan_id: clanId, description: descriptionText })).unwrap();
				setInitialDescription(descriptionText);
				toast.success(t('communitySettings.messages.descriptionUpdated'));
			} catch {
				toast.error(t('communitySettings.messages.descriptionUpdateFailed'));
			} finally {
				setIsSaving(false);
			}
		}
	};
	const handleBlurVanityUrl = async () => {
		if (isEnabled && vanityUrl !== initialVanityUrl) {
			setIsSaving(true);
			try {
				await dispatch(comunityActions.updateCommunityShortUrl({ clan_id: clanId, short_url: vanityUrl })).unwrap();
				setInitialVanityUrl(vanityUrl);
				toast.success(t('communitySettings.messages.vanityUrlUpdated'));
			} catch {
				toast.error(t('communitySettings.messages.vanityUrlUpdateFailed'));
			} finally {
				setIsSaving(false);
			}
		}
	};

	const handleEnable = () => setIsInitialEditing(true);

	const handleConfirmEnable = async () => {
		let hasError = false;
		setAboutError(false);
		setDescError(false);
		setBannerError(false);
		setVanityUrlError(false);
		if (!aboutText.trim()) {
			setAboutError(true);
			hasError = true;
		}
		if (!descriptionText.trim()) {
			setDescError(true);
			hasError = true;
		}
		if (!vanityUrl.trim()) {
			setVanityUrlError(true);
			hasError = true;
		}
		if (!bannerFile && !bannerPreview) {
			setBannerError(true);
			hasError = true;
		}
		if (hasError) {
			toast.error('please fill all required fields: Banner, About, Description, Vanity URL!');
			return;
		}
		setIsSaving(true);
		try {
			await dispatch(comunityActions.updateCommunityStatus({ clan_id: clanId, enabled: true })).unwrap();
			let bannerUrl = bannerPreview;
			if (bannerFile) {
				const client = clientRef.current;
				const session = sessionRef.current;
				if (!client || !session) throw new Error('Client/session not ready');
				const path = `community-banner/${clanId}.${bannerFile.name.split('.').pop() || 'jpg'}`;
				const attachment = await handleUploadEmoticon(client, session, path, bannerFile);
				if (attachment && attachment.url) {
					bannerUrl = attachment.url;
					await dispatch(comunityActions.updateCommunityBanner({ clan_id: clanId, bannerUrl })).unwrap();
				}
			}
			if (aboutText) {
				await dispatch(comunityActions.updateCommunityAbout({ clan_id: clanId, about: aboutText })).unwrap();
			}
			if (descriptionText) {
				await dispatch(comunityActions.updateCommunityDescription({ clan_id: clanId, description: descriptionText })).unwrap();
			}
			if (vanityUrl) {
				await dispatch(comunityActions.updateCommunityShortUrl({ clan_id: clanId, short_url: vanityUrl })).unwrap();
			}
			setInitialAbout(aboutText);
			setInitialDescription(descriptionText);
			setInitialVanityUrl(vanityUrl);
			setInitialBanner(bannerUrl);
			setIsInitialEditing(false);
			onCommunityEnabledChange?.(true);
			toast.success(t('communitySettings.messages.communityEnabledAndSaved'));
		} catch (e) {
			toast.error(t('communitySettings.messages.saveFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = () => {
		setAboutText(initialAbout);
		setDescriptionText(initialDescription);
		setBannerPreview(initialBanner);
		setBannerFile(null);
		setOpenSaveChange(false);
		setVanityUrl(initialVanityUrl);
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			let bannerUrl = bannerPreview;
			if (bannerFile) {
				const client = clientRef.current;
				const session = sessionRef.current;
				if (!client || !session) throw new Error('Client/session not ready');
				const path = `community-banner/${clanId}.${bannerFile.name.split('.').pop() || 'jpg'}`;
				const attachment = await handleUploadEmoticon(client, session, path, bannerFile);
				if (attachment && attachment.url) {
					bannerUrl = attachment.url;
					await dispatch(comunityActions.updateCommunityBanner({ clan_id: clanId, bannerUrl })).unwrap();
				}
			}
			if (aboutText !== initialAbout) {
				await dispatch(comunityActions.updateCommunityAbout({ clan_id: clanId, about: aboutText })).unwrap();
				setInitialAbout(aboutText);
			}
			if (descriptionText !== initialDescription) {
				await dispatch(comunityActions.updateCommunityDescription({ clan_id: clanId, description: descriptionText })).unwrap();
				setInitialDescription(descriptionText);
			}
			if (vanityUrl !== initialVanityUrl) {
				await dispatch(comunityActions.updateCommunityShortUrl({ clan_id: clanId, short_url: vanityUrl })).unwrap();
				setInitialVanityUrl(vanityUrl);
			}
			setInitialBanner(bannerUrl);
			setOpenSaveChange(false);
			setBannerFile(null);
			toast.success(t('communitySettings.messages.changesSaved'));
		} catch {
			toast.error(t('communitySettings.messages.saveFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleDisable = async () => {
		setIsSaving(true);
		try {
			await dispatch(comunityActions.updateCommunityStatus({ clan_id: clanId, enabled: false })).unwrap();
			setAboutText('');
			setDescriptionText('');
			setVanityUrl('');
			setBannerFile(null);
			setBannerPreview(null);
			setInitialAbout('');
			setInitialDescription('');
			setInitialVanityUrl('');
			setInitialBanner(null);
			setOpenSaveChange(false);
			onCommunityEnabledChange?.(false);
			toast.info(t('communitySettings.messages.communityDisabled'));
		} catch {
			toast.error(t('communitySettings.messages.disableFailed'));
		} finally {
			setIsSaving(false);
		}
	};

	const handleRemoveBanner = async () => {
		setBannerFile(null);
		setBannerPreview(null);
		setOpenSaveChange(true);
		if (isEnabled) {
			await dispatch(comunityActions.updateCommunityBanner({ clan_id: clanId, bannerUrl: '' })).unwrap();
			setInitialBanner('');
			toast.success(t('communitySettings.messages.bannerRemoved'));
		}
	};

	useEffect(() => {
		setBannerPreview(banner);
		setInitialBanner(banner);
	}, [banner]);

	useEffect(() => {
		setAboutText(about || '');
		setInitialAbout(about || '');
	}, [about, clanId, isEnabled]);

	const description = useAppSelector((state) => state.COMUNITY_FEATURE_KEY?.byClanId?.[clanId]?.description ?? '');
	useEffect(() => {
		setDescriptionText(description);
		setInitialDescription(description);
	}, [description, clanId, isEnabled]);

	const shortUrl = useAppSelector((state) => selectComunityShortUrl(state, clanId));
	useEffect(() => {
		setVanityUrl(shortUrl);
		setInitialVanityUrl(shortUrl);
	}, [shortUrl, clanId, isEnabled]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[500px]">
				<div className="text-theme-primary">{t('communitySettings.loading')}</div>
			</div>
		);
	}

	if (!isEnabled && !isInitialEditing) {
		return <EnableComunity onEnable={handleEnable} clanId={clanId} />;
	}

	if (!isEnabled && isInitialEditing) {
		return (
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
				<div className="relative w-full max-w-lg bg-gradient-to-br from-white to-gray-50 dark:from-theme-setting-primary dark:to-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
					<div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
						<button
							className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
							onClick={() => setIsInitialEditing(false)}
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
						<h2 className="text-3xl font-bold mb-2">{t('communitySettings.enableTitle')}</h2>
						<p className="text-blue-100">{t('communitySettings.enableSubtitle')}</p>
					</div>

					<div className="p-6 space-y-6 bg-theme-setting-primary overflow-y-auto thread-scroll" style={{ maxHeight: '75vh' }}>
						<div className="space-y-4">
							<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary">
								<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								{t('communitySettings.banner.title')}
							</label>

							<div className={`relative group ${bannerError ? 'border-2 border-red-500 rounded-xl' : ''}`}>
								{bannerPreview ? (
									<div className="relative w-full h-40 rounded-xl overflow-hidden shadow-lg">
										<img
											src={bannerPreview || '/placeholder.svg'}
											alt="Community Banner"
											className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
										<button
											type="button"
											onClick={handleRemoveBanner}
											className="z-20 absolute top-2 right-2 bg-white/80 hover:bg-white text-red-600 rounded-full p-2 shadow transition"
											title={t('communitySettings.banner.removeBanner')}
										>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
										<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto z-10">
											<button
												onClick={() => fileInputRef.current?.click()}
												className="bg-indigo-400 px-6 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition-colors duration-200 shadow-lg"
											>
												{t('communitySettings.banner.changeBanner')}
											</button>
										</div>
									</div>
								) : (
									<div
										onClick={() => fileInputRef.current?.click()}
										className={`cursor-pointer w-full h-48 rounded-xl border-2 border-dashed ${bannerError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-300 flex flex-col items-center justify-center text-theme-primary hover:text-blue-500 dark:hover:text-blue-400 bg-theme-setting-primary hover:bg-blue-50 dark:hover:bg-blue-900/20`}
									>
										<Icons.ImageUploadIcon className="w-12 h-12 mb-3 transition-transform duration-300 hover:scale-110" />
										<p className="text-lg font-medium">{t('communitySettings.banner.uploadTitle')}</p>
										<p className="text-sm opacity-75">{t('communitySettings.banner.uploadDescription')}</p>
									</div>
								)}
							</div>

							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={handleBannerChange}
								data-e2e={generateE2eId('clan_page.settings.upload.community_banner_input')}
							/>
						</div>

						<div className="space-y-4">
							<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary">
								<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								{t('communitySettings.description.title')}
							</label>
							<div className="relative">
								<textarea
									className={`w-full border-2 rounded-xl p-4 bg-theme-input text-theme-primary focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-200 resize-none text-base ${descError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
									rows={5}
									value={descriptionText}
									onChange={handleChangeDescription}
									onBlur={handleBlurDescription}
									placeholder={t('communitySettings.description.placeholder')}
									maxLength={300}
								/>
								<div className="absolute bottom-3 right-3 text-sm bg-theme-setting-primary text-theme-primary border border-theme-primary px-2 py-1 rounded-md">
									<span
										className={
											descriptionText.length > 250
												? 'text-orange-500'
												: descriptionText.length > 280
													? 'text-red-500'
													: 'text-theme-primary-active'
										}
									>
										{descriptionText.length}
									</span>
									<span className="text-theme-primary">/300</span>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary">
								<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								{t('communitySettings.about.title')}
							</label>

							<div className="relative">
								<textarea
									className={`w-full border-2 rounded-xl p-4 bg-theme-input text-theme-primary focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-200 resize-none text-base ${aboutError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
									rows={5}
									value={aboutText}
									onChange={handleChangeAbout}
									onBlur={handleBlurAbout}
									placeholder={t('communitySettings.about.placeholder')}
									maxLength={100}
								/>
								<div className="absolute bottom-3 right-3 text-sm  bg-theme-setting-primary text-theme-primary border border-theme-primary px-2 py-1 rounded-md">
									<span
										className={
											aboutText.length > 50
												? 'text-orange-500'
												: aboutText.length > 80
													? 'text-red-500'
													: 'text-theme-primary-active'
										}
									>
										{aboutText.length}
									</span>
									<span className="text-theme-primary">/100</span>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary">
								<svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
									/>
								</svg>
								{t('communitySettings.vanityUrl.title')}
							</label>
							<p className="text-sm text-theme-primary opacity-75 mb-3">{t('communitySettings.vanityUrl.description')} </p>
							<div className="relative">
								<div
									className={`flex items-center border-2 rounded-xl bg-theme-input focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all duration-200 ${vanityUrlError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
								>
									<span className="px-4 py-3 text-theme-primary opacity-75 border-r bg-item-theme rounded-l-xl">
										mezon.ai/clans/clan/
									</span>
									<input
										type="text"
										className="flex-1 px-4 py-3 bg-transparent text-theme-primary focus:outline-none rounded-r-xl"
										value={vanityUrl}
										onChange={handleChangeVanityUrl}
										placeholder={t('communitySettings.vanityUrl.placeholder')}
										onBlur={handleBlurVanityUrl}
										maxLength={50}
									/>
								</div>
								{vanityUrl && (
									<div className="mt-2 p-3 border border-blue-200 rounded-lg">
										<p className="text-sm text-blue-700  flex items-center gap-1">
											<span className="font-medium">{t('communitySettings.vanityUrl.previewLabel')}</span>
											<span className="truncate max-w-[300px] block">mezon.ai/clans/clan/{vanityUrl}</span>
										</p>
									</div>
								)}
								<div className="absolute -bottom-6 right-0 text-xs text-theme-primary opacity-60">{vanityUrl.length}/50</div>
							</div>
						</div>

						<div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
							<button
								onClick={handleConfirmEnable}
								disabled={isSaving}
								className="group relative px-8 py-3 btn-primary btn-primary-hover font-semibold rounded-xl shadow-lg hover:shadow-xl transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
							>
								{isSaving ? (
									<div className="flex items-center gap-2">
										<svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										{t('communitySettings.buttons.saving')}
									</div>
								) : (
									<div className="flex items-center gap-2">{t('communitySettings.buttons.enableAndSave')}</div>
								)}
							</button>
						</div>
					</div>
				</div>
				<ModalErrorTypeUpload open={openTypeModal} onClose={() => setOpenTypeModal(false)} />

				<ModalOverData open={openModal} onClose={() => setOpenModal(false)} size={ELimitSize.MB_10} />
			</div>
		);
	}

	return (
		<div className="max-w-2xl mx-auto p-6">
			<div className="bg-white dark:bg-theme-setting-primary rounded-2xl shadow-xl border border-theme-primary overflow-hidden max-h-[90vh] flex flex-col">
				<div className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<div>
							<h2 className="text-2xl font-bold">{t('communitySettings.title')}</h2>
							<p className="text-green-100">{t('communitySettings.subtitle')}</p>
						</div>
					</div>
				</div>

				<div className="p-6 space-y-6 bg-theme-setting-nav overflow-y-auto thread-scroll" style={{ maxHeight: '75vh' }}>
					<div className="space-y-4">
						<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary-active">
							<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							{t('communitySettings.banner.title')}
						</label>
						<div className="relative group">
							{bannerPreview ? (
								<div className="relative w-full h-40 rounded-xl overflow-hidden shadow-lg">
									<img
										src={bannerPreview || '/placeholder.svg'}
										alt="Community Banner"
										className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto z-10">
										<button
											onClick={() => fileInputRef.current?.click()}
											className="bg-indigo-400 px-6 text-white py-3 rounded-lg font-medium hover:bg-indigo-500 transition-colors duration-200 shadow-lg"
										>
											{t('communitySettings.banner.changeBanner')}
										</button>
									</div>
								</div>
							) : (
								<div
									onClick={() => fileInputRef.current?.click()}
									className="cursor-pointer group relative w-full h-48 rounded-lg border-2 border-dashed hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex items-center justify-center text-theme-primary bg-theme-setting-primary  "
								>
									<div className="text-center">
										<Icons.ImageUploadIcon className="w-12 h-12 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 text-theme-primary group-hover:text-blue-500" />
										<p className="text-lg font-medium mb-2">{t('communitySettings.banner.uploadTitle')}</p>
										<p className="text-sm opacity-75">{t('communitySettings.banner.uploadDescription')}</p>
									</div>
								</div>
							)}
						</div>

						<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
					</div>

					<div className="space-y-4">
						<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary">
							<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							{t('communitySettings.description.title')}
						</label>
						<div className="relative">
							<textarea
								className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-theme-input text-theme-primary focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-200 resize-none text-base"
								rows={5}
								value={descriptionText}
								onChange={handleChangeDescription}
								placeholder={t('communitySettings.description.placeholder')}
								maxLength={300}
							/>
							<div className="absolute bottom-3 right-3 text-sm bg-theme-setting-primary text-theme-primary border border-theme-primary px-2 py-1 rounded-md">
								<span
									className={
										descriptionText.length > 250
											? 'text-orange-500'
											: descriptionText.length > 280
												? 'text-red-500'
												: 'text-theme-primary-active'
									}
								>
									{descriptionText.length}
								</span>
								<span className="text-theme-primary">/300</span>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary">
							<svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							{t('communitySettings.about.title')}
						</label>

						<div className="relative">
							<textarea
								className="w-full border-2 border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-theme-input text-theme-primary  focus:border-blue-400 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all duration-200 resize-none text-base"
								rows={5}
								value={aboutText}
								onChange={handleChangeAbout}
								placeholder={t('communitySettings.about.placeholder')}
								maxLength={100}
							/>
							<div className="absolute bottom-3 right-3 text-sm  bg-theme-setting-primary text-theme-primary border border-theme-primary px-2 py-1 rounded-md">
								<span
									className={
										aboutText.length > 50
											? 'text-orange-500'
											: aboutText.length > 80
												? 'text-red-500'
												: 'text-theme-primary-active'
									}
								>
									{aboutText.length}
								</span>
								<span className="text-theme-primary">/100</span>
							</div>
						</div>
					</div>

					<div className="space-y-4">
						<label className="flex items-center gap-2 text-lg font-semibold text-theme-primary">
							<svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
								/>
							</svg>
							{t('communitySettings.vanityUrl.title')}
						</label>
						<p className="text-sm text-theme-primary opacity-75 mb-3">{t('communitySettings.vanityUrl.description')} </p>
						<div className="relative">
							<div
								className={`flex items-center border-2 rounded-xl bg-theme-input focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all duration-200 ${vanityUrlError ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
							>
								<span className="px-4 py-3 text-theme-primary opacity-75 border-r border-gray-300 bg-item-theme rounded-l-xl">
									mezon.ai/clans/clan/
								</span>
								<input
									type="text"
									className="flex-1 px-4 py-3 bg-transparent text-theme-primary focus:outline-none rounded-r-xl"
									value={vanityUrl}
									onChange={handleChangeVanityUrl}
									placeholder={t('communitySettings.vanityUrl.placeholder')}
									maxLength={50}
								/>
							</div>
							{vanityUrl && (
								<div className="mt-2 p-3  border border-blue-200 rounded-lg">
									<p className="text-sm text-blue-700 flex items-center gap-1">
										<span className="font-medium">{t('communitySettings.vanityUrl.previewLabel')}</span>
										<span className="truncate max-w-[300px] block">mezon.ai/clans/clan/{vanityUrl}</span>
									</p>
								</div>
							)}
							<div className="absolute -bottom-6 right-0 text-xs text-theme-primary opacity-60">{vanityUrl.length}/50</div>
						</div>
					</div>

					{openSaveChange && isDirty && <ModalSaveChanges onSave={handleSaveChanges} onReset={handleReset} isLoading={isSaving} />}

					<div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
						<button
							disabled={openSaveChange}
							onClick={handleDisable}
							className={`group px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${openSaveChange ? 'opacity-50 cursor-not-allowed disabled ' : ''}`}
						>
							<div className="flex items-center gap-2">{t('communitySettings.buttons.disable')}</div>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingComunity;
