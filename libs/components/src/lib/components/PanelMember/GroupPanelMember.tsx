type GroupPanelMemberProps = {
	children: React.ReactNode;
};

const GroupPanelMember = ({ children }: GroupPanelMemberProps) => {
	return (
		<div className="flex flex-col pb-1 mb-1 border-b-[0.08px] border-b-[#6A6A6A] last:border-b-0 last:mb-0 last:pb-0 no-divider-last ">
			{children}
		</div>
	);
};

export default GroupPanelMember;
