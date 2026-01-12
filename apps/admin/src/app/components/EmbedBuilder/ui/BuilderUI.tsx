import React, { useEffect, useRef, useState } from 'react';

export const BuilderSectionWrapper: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
	title,
	children,
	defaultOpen = false
}) => {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="border border-gray-200 rounded-lg mb-4 bg-white shadow-sm overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
			>
				<span className="font-semibold text-gray-700 text-sm">{title}</span>
				<span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
					<svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</span>
			</button>
			{isOpen && <div className="p-4 space-y-4">{children}</div>}
		</div>
	);
};

/* --- Form Elements --- */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
}

export const BuilderTextInput: React.FC<InputProps> = ({ label, className = '', ...props }) => (
	<div className="w-full">
		{label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>}
		<input
			className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900
      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      transition-shadow ${className}`}
			{...props}
		/>
	</div>
);

export const BuilderMediaInput: React.FC<InputProps> = ({ label, className = '', value, onChange, ...props }) => {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [internalValue, setInternalValue] = useState<string | number | readonly string[]>(value || '');

	useEffect(() => {
		if (value !== undefined) {
			setInternalValue(value);
		}
	}, [value]);

	const handleFileClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const objectUrl = URL.createObjectURL(file);
			setInternalValue(objectUrl);

			if (onChange) {
				const event = {
					...e,
					target: {
						...e.target,
						name: props.name,
						value: objectUrl
					}
				} as React.ChangeEvent<HTMLInputElement>;
				onChange(event);
			}
		}
	};

	const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInternalValue(e.target.value);
		if (onChange) onChange(e);
	};

	return (
		<div className="w-full">
			{label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>}
			<div className="relative">
				<input
					type="text"
					className={`w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900
          placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-shadow ${className}`}
					value={internalValue}
					onChange={handleTextChange}
					placeholder="https://..."
					{...props}
				/>
				<button
					type="button"
					onClick={handleFileClick}
					className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-blue-600 cursor-pointer"
					title="Choose image file"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</button>
				<input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
			</div>
		</div>
	);
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	label?: string;
}

export const BuilderTextarea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => (
	<div className="w-full">
		{label && <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>}
		<textarea
			className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900
      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      transition-shadow min-h-[80px] resize-y ${className}`}
			{...props}
		/>
	</div>
);

export const BuilderColorPicker: React.FC<{ label: string; value?: string; onChange: (val: string) => void }> = ({
	label,
	value = '#000000',
	onChange
}) => (
	<div className="flex items-center justify-between">
		<label className="text-sm font-medium text-gray-700">{label}</label>
		<div className="flex items-center gap-2">
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-24 px-2 py-1 text-xs border border-gray-300 rounded text-gray-700 font-mono"
			/>
			<input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
		</div>
	</div>
);

export const BuilderSwitch: React.FC<{ label: string; checked?: boolean; onChange: (checked: boolean) => void }> = ({
	label,
	checked = false,
	onChange
}) => (
	<div className="flex items-center justify-between py-2">
		<span className="text-sm font-medium text-gray-700">{label}</span>
		<button
			type="button"
			onClick={() => onChange(!checked)}
			className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
				checked ? 'bg-blue-600' : 'bg-gray-200'
			}`}
		>
			<span
				className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
					checked ? 'translate-x-5' : 'translate-x-0'
				}`}
			/>
		</button>
	</div>
);

export const BuilderButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({
	children,
	variant = 'primary',
	className = '',
	...props
}) => {
	const baseStyle = 'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';
	const variants = {
		primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
		secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
		danger: 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500',
		ghost: 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
	};

	return (
		<button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
			{children}
		</button>
	);
};
