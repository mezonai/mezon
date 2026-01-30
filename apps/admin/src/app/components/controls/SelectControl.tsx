type Option = {
	value: string;
	label: string;
};

type Props = {
	value: string;
	onChange: (v: string) => void;
	options: Option[];
	className?: string;
	id?: string;
	name?: string;
};

export default function SelectControl({ value, onChange, options, className, id, name }: Props) {
	return (
		<select id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
			{options.map((o) => (
				<option key={o.value} value={o.value}>
					{o.label}
				</option>
			))}
		</select>
	);
}
