import { v4 as uuidv4 } from 'uuid';
import ConnectionsAllowed from '../../pages/flows/nodes/ConnectionAlows';
import type { FlowActionType, IFlowState } from './flow.type';
import { FLOW_ACTION_TYPE } from './flow.type';
export const initFlowState: IFlowState = {
	nodes: [],
	edges: [],
	nodeType: 'default',
	selectedNode: null,
	nodeEdit: null,
	openModalNodeDetail: false,
	openModalNodeEditing: false,
	isLoading: false
};

const flowReducer = (state = initFlowState, action: FlowActionType): IFlowState => {
	switch (action.type) {
		case FLOW_ACTION_TYPE.SET_EDGES:
			return {
				...state,
				edges: action.payload
			};
		case FLOW_ACTION_TYPE.SET_NODES:
			return {
				...state,
				nodes: action.payload
			};
		case FLOW_ACTION_TYPE.CHANGE_LOADING:
			return {
				...state,
				isLoading: action.payload
			};
		case FLOW_ACTION_TYPE.ADD_NODE: {
			const newNodeId: string = uuidv4();
			const newNode = {
				id: newNodeId,
				type: state.nodeType,
				position: action.payload,
				dragHandle: '.custom-drag-handle',
				data: {
					label: state.nodeType,
					id: newNodeId
				}
			};
			return {
				...state,
				nodes: [...state.nodes, newNode]
			};
		}
		case FLOW_ACTION_TYPE.ADD_EDGE: {
			const newEdge = action.payload;
			newEdge.id = uuidv4();
			// check if a connection exists
			const checkExist = state.edges.find(
				(edge) =>
					edge.source === newEdge.source &&
					edge.target === newEdge.target &&
					edge.sourceHandle === newEdge.sourceHandle &&
					edge.targetHandle === newEdge.targetHandle
			);
			// check if connection is not allowed
			const checkAllowed = ConnectionsAllowed.find((item) => {
				const sourceMatch =
					typeof item.source === 'string'
						? item.source === newEdge.sourceHandle || item.source === '*'
						: item.source.test(newEdge.sourceHandle || '');
				const targetMatch = item.target === newEdge.targetHandle || item.target === '*';
				return sourceMatch && targetMatch;
			});
			// check if connection is limited
			const checkLimit = state.edges.find(
				(edge) =>
					(edge.sourceHandle === newEdge.sourceHandle && edge.source === newEdge.source) ||
					(edge.targetHandle === newEdge.targetHandle && edge.target === newEdge.target)
			);
			if (!checkAllowed || checkExist) return state;

			const newEdges = state.edges.filter((edge) => edge.id !== checkLimit?.id);
			return {
				...state,
				edges: [...newEdges, newEdge]
			};
		}
		case FLOW_ACTION_TYPE.CHANGE_NODE_TYPE:
			return {
				...state,
				nodeType: action.payload
			};
		case FLOW_ACTION_TYPE.COPY_NODE: {
			const { nodeId, defaultValue } = action.payload;
			const nodeToCopy = state.nodes.find((node) => node.id === nodeId);
			if (!nodeToCopy) return state;
			const idCopyNode = uuidv4();
			const copyNode = {
				...nodeToCopy,
				id: idCopyNode,
				position: {
					x: nodeToCopy.position.x + 50,
					y: nodeToCopy.position.y + 50
				},
				selected: false,
				data: {
					...nodeToCopy.data,
					defaultValue,
					id: idCopyNode
				}
			};
			return {
				...state,
				nodes: [...state.nodes, copyNode]
			};
		}

		case FLOW_ACTION_TYPE.DELETE_NODE: {
			const nodeIdToDelete = action.payload;
			return {
				...state,
				nodes: state.nodes?.filter((node) => node.id !== nodeIdToDelete),
				edges: state.edges?.filter((e: { source: string; target: string }) => e.source !== nodeIdToDelete && e.target !== nodeIdToDelete)
			};
		}

		case FLOW_ACTION_TYPE.CHANGE_OPEN_MODAL_NODE_DETAIL:
			return {
				...state,
				openModalNodeDetail: action.payload
			};
		case FLOW_ACTION_TYPE.CHANGE_OPEN_MODAL_NODE_EDITING:
			return {
				...state,
				openModalNodeEditing: action.payload
			};
		case FLOW_ACTION_TYPE.CHANGE_SELECTED_NODE:
			return {
				...state,
				selectedNode: action.payload
			};
		case FLOW_ACTION_TYPE.SET_NODE_EDIT:
			return {
				...state,
				nodeEdit: action.payload
			};
		case FLOW_ACTION_TYPE.UPDATE_NODE_DATA: {
			const { nodeId, data } = action.payload;
			const updatedNodes = state.nodes.map((node) => {
				if (node.id === nodeId) {
					return {
						...node,
						data: {
							...node.data,
							defaultValue: data
						}
					};
				}
				return node;
			});
			return {
				...state,
				nodes: updatedNodes
			};
		}
		default:
			return state;
	}
};
export default flowReducer;
