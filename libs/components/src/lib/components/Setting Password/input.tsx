import { memo, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
}

export const Input = memo(({ label, error, id, className = '', ...props }: InputProps) => {
	return (
		<div className="space-y-2">
			{label && (
				<label htmlFor={id} className="block text-sm font-medium">
					{label}
				</label>
			)}
			<input
				id={id}
				className={`w-full px-3 py-2 border rounded-md ${
					error ? 'border-red-500' : 'border-gray-300'
				} focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
				{...props}
			/>
			{error && <p className="text-red-500 text-sm">{error}</p>}
		</div>
	);
});
