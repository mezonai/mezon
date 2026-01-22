import { memo } from 'react';
import { Icons } from '../Icons';

interface FormErrorProps {
	message: string;
}

const FormError = memo(({ message }: FormErrorProps) => {
	if (!message) return null;

	return (
		<div className="text-sm text-red-500 flex items-center gap-1 mt-1">
			<Icons.InfoIcon className="w-3 h-3 text-red-500" />
			<span>{message}</span>
		</div>
	);
});

export default FormError;
