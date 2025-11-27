import { useAuth } from '@mezon/core';
import { Icons, Menu } from '@mezon/ui';
import type { Connection, Edge, EdgeChange, NodeChange } from '@xyflow/react';
import { Background, BackgroundVariant, Controls, Panel, ReactFlow, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { ApiIcon, ConditionIcon, ResponseIcon, TriggerIcon, WebhookIcon } from '../../../../assets/icons/nodeIcons';
import { FlowContext } from '../../../context/FlowContext';
import flowService from '../../../services/flowService';
import { addEdge, addNode, changeLoading, deleteNode, setEdgesContext, setNodesContext } from '../../../stores/flow/flow.action';
import type { IEdge, IFlowDataRequest, IFlowDetail, INode, INodeType, IParameter } from '../../../stores/flow/flow.interface';
import ExampleFlow from '../../flowExamples/ExampleFlows';
import AddNodeMenuPopup from '../AddNodeMenuPopup';
import FlowChatPopup from '../FlowChat';
import CustomNode from '../nodes/CustomNode';
import NextNodePopup from '../nodes/NextNodePopup';
import NodeTypes from '../nodes/NodeType';
import FlowHeaderBar from './FlowHeaderBar';
import NodeDetailModal from './NodeDetailModal';
import NodeEditingModal from './NodeEditingModal';
import SaveFlowModal from './SaveFlowModal';

const iconByType: Record<string, React.ComponentType> = {
	Trigger: TriggerIcon,
	Response: ResponseIcon,
	Webhook: WebhookIcon,
	Api: ApiIcon,
	Condition: ConditionIcon
};

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

	// --- State cho Popup ---
	const [popupConfig, setPopupConfig] = React.useState({
		visible: false,
		x: 0,
		y: 0,
		sourceNodeId: '',
		sourceHandleId: '',
		sourceNodeLabel: ''
	});
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const onHandleHover = useCallback((e: React.MouseEvent, nodeId: string, handleId: string, label: string) => {
		if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

		setPopupConfig({
			visible: true,
			x: e.clientX,
			y: e.clientY,
			sourceNodeId: nodeId,
			sourceHandleId: handleId,
			sourceNodeLabel: label
		});
	}, []);

	const onHandleLeave = useCallback(() => {
		hoverTimeoutRef.current = setTimeout(() => {
			setPopupConfig((prev) => ({ ...prev, visible: false }));
		}, 300); // Delay 300ms
	}, []);

	const onPopupEnter = useCallback(() => {
		if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
	}, []);

	const onPopupLeave = useCallback(() => {
		onHandleLeave();
	}, [onHandleLeave]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleAddNextNode = (nodeConfig: any) => {
		const { sourceNodeId, sourceHandleId } = popupConfig;
		const sourceNode = nodes.find((n) => n.id === sourceNodeId);

		if (!sourceNode) return;

		const newNodePosition = {
			x: sourceNode.position.x + (sourceNode.measured?.width || 150) + 100,
			y: sourceNode.position.y
		};

		const newNodeId = uuidv4();

		const newNode = {
			id: newNodeId,
			type: nodeConfig.type,
			position: newNodePosition,
			dragHandle: '.custom-drag-handle',
			data: {
				label: nodeConfig.label,
				id: newNodeId,
				defaultValue: nodeConfig.initialValue || {}
			},
			measured: { width: 150, height: 80 } // Default size
		};

		const newNodesList = [...nodes, newNode];
		flowDispatch(setNodesContext(newNodesList));

		const targetHandleId = nodeConfig.anchors?.target?.[0]?.id || `target-${newNodeId}`;

		const newEdge: Edge = {
			id: uuidv4(),
			source: sourceNodeId,
			sourceHandle: sourceHandleId,
			target: newNodeId,
			targetHandle: targetHandleId,
			type: 'default'
		};

		flowDispatch(addEdge(newEdge));

		setPopupConfig((prev) => ({ ...prev, visible: false }));
	};

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

	// handle drag, drop and connect nodes
	const onConnect = useCallback(
		(params: Connection) => {
			flowDispatch(addEdge(params as Edge));
		},
		[flowDispatch]
	);

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	const onConnectStart = useCallback(() => {}, []);

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	const onConnectEnd = useCallback(() => {}, []);

	const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}, []);

	// create a list node type from NodeType and CustomNode to use in ReactFlow
	const listNodeType = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const obj: { [key: string]: (props: any) => JSX.Element } = {};
		NodeTypes.forEach((item) => {
			if (!obj[item.type]) {
				obj[item.type] = (props) => {
					if (item.type === 'webhook') {
						item.initialValue.url = `${process.env.NX_MEZON_FLOW_URL}/webhook/${applicationId}/{flowId}`;
					}
					return (
						<CustomNode
							{...props}
							label={item.label}
							Icon={iconByType[item.label]}
							initialValue={item.initialValue}
							bridgeSchema={item.bridgeSchema}
							anchors={item.anchors}
							onHandleHover={onHandleHover}
							onHandleLeave={onHandleLeave}
						/>
					);
				};
			}
		});
		return obj;
	}, [applicationId, onHandleHover, onHandleLeave]);

	const handleClickSaveFlow = React.useCallback(async () => {
		let checkValidate = true;

		// Validate all nodes directly using Schema and Data in State
		nodes.forEach((node) => {
			const nodeConfig = NodeTypes.find((t) => t.type === node.type);
			if (nodeConfig?.schema) {
				try {
					// Validate data stored in node.data.defaultValue against the schema
					nodeConfig.schema.validateSync(node.data.defaultValue, { abortEarly: false });
				} catch (error) {
					checkValidate = false;
				}
			}
		});

		// check validating of all nodes, if one node is invalid, return
		if (!checkValidate) {
			toast.error('Please check invalid nodes');
			return;
		}

		const listNodeInFlow: INode[] = [];
		nodes.forEach((node) => {
			// Use data from the 'nodes' state directly, which is synced with FlowContext
			const nodeData = (node.data.defaultValue as Record<string, string>) || {};
			const parameters = Object.keys(nodeData).map((key) => {
				const value = nodeData[key];
				return {
					parameterKey: key,
					parameterValue: typeof value === 'object' ? JSON.stringify(value) : (value?.toString().trim() ?? '')
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

		// loop through all edges to get connection
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
		if (!flowDataSave.connections.length) {
			toast.error('Flow must have at least one connection');
			return;
		}
		flowDispatch(changeLoading(true));
		try {
			if (flowId) {
				await flowService.updateFlow({ ...flowDataSave, flowId });
				toast.success('Update flow success');
				// call api update flow
			} else {
				const response = await flowService.createNewFlow(flowDataSave);
				toast.success('Save flow success');
				// navigate to flow detail after create flow
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

	// handle drop node from the menu to flow, add a new node to flow
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
					let value: string;
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
			const listEdge: Edge[] = flowDetail.connections?.map((edge: IEdge) => {
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
		// set flow data from example flow => use example flow template to create a new flow
		if (exampleFlowId && checkIsExampleFlow) {
			setFlowDetail(checkIsExampleFlow.flowDetail);
			setIsExampleFlow(false);
			return;
		}

		// set flow data is empty when flowId is empty => create a new flow
		if (!flowId) {
			flowDispatch(setNodesContext([]));
			flowDispatch(setEdgesContext([]));
			setIsExampleFlow(false);
			return;
		}

		// get flow detail from an example flow to display in the flow editor
		if (checkIsExampleFlow) {
			setFlowDetail(checkIsExampleFlow.flowDetail);
			setIsExampleFlow(true);
			return;
		}

		// get flow detail when flowId is not empty
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
		// get flow detail from api to display in flow editor
		getDetailFlow();
	}, [flowId, flowDispatch, exampleFlowId]);

	useEffect(() => {
		// handle delete node when press deletes the key
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
				onConnectStart={onConnectStart}
				onConnectEnd={onConnectEnd}
				onDrop={onDrop}
				onDragOver={onDragOver}
				minZoom={0.5}
				maxZoom={3}
				defaultViewport={{ x: 100, y: 100, zoom: 1 }}
				nodesDraggable={!isExampleFlow} // disable drag node if current flow is example flow
				nodesConnectable={!isExampleFlow} // disable connect node if current flow is example flow
				elementsSelectable={!isExampleFlow} // disable select node if current flow is example flow
				zoomOnScroll={!isExampleFlow} // disable zoom on scroll if current flow is example flow
				// fitView
				colorMode="light"
			>
				{!isExampleFlow && (
					<Panel position="top-left">
						<Menu
							trigger="click"
							menu={<AddNodeMenuPopup />}
							placement="bottomLeft"
							className="bg-white dark:bg-[#2b2d31] rounded-lg shadow-lg border border-gray-200 dark:border-gray-600"
						>
							<button className="p-2 rounded-full hover:bg-[#cccccc66] shadow-md">
								<Icons.AddIcon className="w-6 h-6" />
							</button>
						</Menu>
					</Panel>
				)}
				<Controls />
				<Background className="dark:bg-bgPrimary bg-bgLightPrimary text-gray-500 dark:text-gray-100" variant={BackgroundVariant.Dots} />
			</ReactFlow>

			<Menu
				trigger="click"
				menu={<FlowChatPopup />}
				placement="bottomRight"
				className="bg-white dark:bg-[#2b2d31] rounded-lg shadow-lg border border-gray-200 dark:border-gray-600"
			>
				<button className="p-2 rounded-full hover:bg-[#cccccc66] shadow-md absolute top-[80px] right-3">
					<Icons.IconChat className="w-6 h-6" />
				</button>
			</Menu>

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
			<NodeEditingModal />
			{/* Render Popup */}
			<NextNodePopup
				visible={popupConfig.visible}
				position={{ x: popupConfig.x, y: popupConfig.y }}
				onSelect={handleAddNextNode}
				onMouseEnter={onPopupEnter}
				onMouseLeave={onPopupLeave}
				sourceNodeLabel={popupConfig.sourceNodeLabel}
			/>
		</div>
	);
};
export default Flow;
