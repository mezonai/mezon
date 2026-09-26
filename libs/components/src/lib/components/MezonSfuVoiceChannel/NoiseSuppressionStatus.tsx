import { selectNoiseSuppressionEnabled, selectNoiseSuppressionReady } from '@mezon/store';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

type FeedbackPhase = 'idle' | 'applying' | 'success' | 'fading';
const SUCCESS_HOLD_MS = 1200;
const FADE_MS = 300;

// Presentation timing is independent of audio readiness and never delays unmute.
export const NoiseSuppressionStatus = ({ fallback = '' }: { fallback?: string }) => {
	const { t } = useTranslation('channelVoice');
	const enabled = useSelector(selectNoiseSuppressionEnabled);
	const ready = useSelector(selectNoiseSuppressionReady);
	const [phase, setPhase] = useState<FeedbackPhase>(enabled && !ready ? 'applying' : 'idle');
	const phaseRef = useRef(phase);
	const wasEnabledRef = useRef(enabled);

	useEffect(() => {
		const justEnabled = enabled && !wasEnabledRef.current;
		wasEnabledRef.current = enabled;
		const changePhase = (next: FeedbackPhase) => {
			phaseRef.current = next;
			setPhase(next);
		};
		if (!enabled) {
			changePhase('idle');
			return;
		}
		if (!ready) {
			changePhase('applying');
			return;
		}
		// Do not show a success message on mounting an already configured call.
		if (phaseRef.current !== 'applying' && !justEnabled) return;
		changePhase('success');
		const fadeTimer = setTimeout(() => changePhase('fading'), SUCCESS_HOLD_MS);
		const hideTimer = setTimeout(() => changePhase('idle'), SUCCESS_HOLD_MS + FADE_MS);
		return () => {
			clearTimeout(fadeTimer);
			clearTimeout(hideTimer);
		};
	}, [enabled, ready]);

	const applying = phase === 'applying';
	const hidden = phase === 'idle' || phase === 'fading';
	const label = applying
		? t('noiseSuppressionStatus.applyingCompact', { defaultValue: 'Applying noise filter…' })
		: t('noiseSuppressionStatus.applied', { defaultValue: 'Noise filter applied' });
	return (
		<div className="relative h-[14px] min-w-0 text-[11px] leading-[14px]">
			<span
				aria-hidden={!hidden}
				className={`block truncate transition-opacity duration-300 motion-reduce:transition-none ${hidden ? 'opacity-100' : 'opacity-0'}`}
			>
				{fallback}
			</span>
			{phase !== 'idle' && (
				<span
					role="status"
					aria-live="polite"
					aria-atomic="true"
					aria-busy={applying}
					aria-hidden={phase === 'fading'}
					title={label}
					className={`absolute inset-0 flex min-w-0 items-center gap-1 transition-opacity duration-300 motion-reduce:transition-none ${phase === 'fading' ? 'opacity-0' : 'opacity-100'} ${applying ? 'text-theme-primary' : 'text-green-600 dark:text-green-400'}`}
				>
					{applying ? (
						<span
							aria-hidden="true"
							className="h-2.5 w-2.5 shrink-0 animate-spin rounded-full border border-current border-t-transparent"
						/>
					) : (
						<svg aria-hidden="true" className="h-3 w-3 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
							<path d="m3 8 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
					)}
					<span className="min-w-0 truncate">{label}</span>
				</span>
			)}
		</div>
	);
};
