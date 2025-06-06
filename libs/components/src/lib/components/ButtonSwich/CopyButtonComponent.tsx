import { Icons } from '@mezon/ui';
import { deselectCurrent } from '@mezon/utils';
import React from 'react';
import { ButtonSwitch } from '.';
interface CopyButtonComponentProps {
	title?: string;
	copyText?: string;
	disabled?: boolean;
	duration?: number;
	className?: string;
	format?: 'text/plain' | 'text/html'; // mở rộng hỗ trợ định dạng
	debug?: boolean;
}

const CopyButtonComponent: React.FC<CopyButtonComponentProps> = ({
	title,
	copyText,
	disabled,
	duration,
	className,
	format = 'text/plain',
	debug = false
}) => {
	const handleCopy = React.useCallback(() => {
		if (!copyText) return;

		const fallbackCopy = () => {
			try {
				const reselect = deselectCurrent();

				const span = document.createElement('span');
				span.textContent = copyText;
				span.ariaHidden = 'true';
				span.style.all = 'unset';
				span.style.position = 'fixed';
				span.style.top = '0';
				span.style.clip = 'rect(0, 0, 0, 0)';
				span.style.whiteSpace = 'pre';
				span.style.userSelect = 'text';
				document.body.appendChild(span);

				const range = document.createRange();
				range.selectNodeContents(span);

				const selection = window.getSelection();
				if (selection) {
					selection.removeAllRanges();
					selection.addRange(range);
				}

				const successful = document.execCommand('copy');
				if (!successful) throw new Error('Fallback copy unsuccessful');

				selection?.removeAllRanges();
				document.body.removeChild(span);
				reselect();
			} catch (err) {
				debug && console.error('Fallback copy failed:', err);
				window.prompt('Copy this text:', copyText);
			}
		};

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(copyText).catch((err) => {
				debug && console.warn('navigator.clipboard failed:', err);
				fallbackCopy();
			});
		} else {
			fallbackCopy();
		}
	}, [copyText, format, debug]);

	return (
		<ButtonSwitch
			className={`dark:text-[#B5BAC1] text-colorTextLightMode gap-2 p-1 text-sm bg-transparent dark:hover:bg-zinc-700 hover:bg-bgLightModeButton ${className ?? ''}`}
			iconDefault={<Icons.CopyIcon />}
			iconSwitch={<Icons.Tick defaultSize="w-4 h-4" fill="currentColor" />}
			onClick={handleCopy}
			disabled={disabled}
			title={title}
			duration={duration}
		/>
	);
};

export default React.memo(CopyButtonComponent);
