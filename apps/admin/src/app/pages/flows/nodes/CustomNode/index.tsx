import { Icons } from '@mezon/ui';
import { Handle, Position } from '@xyflow/react';
import {
	changeOpenModalNodeDetail,
	changeOpenModalNodeEditing,
	changeSelectedNode,
	copyNode,
	deleteNode,
	setNodeEdit
} from '../../../../stores/flow/flow.action';

import React, { useContext } from 'react';

import { FlowContext } from '../../../../context/FlowContext';
import type { INodeEdit, ISelectedNode } from '../../../../stores/flow/flow.interface';
interface IAnchor {
	id: string;
	text: string;
}

interface CustomNodeProps {
	data: {
		type: string;
		id: string;
		defaultValue: {
			[key: string]: string;
		};
	};
	Icon: React.ComponentType;
	label: string;
	// Bỏ prop schema vì không dùng nữa
	bridgeSchema: {
		type: string;
		properties: Record<string, { type: string; uniforms: { component: React.ComponentType; label: string; name: string } }>;
		required: string[];
	};
	anchors: {
		source: IAnchor[];
		target: IAnchor[];
	};
	initialValue?: Record<string, unknown>;
	// Thêm props mới để xử lý hover
	onHandleHover?: (e: React.MouseEvent, nodeId: string, handleId: string, label: string) => void;
	onHandleLeave?: () => void;
}

const CustomNode = ({ data, bridgeSchema, anchors, label, Icon, initialValue, onHandleHover, onHandleLeave }: CustomNodeProps) => {
	const { flowDispatch } = useContext(FlowContext);

	const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
		e.stopPropagation();
		const nodeData: INodeEdit = {
			id: data.id,
			label,
			type: data.type,
			data: data.defaultValue ?? initialValue
		};
		flowDispatch(setNodeEdit(nodeData));
		flowDispatch(changeOpenModalNodeEditing(true));
	};

	const handleDeleteNode = (e: React.MouseEvent<HTMLButtonElement>, nodeId: string) => {
		e.stopPropagation();
		flowDispatch(deleteNode(nodeId));
	};

	const handleCopyNode = (e: React.MouseEvent<HTMLButtonElement>, nodeId: string) => {
		e.stopPropagation();
		// Lấy dữ liệu trực tiếp từ data props, không cần qua ref hay getModel
		const defaultValue = data.defaultValue;
		flowDispatch(copyNode(nodeId, defaultValue));
	};

	const handleShowDetail = (e: React.MouseEvent<HTMLButtonElement>) => {
		// ... existing code ...
		const parameters = [];
		for (const schema in bridgeSchema.properties) {
			parameters.push({
				name: schema,
				type: bridgeSchema.properties[schema].type,
				label: bridgeSchema.properties[schema].uniforms.label
			});
		}
		const nodeData: ISelectedNode = {
			type: data.type,
			label,
			description: '',
			parameters
		};
		flowDispatch(changeSelectedNode(nodeData));
		flowDispatch(changeOpenModalNodeDetail(true));
		e.stopPropagation();
	};

	return (
		<div
			onDoubleClick={(e) => handleDoubleClick(e)}
			className="w-[150px] border-2 rounded-lg bg-slate-50 dark:bg-gray-600 relative group hover:border-blue-300"
		>
			<div className="p-2 flex custom-drag-handle">
				<Icon />
				<span className="ml-2 font-medium flex items-center">{label}</span>
			</div>

			{/* Node actions */}
			<div className="absolute top-[-60px] right-0 rounded-md flex-row gap-[10px] shadow-lg p-2 bg-slate-50 dark:bg-gray-600 hidden group-hover:flex">
				<div className="bg-transparent absolute top-[100%] left-0 w-full h-[30px]"></div>
				<button onClick={(e) => handleCopyNode(e, data.id)} className="p-2 rounded-full hover:bg-[#cccccc66] shadow-md">
					<Icons.CopyIcon />
				</button>
				<button onClick={(e) => handleDeleteNode(e, data.id)} className="p-2 rounded-full hover:bg-[#cccccc66] shadow-md text-sm">
					<Icons.DeleteMessageRightClick />
				</button>
				<button onClick={(e) => handleShowDetail(e)} className="p-2 rounded-full hover:bg-[#cccccc66] shadow-md">
					<Icons.EyeOpen />
				</button>
			</div>

			{/* Render all source anchors */}
			{anchors.source?.map((item, index) => {
				return (
					<Handle
						key={index}
						type={'source'}
						id={item.id}
						position={Position.Right}
						className={`group-hover:bg-blue-300 bg-gray-700 absolute w-[10px] h-[10px] top-auto`}
						style={{ bottom: `${12 + index * 20}px` }}
						// Thêm sự kiện hover
						onMouseEnter={(e) => onHandleHover && onHandleHover(e, data.id, item.id, label)}
						onMouseLeave={() => onHandleLeave && onHandleLeave()}
					/>
				);
			})}
			{/* Render all target anchors */}
			{anchors.target?.map((item, index) => {
				return (
					<Handle
						key={index}
						type={'target'}
						id={item.id}
						position={Position.Left}
						className={`group-hover:bg-blue-300 bg-gray-700 absolute w-[10px] h-[10px]`}
						style={{ top: `${12 + 20 * index}px` }}
					/>
				);
			})}
		</div>
	);
};

export default CustomNode;
