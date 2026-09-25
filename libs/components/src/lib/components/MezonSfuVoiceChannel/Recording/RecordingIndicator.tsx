import { selectRecordingUserIds } from '@mezon/store';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface RecordingIndicatorProps {
	presentUserIds: string[];
	resolveName: (userId: string) => string;
}

export const RecordingIndicator = memo(({ presentUserIds, resolveName }: RecordingIndicatorProps) => {
	const { t } = useTranslation('channelVoice');
	const recordingUserIds = useSelector(selectRecordingUserIds);
	const recorders = recordingUserIds.filter((userId) => presentUserIds.includes(userId));
	if (!recorders.length) return null;

	const [first, ...others] = recorders;
	const name = resolveName(first);
	const label = others.length ? t('recording.byMany', { name, count: others.length }) : t('recording.by', { name });

	return (
		<div className="pointer-events-none absolute left-4 top-[76px] z-20 flex max-w-[360px] items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
			<span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
			<span className="truncate">{label}</span>
		</div>
	);
});
