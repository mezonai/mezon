import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface SfuReconnectModalProps {
	loading: boolean;
	onRejoin: () => void;
	onExit: () => void;
}

export function SfuReconnectModal({ loading, onRejoin, onExit }: SfuReconnectModalProps) {
	const { t } = useTranslation('channelVoice');
	const dialogRef = useRef<HTMLDivElement>(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		const dialog = dialogRef.current;
		const previousFocus = dialog?.ownerDocument.activeElement as HTMLElement | null;
		dialog?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
		return () => {
			if (previousFocus?.isConnected) previousFocus.focus();
		};
	}, []);

	return (
		<div className="absolute inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/35 p-5 backdrop-blur-[2px]">
			<div
				ref={dialogRef}
				role="dialog"
				aria-labelledby={titleId}
				aria-describedby={descriptionId}
				aria-busy={loading}
				onKeyDown={(event) => {
					if (event.key === 'Escape') {
						event.preventDefault();
						event.stopPropagation();
						onExit();
					}
					if (event.key === 'Tab') {
						const buttons = dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
						if (!buttons?.length) return;
						const first = buttons[0];
						const last = buttons[buttons.length - 1];
						if (event.shiftKey && event.target === first) {
							event.preventDefault();
							last.focus();
						} else if (!event.shiftKey && event.target === last) {
							event.preventDefault();
							first.focus();
						}
					}
				}}
				className="my-auto w-[338px] max-w-full shrink-0 rounded-2xl border border-white/[0.06] bg-[#1b1c20]/95 p-5 text-[#d3d4d8] shadow-xl"
			>
				<h2 id={titleId} className="border-b border-white/5 pb-3 text-center text-lg font-semibold">
					{t('reconnectModal.title')}
				</h2>
				<p id={descriptionId} className="py-5 text-sm leading-[18px] text-[#b5b5b8]">
					{t('reconnectModal.description')}
				</p>
				<div className="flex flex-col gap-3">
					<button
						type="button"
						disabled={loading}
						onClick={onRejoin}
						className="h-11 rounded-full bg-[#5950f2] text-sm font-semibold text-white hover:bg-[#6860ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
					>
						{t(loading ? 'reconnectModal.joining' : 'reconnectModal.rejoin')}
					</button>
					<button
						type="button"
						onClick={onExit}
						className="h-11 rounded-full bg-[#131416] text-sm font-semibold hover:bg-[#27282d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
					>
						{t('reconnectModal.exit')}
					</button>
				</div>
			</div>
		</div>
	);
}
