import { Icons } from '@mezon/ui';
import { memo } from 'react';

interface FormErrorProps {
	message: string;
}

export const FormError = memo(({ message }: FormErrorProps) => {
	if (!message) return null;

	return (
		<div className="text-sm text-red-500 flex items-center gap-1 mt-1">
			<Icons.InfoIcon className="w-3 h-3 text-red-500" />
			<span>{message}</span>
		</div>
	);
});
