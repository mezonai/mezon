type GroupPanelsProps = {
	children: React.ReactNode;
};

const GroupPanels = ({ children }: GroupPanelsProps) => {
	return <div className="flex flex-col pb-1 mb-1 border-b-theme-primary  last:border-b-0 last:mb-0 last:pb-0 no-divider-last">{children}</div>;
};

export default GroupPanels;
