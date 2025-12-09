import React, { useEffect, useState } from 'react';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<string[], HTMLDivElement> & {
	label?: string;
};
function CustomTagsField({ onChange, value, label, errorMessage, showInlineError, fieldType, changed, ...props }: CustomFormFieldProps) {
	const [inputValue, setInputValue] = useState<string>('');
	const [tags, setTags] = useState<string[]>(Array.isArray(value) ? value : []);
	const handleChangeInputTags = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);
	};
	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		const specialCharRegex = /[!@#$%^&*(),.?":{}|<>\\[\];'`~+=/_\\-]/;
		if (specialCharRegex.test(e.key) || e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
			e.preventDefault();
			if (inputValue.trim()) {
				onChange([...tags, inputValue.trim()]);
				setInputValue('');
			}
		}
	};
	const handleBlur = () => {
		if (inputValue.trim()) {
			onChange([...tags, inputValue.trim()]);
			setInputValue('');
		}
	};
	const handleDeleteTag = (index: number) => {
		const newTags = tags.filter((_, i) => i !== index);
		onChange(newTags);
	};
	useEffect(() => {
		if (value && Array.isArray(value)) setTags(value);
	}, [value]);
	return (
		<div className="ImageField mt-2">
			{label && <label className="block text-sm">{label}</label>}
			<input
				className="my-1 block w-full px-3 py-2 rounded-md border-[1px] focus:border-[1px] bg-transparent focus-visible:outline-none focus-visible:border-[1px] focus-visible:border-gray-400"
				onChange={(e) => handleChangeInputTags(e)}
				onKeyDown={(e) => handleKeyDown(e)}
				onDragStart={(e) => e.preventDefault()}
				onBlur={handleBlur}
				draggable={false}
				value={inputValue}
				type={props.type}
				autoComplete="off"
				placeholder={props.placeholder}
				disabled={props.disabled}
				name={props.name}
				ref={undefined}
			/>
			<div className="flex flex-wrap gap-[4px]">
				{tags.map((tag, index) => (
					<span
						className="py-1 pl-2 pr-1 border-gray-300 border-[1px] bg-gray-100 dark:border-gray-600 dark:bg-gray-500 rounded text-sm flex items-center justify-between"
						key={index}
					>
						{tag}
						<span
							onClick={() => handleDeleteTag(index)}
							className="ml-2 cursor-pointer border-[1px] border-gray-200 rounded-full flex w-[20px] h-[20px] justify-center items-center hover:border-red-600"
						>
							x
						</span>
					</span>
				))}
			</div>
		</div>
	);
}
export default connectField<CustomFormFieldProps>(CustomTagsField);
