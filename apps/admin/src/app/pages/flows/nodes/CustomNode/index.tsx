import { Icons } from '@mezon/ui';
import { Handle, Position, useEdges, useStore } from '@xyflow/react';
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
	onHandleHover?: (e: React.MouseEvent, nodeId: string, handleId: string, label: string) => void;
	onHandleLeave?: () => void;
}

const CustomNode = ({ data, bridgeSchema, anchors, label, Icon, initialValue, onHandleHover, onHandleLeave }: CustomNodeProps) => {
	const { flowDispatch } = useContext(FlowContext);
	const edges = useEdges();

	const connection = useStore((state) => state.connection);

	const isHandleConnected = (handleId: string) => {
		return edges.some((edge) => edge.source === data.id && edge.sourceHandle === handleId);
	};

	const isConnectingFromThisNode = connection.inProgress && connection.fromNode?.id === data.id;

	const hasMultipleSources = anchors.source && anchors.source.length > 1;
	const hasSingleSource = anchors.source && anchors.source.length === 1;

	const nodeHeight = hasMultipleSources ? Math.max(80, anchors.source.length * 30 + 20) : 'auto';

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
		const defaultValue = data.defaultValue;
		flowDispatch(copyNode(nodeId, defaultValue));
	};

	const handleShowDetail = (e: React.MouseEvent<HTMLButtonElement>) => {
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
			className="border-2 rounded-lg bg-slate-50 dark:bg-gray-600 relative group hover:border-blue-300 flex"
			style={{ minHeight: nodeHeight }}
		>
			{/* Main Node Content */}
			<div className="w-[150px] p-2 flex custom-drag-handle items-center">
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

			{hasMultipleSources && (
				<>
					{anchors.source.map((item, index) => {
						const connected = isHandleConnected(item.id);
						const totalSources = anchors.source.length;
						const spacing = 100 / (totalSources + 1);
						const topPosition = spacing * (index + 1);

						return (
							<React.Fragment key={index}>
								{/* Line và button nằm ngoài node */}
								<div
									className={`absolute flex items-center transition-all duration-300 ease-in-out ${
										connected || isConnectingFromThisNode ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
									}`}
									style={{ top: `${topPosition}%`, right: '-70px', transform: 'translateY(-50%)' }}
								>
									<div className="w-[50px] h-[2px] bg-gray-300 dark:bg-gray-500"></div>
									<button
										className="w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-md flex items-center justify-center shadow-md text-white z-50"
										onMouseEnter={(e) => {
											if (!isConnectingFromThisNode && !connected && onHandleHover) {
												onHandleHover(e, data.id, item.id, label);
											}
										}}
										onMouseLeave={() => {
											if (onHandleLeave) onHandleLeave();
										}}
									>
										<svg
											width="10"
											height="10"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="3"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<line x1="12" y1="5" x2="12" y2="19"></line>
											<line x1="5" y1="12" x2="19" y2="12"></line>
										</svg>
									</button>
								</div>
								{/* Handle dot và label sát node */}
								<div
									className="absolute flex items-center"
									style={{ top: `${topPosition}%`, right: 0, transform: 'translateY(-50%)' }}
								>
									<span className="text-xs text-gray-500 dark:text-gray-300 mr-2 min-w-[40px] text-right">{item.text}</span>
									<Handle
										type="source"
										id={item.id}
										position={Position.Right}
										className="group-hover:bg-blue-300 bg-gray-700 w-[10px] h-[10px]"
									/>
								</div>
							</React.Fragment>
						);
					})}
				</>
			)}

			{/* Single Source Handle */}
			{hasSingleSource && (
				<>
					<div
						className={`absolute right-[-70px] top-1/2 transform -translate-y-1/2 flex items-center transition-all duration-300 ease-in-out ${
							isHandleConnected(anchors.source[0].id) || isConnectingFromThisNode
								? 'opacity-0 -translate-x-8 pointer-events-none'
								: 'opacity-100 translate-x-0 pointer-events-auto'
						}`}
					>
						<div className="w-[50px] h-[2px] bg-gray-300 dark:bg-gray-500"></div>
						<button
							className="w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-md flex items-center justify-center shadow-md text-white z-50"
							onMouseEnter={(e) => {
								if (!isConnectingFromThisNode && !isHandleConnected(anchors.source[0].id) && onHandleHover) {
									onHandleHover(e, data.id, anchors.source[0].id, label);
								}
							}}
							onMouseLeave={() => {
								if (onHandleLeave) onHandleLeave();
							}}
						>
							<svg
								width="10"
								height="10"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
						</button>
					</div>
					<Handle
						type="source"
						id={anchors.source[0].id}
						position={Position.Right}
						className="group-hover:bg-blue-300 bg-gray-700 absolute w-[10px] h-[10px] top-1/2"
					/>
				</>
			)}

			{/* Render all target anchors */}
			{anchors.target?.map((item, index) => {
				const totalTargets = anchors.target.length;
				const spacing = 100 / (totalTargets + 1);
				const topPosition = spacing * (index + 1);

				return (
					<Handle
						key={index}
						type="target"
						id={item.id}
						position={Position.Left}
						className="group-hover:bg-blue-300 bg-gray-700 absolute w-[10px] h-[10px]"
						style={{ top: `${topPosition}%` }}
					/>
				);
			})}
		</div>
	);
};

export default CustomNode;
