import { toastActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import type { MediaDevice } from '@mezon/utils';
import { IS_MAC_OS, IS_SAFARI, IS_WINDOWS, allowMediaPermissionRequest, dismissMediaPermissionPrompt, useMediaPermissionPrompt } from '@mezon/utils';
import type { ReactNode } from 'react';
import { memo, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Trans, useTranslation } from 'react-i18next';
import type { AddressBarGlyph } from './BlockedIllustration';
import { BlockedIllustration, TuneGlyph } from './BlockedIllustration';

const IS_FIREFOX = typeof navigator !== 'undefined' && /firefox|fxios/i.test(navigator.userAgent);

const subscribeFullscreen = (listener: () => void) => {
	document.addEventListener('fullscreenchange', listener);
	return () => document.removeEventListener('fullscreenchange', listener);
};

// An element in fullscreen hides everything outside it, so the popup has to render inside it.
const getPortalTarget = () => document.fullscreenElement ?? document.body;

const CloseButton = ({ label }: { label: string }) => (
	<button
		onClick={dismissMediaPermissionPrompt}
		aria-label={label}
		className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-theme-primary hover:bg-[var(--bg-tertiary)]"
	>
		<Icons.Close className="h-4 w-4" />
	</button>
);

const RequestCard = ({ device, requesting }: { device: MediaDevice; requesting: boolean }) => {
	const { t } = useTranslation('channelVoice');
	const dispatch = useAppDispatch();

	const handleAllow = async () => {
		const result = await allowMediaPermissionRequest();
		if (result === 'unavailable') {
			dispatch(toastActions.addToast({ message: t(`mediaPermission.unavailable.${device}`), type: 'warning', autoClose: 3000 }));
		}
	};

	return (
		<div className="relative w-[400px] max-w-full rounded-xl border border-theme-primary bg-theme-setting-primary px-7 pt-8 pb-6 shadow-2xl">
			<div className="flex flex-col items-center gap-4 text-center">
				<div className="btn-primary flex h-16 w-16 items-center justify-center rounded-full">
					{device === 'camera' ? <Icons.VoiceCameraIcon scale={1.6} /> : <Icons.VoiceMicIcon scale={3} />}
				</div>
				<h2 id="media-permission-title" className="text-lg font-semibold text-theme-primary-active">
					{t(`mediaPermission.requestTitle.${device}`)}
				</h2>
				<p className="text-sm text-theme-primary">{t(`mediaPermission.requestBody.${device}`)}</p>
				{requesting && <p className="text-sm font-medium text-theme-primary-active">{t('mediaPermission.requestHint')}</p>}
				<div className="flex w-full gap-3 pt-2">
					<button
						onClick={dismissMediaPermissionPrompt}
						className="flex-1 rounded-lg bg-button-secondary bg-secondary-button-hover py-2 font-semibold text-theme-primary-active"
					>
						{t('mediaPermission.notNow')}
					</button>
					<button
						onClick={handleAllow}
						disabled={requesting}
						className="btn-primary btn-primary-hover flex-1 rounded-lg py-2 font-semibold disabled:cursor-wait disabled:opacity-60"
					>
						{t('mediaPermission.allow')}
					</button>
				</div>
			</div>
			<CloseButton label={t('mediaPermission.close')} />
		</div>
	);
};

const useBlockedGuide = (device: MediaDevice, bySystem: boolean): { title: string; glyph: AddressBarGlyph; steps: ReactNode[] } => {
	const { t } = useTranslation('channelVoice');

	if (bySystem) {
		const os = IS_MAC_OS ? 'mac' : IS_WINDOWS ? 'windows' : 'other';
		return {
			title: t(`mediaPermission.systemBlockedTitle.${device}`),
			glyph: 'settings',
			steps: [t(`mediaPermission.steps.${os}.open.${device}`), t(`mediaPermission.steps.${os}.enable.${device}`)]
		};
	}

	const title = t(`mediaPermission.blockedTitle.${device}`);
	if (IS_FIREFOX) {
		return {
			title,
			glyph: 'blockedDevice',
			steps: [t(`mediaPermission.steps.firefox.open.${device}`), t(`mediaPermission.steps.firefox.enable.${device}`)]
		};
	}
	if (IS_SAFARI) {
		return {
			title,
			glyph: 'settings',
			steps: [t('mediaPermission.steps.safari.open'), t(`mediaPermission.steps.safari.enable.${device}`)]
		};
	}
	return {
		title,
		glyph: 'tune',
		steps: [
			<Trans
				key="open"
				t={t}
				i18nKey="mediaPermission.steps.chromium.open"
				components={{ icon: <TuneGlyph className="mx-1 inline h-4 w-4 align-[-3px]" /> }}
			/>,
			t(`mediaPermission.steps.chromium.enable.${device}`)
		]
	};
};

const BlockedCard = ({ device, bySystem }: { device: MediaDevice; bySystem: boolean }) => {
	const { t } = useTranslation('channelVoice');
	const { title, glyph, steps } = useBlockedGuide(device, bySystem);

	return (
		<div className="relative flex w-[760px] max-w-full items-center gap-8 rounded-3xl border border-theme-primary bg-theme-setting-primary p-10 shadow-2xl max-md:flex-col max-md:gap-6 max-md:p-6 max-md:pt-12">
			<div className="w-[320px] max-w-full shrink-0 rounded-2xl bg-white p-3">
				<BlockedIllustration device={device} glyph={glyph} />
			</div>
			<div className="flex min-w-0 flex-col gap-5">
				<h2 id="media-permission-title" className="text-2xl font-normal leading-snug text-theme-primary-active">
					{title}
				</h2>
				<ol className="flex flex-col gap-3 text-sm text-theme-primary">
					{steps.map((step, index) => (
						<li key={index} className="flex gap-2">
							<span className="shrink-0">{index + 1}.</span>
							<span>{step}</span>
						</li>
					))}
				</ol>
			</div>
			<CloseButton label={t('mediaPermission.close')} />
		</div>
	);
};

export const MediaPermissionPrompt = memo(() => {
	const prompt = useMediaPermissionPrompt();
	const portalTarget = useSyncExternalStore(subscribeFullscreen, getPortalTarget);

	useEffect(() => {
		if (!prompt) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') dismissMediaPermissionPrompt();
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [prompt]);

	if (!prompt) return null;

	return createPortal(
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="media-permission-title"
			className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-4"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) dismissMediaPermissionPrompt();
			}}
		>
			{prompt.kind === 'request' ? (
				<RequestCard device={prompt.device} requesting={prompt.requesting} />
			) : (
				<BlockedCard device={prompt.device} bySystem={prompt.bySystem} />
			)}
		</div>,
		portalTarget
	);
});

MediaPermissionPrompt.displayName = 'MediaPermissionPrompt';
