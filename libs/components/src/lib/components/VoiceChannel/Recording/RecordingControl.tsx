import { selectVoiceRecording } from '@mezon/store';
import { generateE2eId } from '@mezon/utils';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { BLOB_SINK_MAX_DURATION_MS } from './RecordingSink';
import { callRecorder } from './callRecorder';
import { detectRecorderCapabilities } from './capabilities';

// Colours are the desktop client's LEAVE_RED / LEAVE_RED_HOVER / RAISE_HAND_GOLD
// and the badge's 15%-alpha fill, from mezon-ui/src/chat/voice.rs.

/**
 * Drawn beside the emoji and sound controls, so it is sized like them — a bare 20px
 * glyph, not one of the 56px circles from the centre group.
 */
const RecordGlyph = ({ active }: { active: boolean }) => (
	<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
		{active ? (
			<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" />
		) : (
			<>
				<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
				<circle cx="12" cy="12" r="4.5" fill="currentColor" />
			</>
		)}
	</svg>
);

const StalledGlyph = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M12 2 1 21h22L12 2Zm0 5.5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm0 9a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" />
	</svg>
);

function formatClock(ms: number): string {
	const total = Math.max(0, Math.floor(ms / 1000));
	const pad = (value: number) => String(value).padStart(2, '0');
	return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/**
 * The elapsed clock owns its own interval so the once-a-second tick re-renders the
 * badge alone, not the whole control bar.
 */
const RecordingClock = memo(({ startedAt }: { startedAt: number | null }) => {
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, []);

	// Fixed width, so the pill does not resize every time a digit changes.
	return (
		<span className="tabular-nums min-w-[4.75rem]" data-e2e={generateE2eId('clan_page.screen.voice_room.time_record')}>
			REC {formatClock(startedAt ? now - startedAt : 0)}
		</span>
	);
});

RecordingClock.displayName = 'RecordingClock';

interface RecordingControlProps {
	channelLabel?: string;
}

export const RecordingControl = memo(({ channelLabel }: RecordingControlProps) => {
	const { t } = useTranslation('channelVoice');
	const recording = useSelector(selectVoiceRecording);

	const capabilities = useMemo(() => detectRecorderCapabilities(), []);
	const isBusy = recording.status === 'starting' || recording.status === 'stopping';
	const isActive = recording.status === 'recording' || recording.status === 'starting';
	const showBadge = recording.status === 'recording' || recording.status === 'stopping';

	const handleToggle = useCallback(() => {
		if (isBusy) return;

		if (isActive) {
			void callRecorder.stop();
			return;
		}

		// Not awaited and nothing async in front of it: the save-file picker inside
		// `start()` only opens while this click still counts as user activation.
		void callRecorder.start({ channelLabel });
	}, [channelLabel, isActive, isBusy]);

	// Warnings that used to live in the consent dialog. Both are conditional and
	// rarely apply, so they hang off the badge instead of taking screen space.
	const notes: string[] = [];
	if (recording.deadlineAt) {
		notes.push(t('recording.memoryLimitWarning', { minutes: Math.round(BLOB_SINK_MAX_DURATION_MS / 60000) }));
	}
	if (recording.degraded) {
		notes.push(t('recording.frozenWarning'));
	}

	if (!capabilities.supported) {
		return null;
	}

	const label = isActive ? t('recording.stop') : t('recording.start');

	return (
		<>
			<div
				role="button"
				tabIndex={0}
				aria-label={label}
				aria-pressed={isActive}
				onClick={handleToggle}
				className={`flex items-center cursor-pointer transition-colors ${isBusy ? 'opacity-60 pointer-events-none' : ''} ${
					isActive ? 'text-[#da373c] hover:text-[#a12829]' : 'text-[var(--bg-icon-theme)] hover:text-[var(--bg-icon-theme-active)]'
				}`}
				data-e2e={generateE2eId('clan_page.screen.voice_room.button.record')}
			>
				<RecordGlyph active={isActive} />
			</div>

			{showBadge && (
				<div
					role="status"
					className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#da373c] bg-[#c4362b26] text-xs font-semibold text-[#da373c] select-none whitespace-nowrap"
				>
					<span className="h-2 w-2 rounded-full bg-current" />
					<RecordingClock startedAt={recording.startedAt} />
					{!!notes.length && (
						<span className="flex items-center text-[#efbc39]" aria-label={notes.join(' ')}>
							<StalledGlyph />
						</span>
					)}
				</div>
			)}
		</>
	);
});

RecordingControl.displayName = 'RecordingControl';
