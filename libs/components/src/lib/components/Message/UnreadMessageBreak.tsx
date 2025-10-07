export default function UnreadMessageBreak() {
	return (
		<div className="flex items-center gap-2">
			<div className="flex-1 h-[1px] bg-red-500"></div>
			<div className="flex items-center">
				<div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[4px] border-r-red-500 border-b-[6px] border-b-transparent"></div>
				<span style={{ fontSize: 8 }} className="text-xs font-semibold text-white uppercase bg-red-500 px-[4px] rounded whitespace-nowrap">
					New
				</span>
			</div>
		</div>
	);
}
