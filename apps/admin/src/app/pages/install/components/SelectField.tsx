export type SelectFieldConfig<T> = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	errorMessage?: string;
	options?: any[];
};

const SelectField = <T,>({ label, options, value, onChange, errorMessage }: SelectFieldConfig<T>) => {
	return (
		<div className="flex flex-col gap-2 p-4 bg-[#2b2d31] text-left">
			<label className="text-base  font-medium text-colorWhiteSecond">{label}</label>
			<select className="p-2 rounded border bg-bgLightMode dark:bg-bgProfileBody" value={value} onChange={(e) => onChange(e.target.value)}>
				<option value="">-- Select --</option>
				{options?.map((option, index) => (
					<option key={index} value={option?.value}>
						{option?.label}
					</option>
				))}
			</select>
			{errorMessage && <span className="text-red-500 text-sm">{errorMessage}</span>}
		</div>
	);
};

export default SelectField;
