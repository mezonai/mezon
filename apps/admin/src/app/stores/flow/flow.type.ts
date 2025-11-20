import type { Edge, Node } from '@xyflow/react';
import type { INodeEdit, INodeType, ISelectedNode } from './flow.interface';

export enum FLOW_ACTION_TYPE {
	SET_NODES = 'SET_NODES',
	SET_EDGES = 'SET_EDGES',
	ADD_NODE = 'ADD_NODE',
	ADD_EDGE = 'ADD_EDGE',
	DELETE_NODE = 'DELETE_NODE',
	DELETE_EDGE = 'DELETE_EDGE',
	COPY_NODE = 'COPY_NODE',
	CHANGE_NODE_TYPE = 'CHANGE_NODE_TYPE',
	CHANGE_SELECTED_NODE = 'CHANGE_SELECTED_NODE',
	CHANGE_OPEN_MODAL_NODE_DETAIL = 'CHANGE_OPEN_MODAL_NODE_DETAIL',
	CHANGE_OPEN_MODAL_NODE_EDITING = 'CHANGE_OPEN_MODAL_NODE_EDITING',
	CHANGE_LOADING = 'CHANGE_LOADING',
	SET_NODE_EDIT = 'SET_NODE_EDIT',
	UPDATE_NODE_DATA = 'UPDATE_NODE_DATA'
}
export interface IFlowState {
	nodes: Node[];
	edges: Edge[];
	nodeType: INodeType;
	selectedNode: ISelectedNode | null;
	nodeEdit: INodeEdit | null;
	openModalNodeDetail: boolean;
	openModalNodeEditing: boolean;
	isLoading: boolean;
}
export interface FlowActionType {
	type: FLOW_ACTION_TYPE;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	payload: any;
}
