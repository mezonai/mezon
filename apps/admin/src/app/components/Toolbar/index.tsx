type ToolbarPosition = 'left' | 'right' | 'top' | 'bottom';

const Toolbar = ({ children, position }: { children: React.ReactNode; position: ToolbarPosition }) => {
	const toolbarBaseClass = 'absolute flex items-center gap-2 p-1 z-40 bg-transparent';

	const positionClasses = {
		left: 'left-4 top-1/2 -translate-y-1/2 flex-col w-16 py-3',
		right: 'right-4 top-1/2 -translate-y-1/2 flex-col w-16 py-3',
		top: 'top-4 left-1/2 -translate-x-1/2 flex-row h-16 px-3',
		bottom: 'bottom-4 left-1/2 -translate-x-1/2 flex-row h-16 px-3'
	};

	return <div className={`${toolbarBaseClass} ${positionClasses[position]}`}>{children}</div>;
};

export default Toolbar;
