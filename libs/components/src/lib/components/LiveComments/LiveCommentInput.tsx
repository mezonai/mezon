import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { MAX_LIVE_COMMENT_LENGTH } from './liveCommentSender';

export interface LiveCommentInputProps {
	onSend: (text: string) => boolean | Promise<boolean>;
	placeholder: string;
	sendLabel: string;
	maxLength?: number;
	autoFocus?: boolean;
	className?: string;
}

export const LiveCommentInput = memo(
	({ onSend, placeholder, sendLabel, maxLength = MAX_LIVE_COMMENT_LENGTH, autoFocus = false, className = '' }: LiveCommentInputProps) => {
		const inputRef = useRef<HTMLInputElement>(null);
		const mountedRef = useRef(true);
		const inFlightRef = useRef(false);
		const draftRef = useRef('');
		const [draft, setDraft] = useState('');

		useEffect(() => {
			mountedRef.current = true;
			return () => {
				mountedRef.current = false;
			};
		}, []);

		useEffect(() => {
			if (autoFocus) inputRef.current?.focus();
		}, [autoFocus]);

		const canSend = useMemo(() => draft.trim().length > 0, [draft]);

		const sendButtonClassName = useMemo(
			() => (canSend ? 'btn-primary btn-primary-hover cursor-pointer' : 'bg-theme-input text-theme-primary opacity-60 cursor-not-allowed'),
			[canSend]
		);

		const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
			const next = event.target.value;
			draftRef.current = next;
			setDraft(next);
		}, []);

		const submit = useCallback(() => {
			if (inFlightRef.current) return;
			const text = draftRef.current;
			if (!text.trim()) return;
			inFlightRef.current = true;
			let result: boolean | Promise<boolean>;
			try {
				result = onSend(text);
			} catch {
				inFlightRef.current = false;
				return;
			}
			if (typeof result === 'boolean') {
				inFlightRef.current = false;
				if (result && draftRef.current === text) {
					draftRef.current = '';
					setDraft('');
				}
				return;
			}
			void Promise.resolve(result)
				.then((sent) => {
					if (mountedRef.current && sent && draftRef.current === text) {
						draftRef.current = '';
						setDraft('');
					}
				})
				.catch(() => undefined)
				.finally(() => {
					inFlightRef.current = false;
				});
		}, [onSend]);

		const handleKeyDown = useCallback(
			(event: KeyboardEvent<HTMLInputElement>) => {
				if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
					event.preventDefault();
					submit();
				}
			},
			[submit]
		);

		const handleSendClick = useCallback(() => {
			submit();
		}, [submit]);

		return (
			<div
				className={`pointer-events-auto flex w-[320px] max-w-[calc(100%-2rem)] items-center gap-2 rounded-full border-theme-primary bg-theme-setting-primary py-1.5 pl-4 pr-1.5 shadow-lg transition-colors focus-within:!border-[var(--border-focus)] ${className}`}
			>
				<input
					ref={inputRef}
					type="text"
					value={draft}
					onChange={handleChange}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					maxLength={maxLength}
					aria-label={placeholder}
					className="min-w-0 flex-1 bg-transparent text-sm text-theme-message outline-none placeholder:text-theme-primary"
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
