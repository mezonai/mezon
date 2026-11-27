import { clansActions, selectCurrentClan, toastActions, useAppDispatch } from '@mezon/store';
import { Image } from '@mezon/ui';
import type { AvatarFrameId } from '@mezon/utils';
import { AVATAR_FRAMES, createImgproxyUrl } from '@mezon/utils';
import type { MezonUpdateClanDescBody } from 'mezon-js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ProAvatarFrame } from '../../ProfileBadges';
import ModalSaveChanges from '../ClanSettingOverview/ModalSaveChanges';

type ClanIconCircleProps = {
	size: 'md' | 'lg';
	logo?: string;
	initial: string;
};

const ClanIconCircle = ({ size, logo, initial }: ClanIconCircleProps) => {
	const sizeClass = size === 'lg' ? 'w-20 h-20 text-3xl' : 'w-12 h-12 text-lg';

	if (logo) {
		return (
			<Image
				draggable="false"
				src={createImgproxyUrl(logo, { width: 160, height: 160, resizeType: 'fill-down' }) || ''}
				placeholder="clan"
				className={`${sizeClass} rounded-full object-cover`}
			/>
		);
	}

	return (
		<div className={`${sizeClass} rounded-full bg-item-theme text-theme-primary font-semibold flex items-center justify-center select-none`}>
			{initial}
		</div>
	);
};

type FrameTileProps = {
	frameId: AvatarFrameId;
	frameValue: number;
	selected: boolean;
	disabled: boolean;
	logo?: string;
	initial: string;
	onSelect: (frame: number) => void;
};

const FrameTile = ({ frameId, frameValue, selected, disabled, logo, initial, onSelect }: FrameTileProps) => {
	const handleClick = useCallback(() => {
		onSelect(frameValue);
	}, [onSelect, frameValue]);

	const stateClasses = selected ? 'ring-2 ring-[var(--bg-button-primary,#5865f2)] bg-item-theme' : 'border-theme-primary';
	const interactionClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-item-theme-hover';

	return (
		<button
			type="button"
			disabled={disabled}
			aria-pressed={selected}
			onClick={disabled ? undefined : handleClick}
			className={`flex items-center justify-center rounded-lg p-3 bg-theme-setting-nav transition-colors ${stateClasses} ${interactionClasses}`}
		>
			<ProAvatarFrame isPro userId="" frameId={frameId}>
				<ClanIconCircle size="md" logo={logo} initial={initial} />
			</ProAvatarFrame>
		</button>
	);
};

const ClanProSetting = () => {
	const { t } = useTranslation('clanSettings');
	const dispatch = useAppDispatch();
	const currentClan = useSelector(selectCurrentClan);

	const isPro = Boolean(currentClan?.pro_plan);
	const savedFrame = currentClan?.frame ?? 0;

	const [draftFrame, setDraftFrame] = useState<number>(savedFrame);
	const [isSaving, setIsSaving] = useState<boolean>(false);

	useEffect(() => {
		setDraftFrame(savedFrame);
	}, [currentClan?.clan_id, savedFrame]);

	const hasChanges = draftFrame !== savedFrame;
	const canSelectNoFrame = isPro || savedFrame > 0;
	const previewFrameId: AvatarFrameId | undefined =
		draftFrame >= 1 && draftFrame <= AVATAR_FRAMES.length ? AVATAR_FRAMES[draftFrame - 1] : undefined;
	const clanInitial = (currentClan?.clan_name || '').trim().charAt(0).toUpperCase();

	const handleSelectFrame = useCallback((frame: number) => {
		setDraftFrame(frame);
	}, []);

	const handleSelectNoFrame = useCallback(() => {
		setDraftFrame(0);
	}, []);

	const handleReset = useCallback(() => {
		setDraftFrame(savedFrame);
	}, [savedFrame]);

	const handleSave = useCallback(async () => {
		if (!currentClan?.clan_id || isSaving) {
			return;
		}
		setIsSaving(true);
		try {
			const request: MezonUpdateClanDescBody = {
				prevent_anonymous: !!currentClan.prevent_anonymous,
				welcome_channel_id: currentClan.welcome_channel_id ?? '',
				frame: draftFrame
			};
			await dispatch(clansActions.updateClan({ clan_id: currentClan.clan_id, request })).unwrap();
			dispatch(toastActions.addToast({ message: t('clanPro.saved'), type: 'success' }));
		} catch {
			dispatch(toastActions.addToast({ message: t('clanPro.saveFailed'), type: 'error' }));
		} finally {
			setIsSaving(false);
		}
	}, [currentClan, draftFrame, isSaving, dispatch, t]);

	const noFrameStateClasses = draftFrame === 0 ? 'ring-2 ring-[var(--bg-button-primary,#5865f2)] bg-item-theme' : 'border-theme-primary';
	const noFrameInteractionClasses = canSelectNoFrame ? 'cursor-pointer bg-item-theme-hover' : 'opacity-50 cursor-not-allowed';

	return (
		<div className="h-full pb-24">
			<h3 className="text-base font-semibold text-theme-primary-active mb-1">{t('clanPro.title')}</h3>
			<p className="text-sm text-theme-primary mb-6">{t('clanPro.description')}</p>

			{!isPro && (
				<div className="mb-6 rounded-lg border-theme-primary bg-item-theme px-4 py-3 text-sm text-theme-primary">{t('clanPro.notPro')}</div>
			)}

			<div className="p-6 mb-6 rounded-lg bg-item-theme border-theme-primary flex items-center justify-center">
				<ProAvatarFrame isPro={Boolean(previewFrameId)} userId="" frameId={previewFrameId} animated>
					<ClanIconCircle size="lg" logo={currentClan?.logo} initial={clanInitial} />
				</ProAvatarFrame>
			</div>

			<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
				<button
					type="button"
					disabled={!canSelectNoFrame}
					aria-pressed={draftFrame === 0}
					onClick={canSelectNoFrame ? handleSelectNoFrame : undefined}
					className={`flex flex-col items-center justify-center gap-2 rounded-lg p-3 bg-theme-setting-nav transition-colors ${noFrameStateClasses} ${noFrameInteractionClasses}`}
				>
					<ClanIconCircle size="md" logo={currentClan?.logo} initial={clanInitial} />
					<span className="text-xs text-theme-primary truncate max-w-full">{t('clanPro.noFrame')}</span>
				</button>

				{AVATAR_FRAMES.map((frameId, idx) => (
					<FrameTile
						key={frameId}
						frameId={frameId}
						frameValue={idx + 1}
						selected={draftFrame === idx + 1}
						disabled={!isPro}
						logo={currentClan?.logo}
						initial={clanInitial}
						onSelect={handleSelectFrame}
					/>
				))}
			</div>

			{hasChanges && <ModalSaveChanges onSave={handleSave} onReset={handleReset} disableSave={isSaving} />}
		</div>
	);
};

export default ClanProSetting;
