type TextFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	errorMessage?: string;
};

const TextField = ({ label, value, onChange, placeholder, errorMessage }: TextFieldProps) => {
	return (
		<div className="px-4 p-4 rounded bg-[#f9fafb] dark:bg-[#1e1f22]">
			<label className="block text-left text-sm font-medium mb-1 text-[#111827] dark:text-[#d1d5db]">{label}</label>

			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`w-full rounded border p-1 my-1 px-3 py-2 focus:ring-2 focus:outline-none transition
        ${errorMessage ? 'border-red-500' : 'border-[#d1d5db] dark:border-[#4b5563]'}
        bg-white text-[#111827] placeholder-[#9ca3af] dark:bg-[#2d2f33] dark:text-[#d1d5db] dark:placeholder-[#6b7280]
        focus:ring-[#5865F2]`}
			/>

			{errorMessage && <p className="text-xs text-red-500 mt-1">{errorMessage}</p>}
		</div>
	);
};

export default TextField;
