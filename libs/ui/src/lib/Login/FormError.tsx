import { memo } from 'react';
import { MezonIcon } from '../mezon-icons';
import * as MzIcons16 from '../mezon-icons/16';

interface FormErrorProps {
	message: string;
}

const FormError = memo(({ message }: FormErrorProps) => {
	if (!message) return null;

	return (
		<div className="text-sm text-red-500 flex items-center gap-1 mt-1">
			<MezonIcon icon={MzIcons16.mzInfo} className="text-red-500" />
			<span>{message}</span>
		</div>
	);
});

export default FormError;
