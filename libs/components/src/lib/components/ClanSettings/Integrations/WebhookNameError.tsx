import type { ReactElement } from 'react';

interface WebhookNameErrorProps {
	message: string;
}

const WebhookNameError = ({ message }: WebhookNameErrorProps): ReactElement => {
	return (
		<div className="mt-2 flex items-start gap-2 text-colorTextError text-xs">
			<span
				className=" inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-colorTextError text-[10px] font-bold leading-none text-white"
				aria-hidden
			>
				!
			</span>
			<span>{message}</span>
		</div>
	);
};

export default WebhookNameError;
