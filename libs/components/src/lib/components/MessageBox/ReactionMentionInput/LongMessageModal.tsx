import { MezonIcon, MzIcons24 } from '@mezon/ui';
import { MESSAGE_FILE_LIMIT_MULTIPLIER, generateE2eId } from '@mezon/utils';
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface LongMessageModalProps {
	charCount: number;
	limit: number;
	sizeLabel: string;
	onConfirm: () => void;
	onCancel: () => void;
}

const LongMessageModal = ({ charCount, limit, sizeLabel, onConfirm, onCancel }: LongMessageModalProps) => {
	const { t } = useTranslation('messageBox');
	const { t: tCommon } = useTranslation('common');
	const cardRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		cardRef.current?.focus();
	}, []);

	const handleCardClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
		event.stopPropagation();
	}, []);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				onCancel();
			} else if (event.key === 'Enter') {
				event.stopPropagation();
				if (!(event.target instanceof HTMLButtonElement)) {
					event.preventDefault();
					onConfirm();
				}
			}
		},
		[onCancel, onConfirm]
	);

	const titleText = t('longMessage.title');
	const descriptionText = t('longMessage.description', {
		count: charCount,
		multiplier: MESSAGE_FILE_LIMIT_MULTIPLIER,
		limit
	});
	const sizeText = t('longMessage.size', { size: sizeLabel });
	const charsText = t('longMessage.chars', { count: charCount });
	const cancelLabel = tCommon('cancel');
	const convertLabel = t('longMessage.convert');
	const cancelE2eId = generateE2eId('modal.long_message.button.cancel');
	const convertE2eId = generateE2eId('modal.long_message.button.convert');

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50" onClick={onCancel}>
			<div className="fixed inset-0 bg-black opacity-80" />
			<div
				ref={cardRef}
				tabIndex={-1}
				onKeyDown={handleKeyDown}
				className="relative z-10 w-[440px] px-4 md:px-0 outline-none"
				onClick={handleCardClick}
			>
				<div className="bg-theme-setting-primary pt-[16px] px-[16px] pb-[20px] rounded-t-md">
					<div className="text-theme-primary-active text-[20px] font-semibold pb-[12px] break-words">{titleText}</div>
					<div className="pb-[16px] text-theme-primary text-[14px] break-words">{descriptionText}</div>
					<div className="flex items-center gap-3 p-3 rounded-lg bg-theme-setting-nav">
						<div className="w-10 h-10 rounded-full btn-primary flex items-center justify-center shrink-0">
							<MezonIcon icon={MzIcons24.mzFileText} className="text-white" />
						</div>
						<div className="min-w-0 flex-1">
							<div className="text-theme-primary-active text-[14px] font-medium truncate">.txt</div>
							<div className="text-theme-primary text-[12px] flex items-center gap-1.5">
								<span>{sizeText}</span>
								<span>·</span>
								<span>{charsText}</span>
							</div>
						</div>
					</div>
				</div>
				<div className="bg-theme-setting-nav flex justify-end items-center gap-4 p-[16px] text-[14px] font-medium rounded-b-md">
					<button
						type="button"
						onClick={onCancel}
						className="hover:underline px-4 py-2 rounded-lg text-theme-primary text-theme-primary-hover cursor-pointer"
						data-e2e={cancelE2eId}
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={onConfirm}
						className="btn-primary btn-primary-hover bg-[var(--button-theme-primary)] hover:bg-[var(--bg-button-primary-hover)] text-white rounded-lg px-[25px] py-[8px] cursor-pointer"
						data-e2e={convertE2eId}
					>
						{convertLabel}
					</button>
				</div>
			</div>
		</div>
	);
};

export default LongMessageModal;
