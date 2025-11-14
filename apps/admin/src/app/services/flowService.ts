import type { IFlow, IFlowDataRequest, IFlowDetail } from '../stores/flow/flow.interface';
import { apiInstance } from './apiInstance';

interface IError {
	message: string;
}

export interface PostApplicationProps {
	referralId: string;
	username: string;
	appId: string;
	appToken: string;
}

const getAllFlowByApplication = async (applicationId: string): Promise<IFlow[]> => {
	try {
		const response = await apiInstance(`/flow/getAllByApplication?appId=${applicationId}`, { method: 'GET' });
		return response?.data as IFlow[];
	} catch (error) {
		throw (error as IError).message;
	}
};

const getFlowDetail = async (flowId: string): Promise<IFlowDetail> => {
	try {
		const flowDetail = await apiInstance(`/flow/detail?flowId=${flowId}`, { method: 'GET' });
		return flowDetail as IFlowDetail;
	} catch (error) {
		throw (error as IError).message;
	}
};

const createNewFlow = async (dataCreate: IFlowDataRequest): Promise<IFlowDetail> => {
	try {
		const response = await apiInstance('/flow/create', {
			method: 'POST',
			body: JSON.stringify(dataCreate)
		});
		return response as IFlowDetail;
	} catch (error) {
		throw (error as IError).message;
	}
};

const updateFlow = async (dataUpdate: IFlowDataRequest): Promise<IFlowDetail> => {
	try {
		const response = await apiInstance('/flow/update', {
			method: 'PUT',
			body: JSON.stringify(dataUpdate)
		});
		return response as IFlowDetail;
	} catch (error) {
		throw (error as IError).message;
	}
};

const deleteFlow = async (flowId: string): Promise<IFlowDetail> => {
	try {
		const response = await apiInstance(`/flow/delete?flowId=${flowId}`, { method: 'DELETE' });
		return response as IFlowDetail;
	} catch (error) {
		throw (error as IError).message;
	}
};

const executionFlow = async (appId: string, appToken: string, message: string, username: string): Promise<{ message: string; urlImage: string }> => {
	try {
		const response = await apiInstance('/execution', {
			method: 'POST',
			body: JSON.stringify({ appId, message, appToken, username })
		});
		return response as { message: string; urlImage: string };
	} catch (error) {
		throw (error as IError).message;
	}
};

const getApplication = async (appId: string) => {
	try {
		const response = await apiInstance(`/application/${appId}`, {
			method: 'GET'
		});
		return response as { id: string };
	} catch (error) {
		throw (error as IError).message;
	}
};

const createApplication = async (dataCreate: PostApplicationProps) => {
	try {
		const response = await apiInstance(`/application`, {
			method: 'POST',
			body: JSON.stringify(dataCreate)
		});
		return response as { id: string };
	} catch (error) {
		throw (error as IError).message;
	}
};

const flowService = {
	getAllFlowByApplication,
	getFlowDetail,
	createNewFlow,
	updateFlow,
	deleteFlow,
	executionFlow,
	getApplication,
	createApplication
};

export default flowService;
