type TextFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	errorMessage?: string;
};

const TextField = ({ label, value, onChange, placeholder, errorMessage }: TextFieldProps) => {
	return (
		<div className="flex flex-col gap-1 p-0 bg-transparent w-full">
			<label className="block text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
				{label}
			</label>

			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`w-full h-9 rounded-lg text-xs font-semibold px-3.5 transition-all duration-300 focus:outline-none focus:ring-2
                    ${
						errorMessage
							? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
							: 'border-slate-200 dark:border-white/[0.04] focus:ring-violet-500/20 focus:border-violet-500/40 dark:focus:border-violet-500/30'
					}
                    bg-slate-50 dark:bg-[#171a2a] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm`}
			/>

			{errorMessage && <p className="text-red-500 text-[10px] font-medium text-left mt-0.5 pl-1 animate-fade-in">{errorMessage}</p>}
		</div>
	);
};

export default TextField;
