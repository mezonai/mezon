export interface IFlow {
	id: string;
	flowName: string;
	description: string;
	status: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface IFlowDetail {
	id: string;
	userId: string;
	flowName: string;
	description: string;
	nodes: INode[];
	connections: IEdge[];
}

export type INodeType = 'trigger' | 'uploadedImage' | 'condition' | 'apiLoader' | 'default' | 'webhook';

export interface INode {
	id: string;
	nodeType: INodeType;
	nodeName: string;
	data: {
		id: string;
	};
	parameters: IParameter[];
	position:
		| {
				x: number;
				y: number;
		  }
		| string;
	measured:
		| {
				width: number;
				height: number;
		  }
		| string;
	selected: boolean;
}
export interface IEdge {
	id?: string;
	sourceNodeId: string;
	targetNodeId: string;
	sourceHandleId: string;
	targetHandleId: string;
	flowId?: string;
}

export interface IFlowDataRequest {
	referralId: string;
	applicationId: string;
	username: string;
	flowId?: string;
	flowName: string;
	description: string;
	isActive: boolean;
	connections: IEdge[];
	nodes: INode[];
}

export interface IParameter {
	parameterKey: string;
	parameterValue: string;
	id?: string;
	nodeId?: string;
}

export interface ISelectedNode {
	type?: string;
	label?: string;
	description?: string;
	parameters: Array<{
		type: string;
		label: string;
		name: string;
	}>;
}
