import { useAuth } from '@mezon/core';
import { Icons } from '@mezon/ui';
import {
	Background,
	BackgroundVariant,
	Connection,
	Controls,
	Edge,
	EdgeChange,
	NodeChange,
	Panel,
	ReactFlow,
	useEdgesState,
	useNodesState,
	useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Popover } from 'flowbite-react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { FlowContext } from '../../../context/FlowContext';
import flowService from '../../../services/flowService';
import { addEdge, addNode, changeLoading, deleteNode, setEdgesContext, setNodesContext } from '../../../stores/flow/flow.action';
import { IEdge, IFlowDataRequest, IFlowDetail, INode, INodeType, IParameter } from '../../../stores/flow/flow.interface';
import ExampleFlow from '../../flowExamples/ExampleFlows';
import AddNodeMenuPopup from '../AddNodeMenuPopup';
import FlowChatPopup from '../FlowChat';
import CustomNode from '../nodes/CustomNode';
import NodeTypes from '../nodes/NodeType';
import FlowHeaderBar from './FlowHeaderBar';
import NodeDetailModal from './NodeDetailModal';
import SaveFlowModal from './SaveFlowModal';

const Flow = () => {
	const { userProfile } = useAuth();
	const reactFlowWrapper = useRef(null);
	const navigate = useNavigate();
	const { screenToFlowPosition } = useReactFlow();

	const { flowState, flowDispatch } = React.useContext(FlowContext);
	const { flowId, applicationId, exampleFlowId } = useParams();
	const [openModalSaveFlow, setOpenModalSaveFlow] = React.useState(false);
	const [isExampleFlow, setIsExampleFlow] = React.useState(true);
	const [nodes, setNodes, onNodesChange] = useNodesState(flowState.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(flowState.edges);

	const nodeRefs = useRef<{ [key: string]: HTMLElement | null }>({} as { [key: string]: HTMLElement });

	const [flowData, setFlowData] = React.useState<{ flowName: string; description: string }>({
		flowName: 'Untitled Flow',
		description: ''
	});

	useEffect(() => {
		setNodes(flowState.nodes);
	}, [flowState.nodes, setNodes]);
	useEffect(() => {
		setEdges(flowState.edges);
	}, [flowState.edges, setEdges]);

	const onConnect = useCallback(
		(params: Connection) => {
			flowDispatch(addEdge(params as Edge));
		},
		[flowDispatch]
	);
	const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}, []);

	const listNodeType = useMemo(() => {
		const obj: { [key: string]: (props: any) => JSX.Element } = {};
		NodeTypes.forEach((item, index) => {
			if (!obj[item.type]) {
				obj[item.type] = (props) => {
					if (item.type === 'webhook') {
						item.initialValue.url = `${process.env.NX_MEZON_FLOW_URL}/webhook/${applicationId}/{flowId}`;
					}
					return (
						<CustomNode
							{...props}
							schema={item.schema}
							label={item.label}
							initialValue={item.initialValue}
							bridgeSchema={item.bridgeSchema}
							anchors={item.anchors}
							ref={(el: HTMLElement | null) => {
								if (el) {
									nodeRefs.current[props.data.id] = el; // assign ref to nodeRefs when node is created
								} else {
									delete nodeRefs.current[props.data.id]; // delete ref when node is deleted
								}
							}}
						/>
					);
				};
			}
		});
		return obj;
	}, []);

	const handleClickSaveFlow = React.useCallback(async () => {
		let checkValidate = true;
		const formData: {
			[key: string]: {
				[key: string]: string;
			};
		} = Object.keys(nodeRefs.current).reduce(
			(data, nodeId) => {
				const nodeRef = nodeRefs.current[nodeId] as {
					getFormData?: () => {
						[key: string]: string;
					};
					checkValidate?: () => {
						[key: string]: string;
					};
				};
				data[nodeId] = nodeRef?.getFormData?.() ?? {};
				const check = nodeRef?.checkValidate?.();
				if (!check) checkValidate = false;
				return data;
			},
			{} as {
				[key: string]: {
					[key: string]: string;
				};
			}
		);

		if (!checkValidate) return;
		const listNodeInFlow: INode[] = [];
		nodes.forEach((node) => {
			const parameters = Object.keys(formData[node.id] ?? {}).map((key) => {
				let value = formData[node.id][key];
				if (typeof value !== 'string' && value !== null) {
					value = JSON.stringify(value);
				}
				return {
					parameterKey: key,
					parameterValue: value?.trim() ?? null
				};
			});
			const newNode: INode = {
				id: node.id,
				nodeType: node.type as INodeType,
				nodeName: node.type as INodeType,
				position: node.position,
				measured: { width: node.measured?.width ?? 0, height: node.measured?.height ?? 0 },
				parameters,
				data: {
					id: node.id ?? ''
				},
				selected: node.selected ?? false
			};
			listNodeInFlow.push(newNode);
		});
		const listEdgeInFlow: IEdge[] = [];
		edges.forEach((edge: Edge) => {
			const newEdge = {
				id: edge.id,
				sourceNodeId: edge.source,
				targetNodeId: edge.target,
				sourceHandleId: edge.sourceHandle ?? '',
				targetHandleId: edge.targetHandle ?? ''
			};
			listEdgeInFlow.push(newEdge);
		});

		if (!userProfile?.user?.id) {
			toast.error('User not found');
			return;
		}
		if (!flowData?.flowName) {
			toast.error('Flow name is required');
			return;
		}

		const flowDataSave: IFlowDataRequest = {
			referralId: userProfile?.user?.id,
			applicationId: applicationId ?? '',
			username: userProfile?.user?.username ?? '',
			flowName: flowData?.flowName,
			description: flowData?.description,
			isActive: true,
			connections: listEdgeInFlow,
			nodes: listNodeInFlow
		};

		if (!flowDataSave.nodes.length) {
			toast.error('Flow must have at least one node');
			return;
		}
		// if (!flowDataSave.connections.length) {
		// 	toast.error('Flow must have at least one connection');
		// 	return;
		// }
		flowDispatch(changeLoading(true));
		try {
			if (flowId) {
				await flowService.updateFlow({ ...flowDataSave, flowId });
				toast.success('Update flow success');
			} else {
				const response = await flowService.createNewFlow(flowDataSave);
				toast.success('Save flow success');
				navigate(`/developers/applications/${applicationId}/flow/${response.id}`);
			}
		} catch (error) {
			toast.error('Save flow failed');
		} finally {
			flowDispatch(changeLoading(false));
		}
	}, [
		applicationId,
		edges,
		flowData?.description,
		flowData?.flowName,
		flowDispatch,
		flowId,
		navigate,
		nodes,
		userProfile?.user?.id,
		userProfile?.user?.username
	]);

	const onChangeNode = (changes: NodeChange[]) => {
		onNodesChange(changes);
		flowDispatch(setNodesContext(nodes));
	};
	const onChangeEdge = (changes: EdgeChange[]) => {
		onEdgesChange(changes);
		flowDispatch(setEdgesContext(edges));
	};

	const onDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const position = screenToFlowPosition({
				x: event.clientX + 50,
				y: event.clientY + 50
			});
			flowDispatch(addNode(position));
		},
		[screenToFlowPosition, flowDispatch]
	);

	useEffect(() => {
		const setFlowDetail = (flowDetail: IFlowDetail) => {
			setFlowData({
				flowName: flowDetail?.flowName,
				description: flowDetail?.description
			});
			const nodeId: {
				[key: string]: string;
			} = {};
			const listNode = flowDetail.nodes?.map((node: INode) => {
				const params: {
					[key: string]: string;
				} = {};
				node?.parameters?.forEach((param: IParameter) => {
					let value = param.parameterValue;
					try {
						value = JSON.parse(param.parameterValue ?? '');
					} catch {
						value = param.parameterValue;
					}
					params[param.parameterKey] = value;
				});
				const id = uuidv4();
				nodeId[node.id] = id;
				return {
					id,
					type: node.nodeType,
					nodeName: node.nodeName,
					measured: typeof node.measured === 'string' ? JSON.parse(node.measured) : node.measured,
					position: typeof node.position === 'string' ? JSON.parse(node.position) : node.position,
					dragHandle: '.custom-drag-handle',
					data: {
						label: node.nodeName,
						id,
						defaultValue: params
					}
				};
			});
			flowDispatch(setNodesContext(listNode));
			const listEdge: Edge[] = (flowDetail.connections ?? []).map((edge: IEdge) => {
				return {
					id: uuidv4(),
					source: nodeId[edge.sourceNodeId],
					target: nodeId[edge.targetNodeId],
					sourceHandle: edge.sourceHandleId ?? '',
					targetHandle: edge.targetHandleId ?? ''
				};
			});
			flowDispatch(setEdgesContext(listEdge));
		};

		const checkIsExampleFlow = ExampleFlow.find((item) => item.id === flowId || item.id === exampleFlowId);
		if (exampleFlowId && checkIsExampleFlow) {
			setFlowDetail(checkIsExampleFlow.flowDetail);
			setIsExampleFlow(false);
			return;
		}

		if (!flowId) {
			flowDispatch(setNodesContext([]));
			flowDispatch(setEdgesContext([]));
			setIsExampleFlow(false);
			return;
		}

		if (checkIsExampleFlow) {
			setFlowDetail(checkIsExampleFlow.flowDetail);
			setIsExampleFlow(true);
			return;
		}

		const getDetailFlow = async () => {
			flowDispatch(changeLoading(true));
			try {
				const response: IFlowDetail = await flowService.getFlowDetail(flowId);
				setIsExampleFlow(false);
				setFlowDetail(response);
			} catch (error) {
				toast.error('Get flow detail failed');
			} finally {
				flowDispatch(changeLoading(false));
			}
		};
		getDetailFlow();
	}, [flowId, flowDispatch, exampleFlowId]);

	useEffect(() => {
		const onKeyUp = (event: KeyboardEvent) => {
			if (event.key === 'Delete') {
				const selectedNodes = document.querySelectorAll('.selected');
				if (selectedNodes.length) {
					selectedNodes.forEach((node) => {
						const nodeId = node.id;
						flowDispatch(deleteNode(nodeId));
					});
				}
			}
		};
		document.addEventListener('keyup', onKeyUp);
		return () => {
			document.removeEventListener('keyup', onKeyUp);
		};
	}, [nodes, edges, flowDispatch]);

	return (
		<div ref={reactFlowWrapper} className={'w-full transition-all fixed top-0 left-0 right-0 bottom-0 z-50 h-[calc(100vh-50px)]'}>
			<div className="px-4">
				<FlowHeaderBar
					onSaveFlow={handleClickSaveFlow}
					isExampleFlow={isExampleFlow}
					flowData={flowData}
					changeOpenModalSaveFlowData={setOpenModalSaveFlow}
				/>
			</div>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={listNodeType}
				onNodesChange={onChangeNode}
				onEdgesChange={onChangeEdge}
				onConnect={onConnect}
				onDrop={onDrop}
				onDragOver={onDragOver}
				minZoom={0.5}
				maxZoom={3}
				defaultViewport={{ x: 100, y: 100, zoom: 1 }}
				nodesDraggable={!isExampleFlow}
				nodesConnectable={!isExampleFlow}
				elementsSelectable={!isExampleFlow}
				zoomOnScroll={!isExampleFlow}
				colorMode="light"
			>
				{!isExampleFlow && (
					<Panel position="top-left">
						<Popover content={<AddNodeMenuPopup />} trigger="click">
							<button className="p-2 rounded-full hover:bg-[#cccccc66] shadow-md">
								<Icons.AddIcon className="w-6 h-6" />
							</button>
						</Popover>
					</Panel>
				)}
				<Controls />
				<Background className="dark:bg-bgPrimary bg-bgLightPrimary text-gray-500 dark:text-gray-100" variant={BackgroundVariant.Dots} />
			</ReactFlow>

			<Popover content={<FlowChatPopup />} trigger="click">
				<button className="p-2 rounded-full hover:bg-[#cccccc66] shadow-md absolute top-[80px] right-3">
					<Icons.IconChat className="w-6 h-6" />
				</button>
			</Popover>
			{flowState.isLoading && (
				<div className="fixed top-0 left-0 pt-2 right-0 bottom-0 bg-[#83818169] z-[999] text-center">
					<Icons.LoadingSpinner />
				</div>
			)}
			<SaveFlowModal
				flowData={flowData}
				changeFlowData={setFlowData}
				title="Save Flow"
				open={openModalSaveFlow}
				onClose={() => setOpenModalSaveFlow(false)}
			/>
			<NodeDetailModal />
		</div>
	);
};
export default Flow;
