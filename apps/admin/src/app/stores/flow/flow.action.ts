import type { Edge, Node } from '@xyflow/react';
import type { INodeEdit, INodeType, ISelectedNode } from './flow.interface';
import type { FlowActionType } from './flow.type';
import { FLOW_ACTION_TYPE } from './flow.type';

export const setNodesContext = (nodes: Node[]): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.SET_NODES,
		payload: nodes
	};
};
export const changeOpenModalNodeEditing = (open: boolean): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.CHANGE_OPEN_MODAL_NODE_EDITING,
		payload: open
	};
};
export const setEdgesContext = (edges: Edge[]): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.SET_EDGES,
		payload: edges
	};
};
export const addNode = (position: { x: number; y: number }): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.ADD_NODE,
		payload: position
	};
};
export const addEdge = (edge: Edge): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.ADD_EDGE,
		payload: edge
	};
};
export const deleteNode = (nodeId: string): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.DELETE_NODE,
		payload: nodeId
	};
};
export const deleteEdge = (edgeId: string): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.DELETE_EDGE,
		payload: edgeId
	};
};
export const copyNode = (nodeId: string, defaultValue: any): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.COPY_NODE,
		payload: { nodeId, defaultValue }
	};
};
export const changeNodeType = (nodeType: INodeType): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.CHANGE_NODE_TYPE,
		payload: nodeType
	};
};
export const changeSelectedNode = (node: ISelectedNode | null): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.CHANGE_SELECTED_NODE,
		payload: node
	};
};

export const changeOpenModalNodeDetail = (open: boolean): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.CHANGE_OPEN_MODAL_NODE_DETAIL,
		payload: open
	};
};
export const changeLoading = (loading: boolean): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.CHANGE_LOADING,
		payload: loading
	};
};
export const setNodeEdit = (node: INodeEdit | null): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.SET_NODE_EDIT,
		payload: node
	};
};

export const updateNodeData = (nodeId: string, data: any): FlowActionType => {
	return {
		type: FLOW_ACTION_TYPE.UPDATE_NODE_DATA,
		payload: { nodeId, data }
	};
};
