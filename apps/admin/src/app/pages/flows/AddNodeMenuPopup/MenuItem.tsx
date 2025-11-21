import React, { useContext } from 'react';
import { FlowContext } from '../../../context/FlowContext';
import { changeNodeType } from '../../../stores/flow/flow.action';
import type { INodeType } from '../../../stores/flow/flow.interface';

interface MenuItemProps {
	title: string;
	description: string;
	nodeType: INodeType;
}
const MenuItem = ({ title, description, nodeType }: MenuItemProps) => {
	const { flowDispatch } = useContext(FlowContext);
	const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
		flowDispatch(changeNodeType(nodeType));
		event.dataTransfer.effectAllowed = 'move';
	};
	return (
		<div
			className="menu-item cursor-move p-2 mt-1 mb-1 radius-md rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700 shadow-md transition-all active:scale-95"
			onDragStart={onDragStart}
			draggable
		>
			<div className="flex gap-2 items-center w-full">
				{/* <div className="w-[50px] flex items-center justify-center">
					<img src={imageUrl} alt="" className="rounded-full w-[40px] h-[40px] select-none" />
				</div> */}
				<div className="flex-1 select-none">
					<div className="text-[14px] font-semibold">{title}</div>
					<p className="text-[12px]">{description}</p>
				</div>
			</div>
		</div>
	);
};
export default MenuItem;
