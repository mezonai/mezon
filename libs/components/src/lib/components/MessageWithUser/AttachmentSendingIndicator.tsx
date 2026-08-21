import { useTranslation } from 'react-i18next';

/**
 * Below this the caption has nowhere to sit without covering the picture, so a
 * small tile keeps just the spinner.
 */
const LABEL_MIN_WIDTH = 160;

type AttachmentSendingIndicatorProps = {
	className?: string;
	/** Name the state instead of leaving a bare spinner to be read as "broken". */
	showLabel?: boolean;
	boxWidth?: number;
};

export function AttachmentSendingIndicator({ className = '', showLabel = false, boxWidth }: AttachmentSendingIndicatorProps) {
	const { t } = useTranslation('media');
	const withLabel = showLabel && (boxWidth === undefined || boxWidth >= LABEL_MIN_WIDTH);

	return (
		<div className={`absolute inset-0 flex flex-col gap-2 items-center justify-center pointer-events-none z-[2] ${className}`}>
			{/* The spinner says nothing a screen reader can use; the label does, so
			    only the spinner is hidden and the label is announced once. */}
			<div
				className="w-8 h-8 border-2 border-textSecondary800 dark:border-textSecondary border-t-transparent rounded-full animate-spin"
				aria-hidden
			/>
			{withLabel && (
				<span className="text-xs text-textSecondary800 dark:text-textSecondary" role="status" aria-live="polite">
					{t('attachment.uploading')}
				</span>
			)}
		</div>
	);
}
