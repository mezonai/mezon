export default function TabButton({
	label,
	color,
	active = false,
	onClick
}: {
	label: string;
	color?: string;
	active?: boolean;
	onClick?: () => void;
}) {
	const defaultActiveColor = '#5C4BFE';
	const backgroundColor = active ? (color ?? defaultActiveColor) : undefined;

	return (
		<button
			role="tab"
			aria-pressed={active}
			onClick={onClick}
			className={`px-5 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none ${
				active ? 'text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 dark:text-textSecondary'
			}`}
			style={{ backgroundColor }}
		>
			{label}
		</button>
	);
}
