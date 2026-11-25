import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export interface CommentControlProps {
	active: boolean;
	hidden: boolean;
	hasUnseen: boolean;
	onToggle: () => void;
}

export const CommentControl = memo(({ active, hidden, hasUnseen, onToggle }: CommentControlProps) => {
	const { t } = useTranslation('channelVoice');

	const label = useMemo(() => (hidden ? t('comment.show') : t('comment.button')), [hidden, t]);
	const showDot = hidden && hasUnseen;
	const iconClassName = useMemo(
		() => (active ? 'text-[var(--mz-icon-selected)]' : 'text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)]'),
		[active]
	);

	return (
		<button
			type="button"
			title={label}
			aria-label={label}
			aria-pressed={active}
			onClick={onToggle}
			className={`relative flex cursor-pointer items-center justify-center transition-colors ${iconClassName}`}
		>
			<MezonIcon icon={MzIcons20.mzMessageAdd} />
			{showDot && <span className="btn-primary absolute -right-1 -top-1 size-2 rounded-full" />}
		</button>
	);
});

CommentControl.displayName = 'SfuCommentControl';
