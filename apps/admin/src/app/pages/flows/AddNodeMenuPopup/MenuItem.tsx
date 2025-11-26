import React, { useContext } from 'react';
import type { INodeMenu } from '.';
import { FlowContext } from '../../../context/FlowContext';
import { changeNodeType } from '../../../stores/flow/flow.action';

const MenuItem = ({ title, description, nodeType, icon }: INodeMenu) => {
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
				{icon && <div className="w-10 h-10">{icon}</div>}
				<div className="flex-1 select-none">
					<div className="text-[14px] font-semibold">{title}</div>
					<p className="text-[12px]">{description}</p>
				</div>
			</div>
		</div>
	);
};
export default MenuItem;
