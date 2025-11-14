import { Icons } from '@mezon/ui';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FlowContext } from '../../../context/FlowContext';
import flowService from '../../../services/flowService';
import { changeLoading, setEdgesContext, setNodesContext } from '../../../stores/flow/flow.action';
import ExampleFlow from '../../flowExamples/ExampleFlows';
import ConfirmDeleteFlowPopup from './ConfirmDeleteFlowPopup';

interface IFlowHeaderBarProps {
	isExampleFlow: boolean;
	onSaveFlow: () => void;
	flowData: { flowName: string; description: string };
	changeOpenModalSaveFlowData: (value: boolean) => void;
}

const FlowHeaderBar = ({ isExampleFlow, onSaveFlow, flowData, changeOpenModalSaveFlowData }: IFlowHeaderBarProps) => {
	const { flowDispatch } = React.useContext(FlowContext);
	const navigate = useNavigate();
	const { flowId, applicationId } = useParams();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const handleClickBackButton = () => {
		flowDispatch(setNodesContext([]));
		flowDispatch(setEdgesContext([]));
		const checkIsExampleFlow = ExampleFlow.find((item) => item.id === flowId);
		if (checkIsExampleFlow) {
			navigate(`/developers/applications/${applicationId}/flow-examples`);
		} else {
			navigate(`/developers/applications/${applicationId}/flow`);
		}
	};

	const handleClickDeleteButton = React.useCallback(async () => {
		if (!flowId) {
			toast.info('Flow has not been created yet');
			return;
		}
		flowDispatch(changeLoading(true));
		try {
			await flowService.deleteFlow(flowId);
			toast.success('Delete flow success');
			navigate(`/developers/applications/${applicationId}/flow`);
		} catch {
			toast.error('Delete flow failed');
		} finally {
			flowDispatch(changeLoading(false));
			setShowDeleteConfirm(false);
		}
	}, [flowId, flowDispatch, navigate, applicationId]);

	const handleUseExampleFlow = React.useCallback(async () => {
		if (!flowId) {
			toast.info('Flow has not been created yet');
			return;
		}
		navigate(`/developers/applications/${applicationId}/use-flow-example/${flowId}`);
	}, [applicationId, flowId, navigate]);

	return (
		<div className="top-1 left-3 right-3 z-10 bg-gray-100 h-[50px] flex items-center justify-between px-3 my-1 rounded-full relative">
			<div className="flex items-center gap-2">
				<button
					onClick={handleClickBackButton}
					className="w-[40px] h-[40px] ml-2 rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200"
				>
					<Icons.LeftArrowIcon className="w-full" />
				</button>
				<div className="flex items-center text-[24px] font-semibold ml-[20px] pl-[10px] border-l-[1px] border-l-gray-300">
					<span>{flowData?.flowName ?? 'Untitled Flow'}</span>
					<button
						onClick={() => changeOpenModalSaveFlowData(true)}
						className="ml-3 w-[30px] h-[30px] flex items-center justify-center border-[1px] border-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500"
					>
						<Icons.PenEdit />
					</button>
				</div>
			</div>

			{isExampleFlow ? (
				<div className="rightbox flex items-center gap-2">
					<button
						onClick={handleUseExampleFlow}
						title="Custom to use this flow"
						className="w-[40px] h-[40px] mr-2 rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200"
					>
						<Icons.SettingProfile />
					</button>
				</div>
			) : (
				<div className="rightbox flex items-center gap-2 relative">
					<button
						onClick={onSaveFlow}
						title="Save Flow"
						className="w-[40px] h-[40px] mr-2 rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200"
					>
						<Icons.IconTick />
					</button>
					<button
						disabled={!flowId}
						onClick={() => setShowDeleteConfirm((prev) => !prev)}
						title="Delete Flow"
						className="w-[40px] h-[40px] mr-2 rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Icons.DeleteMessageRightClick />
					</button>

					{showDeleteConfirm && (
						<div className="absolute top-[50px] right-0 bg-white dark:bg-gray-700 shadow-lg border border-gray-300 rounded-md p-3 z-20">
							<ConfirmDeleteFlowPopup onConfirm={handleClickDeleteButton} />
							<button
								onClick={() => setShowDeleteConfirm(false)}
								className="mt-2 w-full px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
							>
								Cancel
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default FlowHeaderBar;
