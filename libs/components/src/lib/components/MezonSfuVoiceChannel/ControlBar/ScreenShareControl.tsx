import { Icons } from '@mezon/ui';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ScreenShareMode } from '../MyVideoConference/screenShareQuality';
import { SFU_CONTROL_BUTTON_CLASS } from './controlStyles';

interface ScreenShareControlProps {
	active: boolean;
	onToggle: () => void;
	mode: ScreenShareMode;
	changingMode: boolean;
	onModeChange: (mode: ScreenShareMode) => void;
}

export const ScreenShareControl = ({ active, onToggle, mode, changingMode, onModeChange }: ScreenShareControlProps) => {
	const { t } = useTranslation('channelVoice');
	const { t: tScreen } = useTranslation('screenShare');
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const menuButtonRef = useRef<HTMLButtonElement>(null);
	const textLabel = tScreen('textMode', { defaultValue: 'Text' });
	const videoLabel = tScreen('videoMode', { defaultValue: 'Video' });
	const selectedLabel = mode === 'text' ? textLabel : videoLabel;
	const modeLabel = tScreen('qualityMode', { defaultValue: 'Screen share mode' });
	const toggleMenu = useCallback(() => setIsOpen((open) => !open), []);
	const handleModeChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			const nextMode = event.target.value;
			if (nextMode !== 'text' && nextMode !== 'video') return;
			onModeChange(nextMode);
			setIsOpen(false);
			menuButtonRef.current?.focus();
		},
		[onModeChange]
	);

	useEffect(() => {
		if (!isOpen) return;
		const closeOnOutsideClick = (event: MouseEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
		};
		const closeOnEscape = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			setIsOpen(false);
			menuButtonRef.current?.focus();
		};
		document.addEventListener('mousedown', closeOnOutsideClick);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('mousedown', closeOnOutsideClick);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, [isOpen]);

	return (
		<div ref={containerRef} className="relative">
			<button
				id="btn-meet-screen"
				type="button"
				title={t(active ? 'stopScreenShare' : 'shareYourScreen')}
				aria-label={t(active ? 'stopScreenShare' : 'shareYourScreen')}
				className={`${SFU_CONTROL_BUTTON_CLASS} ${active ? '!bg-blue-500' : ''}`}
				onClick={onToggle}
				disabled={changingMode}
			>
				{active ? <Icons.VoiceScreenShareStopIcon /> : <Icons.VoiceScreenShareIcon />}
			</button>
			<button
				ref={menuButtonRef}
				type="button"
				title={`${modeLabel}: ${selectedLabel}`}
				aria-label={`${modeLabel}: ${selectedLabel}`}
				aria-expanded={isOpen}
				disabled={changingMode}
				onClick={toggleMenu}
				className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-zinc-600 bg-zinc-900 px-2 py-0.5 text-[10px] text-white disabled:opacity-40"
			>
				{selectedLabel}
				<Icons.VoiceArowDownIcon className="h-3 w-3" />
			</button>
			{isOpen && (
				<fieldset className="absolute bottom-16 right-0 z-30 w-64 rounded-lg bg-zinc-800 p-3 text-white shadow-2xl" aria-label={modeLabel}>
					<legend className="sr-only">{modeLabel}</legend>
					<label className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-zinc-700">
						<input type="radio" name="screen-share-mode" value="text" checked={mode === 'text'} onChange={handleModeChange} />
						<span>
							<span className="block text-sm font-semibold">{textLabel}</span>
							<span className="block text-xs text-zinc-300">
								{tScreen('textModeDescription', { defaultValue: 'Sharper text and slides, lower resource use.' })}
							</span>
						</span>
					</label>
					<label className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-zinc-700">
						<input type="radio" name="screen-share-mode" value="video" checked={mode === 'video'} onChange={handleModeChange} />
						<span>
							<span className="block text-sm font-semibold">{videoLabel}</span>
							<span className="block text-xs text-zinc-300">
								{tScreen('videoModeDescription', { defaultValue: 'Smoother video; may reduce sharpness on a slow connection.' })}
							</span>
						</span>
					</label>
				</fieldset>
			)}
		</div>
	);
};
