import Prism from 'prismjs';
import 'prismjs/themes/prism.css'; // Optional: You can choose different themes
import Editor from 'react-simple-code-editor';

// Import the languages you need to support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import { useEffect, useMemo } from 'react';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';

type CustomFormFieldProps = HTMLFieldProps<string, HTMLDivElement> & {
	label?: string;
	language?: 'javascript' | 'json' | string;
	readOnly?: boolean;
	disabled?: boolean;
};

const toStringValue = (value: unknown): string => {
	if (value === null || value === undefined) {
		return '';
	}
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'object') {
		try {
			return JSON.stringify(value, null, 2);
		} catch (e) {
			console.error('Failed to stringify value:', e);
			return '';
		}
	}
	return String(value);
};

function CodeEditorField({
	onChange,
	value,
	label,
	errorMessage,
	showInlineError,
	fieldType,
	changed,
	hidden,
	language = 'javascript',
	readOnly = false,
	disabled = false,
	...props
}: CustomFormFieldProps) {
	const stringValue = useMemo(() => toStringValue(value), [value]);

	useEffect(() => {
		if (value !== null && value !== undefined && typeof value === 'object') {
			const converted = JSON.stringify(value, null, 2);
			onChange(converted);
		}
	}, []);

	const highlight = useMemo(() => {
		return (code: string) => {
			if (!code) {
				return '';
			}
			try {
				if (language === 'json') {
					return Prism.highlight(code, Prism.languages.json, 'json');
				}
				return Prism.highlight(code, Prism.languages.javascript, 'javascript');
			} catch (e) {
				console.error('Highlight error:', e);
				return code;
			}
		};
	}, [language]);

	const handleChange = (newCode: string) => {
		if (readOnly || disabled) return;
		onChange(newCode);
	};

	const isDisabled = readOnly || disabled;

	return (
		<div className="CodeEditorField mt-2">
			{label && <label className="block text-sm">{label}</label>}
			<Editor
				value={stringValue}
				className={`my-1 block w-full text-[12px] px-3 py-2 border-[1px] focus:border-[1px] dark:bg-gray-600 focus:border-gray-500 focus-visible:border-0 focus:ring-0 focus-visible:ring-gray-100 focus-within:ring-0 focus:ring-transparent ${
					isDisabled ? 'opacity-70 cursor-not-allowed' : ''
				}`}
				onValueChange={handleChange}
				onDragStart={(e) => e.preventDefault()}
				highlight={highlight}
				padding={10}
				autoCapitalize="off"
				style={{
					minHeight: '100px',
					fontFamily: '"Fira code", "Fira Mono", monospace',
					fontSize: 12
				}}
				disabled={isDisabled}
				readOnly={isDisabled}
			/>
			{showInlineError && errorMessage && <span className="text-xs text-red-500">{errorMessage}</span>}
		</div>
	);
}

export default connectField<CustomFormFieldProps>(CodeEditorField);
