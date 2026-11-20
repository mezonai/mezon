import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { memo, useCallback, useEffect, useMemo, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { MAX_LIVE_COMMENT_LENGTH } from './liveCommentSender';

export interface LiveCommentInputProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	placeholder: string;
	sendLabel: string;
	disabled?: boolean;
	maxLength?: number;
	autoFocus?: boolean;
	className?: string;
}

export const LiveCommentInput = memo(
	({
		value,
		onChange,
		onSend,
		placeholder,
		sendLabel,
		disabled = false,
		maxLength = MAX_LIVE_COMMENT_LENGTH,
		autoFocus = false,
		className = ''
	}: LiveCommentInputProps) => {
		const inputRef = useRef<HTMLInputElement>(null);

		useEffect(() => {
			if (autoFocus) inputRef.current?.focus();
		}, [autoFocus]);

		const canSend = useMemo(() => !disabled && value.trim().length > 0, [disabled, value]);

		const sendButtonClassName = useMemo(
			() => (canSend ? 'btn-primary btn-primary-hover cursor-pointer' : 'bg-theme-input text-theme-primary opacity-60 cursor-not-allowed'),
			[canSend]
		);

		const handleChange = useCallback(
			(event: ChangeEvent<HTMLInputElement>) => {
				onChange(event.target.value);
			},
			[onChange]
		);

		const handleKeyDown = useCallback(
			(event: KeyboardEvent<HTMLInputElement>) => {
				if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
					event.preventDefault();
					if (canSend) onSend();
				}
			},
			[canSend, onSend]
		);

		const handleSendClick = useCallback(() => {
			if (!canSend) return;
			onSend();
		}, [canSend, onSend]);

		return (
			<div
				className={`pointer-events-auto flex w-[320px] max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border-theme-primary bg-theme-setting-primary py-1.5 pl-4 pr-1.5 shadow-lg transition-colors focus-within:!border-[var(--border-focus)] ${className}`}
			>
				<input
					ref={inputRef}
					type="text"
					value={value}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					maxLength={maxLength}
					disabled={disabled}
					aria-label={placeholder}
					className="min-w-0 flex-1 bg-transparent text-sm text-theme-message outline-none placeholder:text-theme-primary disabled:opacity-60"
				/>
				<button
					type="button"
					disabled={!canSend}
					onClick={handleSendClick}
					title={sendLabel}
					aria-label={sendLabel}
					className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${sendButtonClassName}`}
				>
					<MezonIcon icon={MzIcons16.mzSend} />
				</button>
			</div>
		);
	}
);

LiveCommentInput.displayName = 'LiveCommentInput';
