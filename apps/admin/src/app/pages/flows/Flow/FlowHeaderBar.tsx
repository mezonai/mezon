import { Icons } from '@mezon/ui';
import { Popover, Tooltip } from 'flowbite-react';
import React from 'react';
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

	const handleClickBackButton = () => {
		// reset flow data when click back button
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
			navigate(`developers/applications/${applicationId}/flow`);
		} catch {
			toast.error('Delete flow failed');
		} finally {
			flowDispatch(changeLoading(false));
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
		<div className="top-1 left-3 right-3 z-10 bg-gray-50 dark:bg-gray-600 h-[50px] flex items-center justify-between px-3 my-1 rounded-full">
			<div className="flex items-center gap-2">
				<button
					onClick={handleClickBackButton}
					className="w-[40px] h-[40px] ml-2  rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200"
				>
					<Icons.LeftArrowIcon className="w-full" />
				</button>
				<div className="flex items-center text-[24px] font-semibold ml-[20px] pl-[10px] border-l-[1px] border-l-gray-300">
					<span>{flowData?.flowName ?? 'Untitled Flow'}</span>
					<button
						onClick={() => changeOpenModalSaveFlowData(true)}
						className="ml-3 w-[30px] h-[30px] flex items-center justify-center border-[1px] border-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500 "
					>
						<Icons.PenEdit />
					</button>
				</div>
			</div>
			{isExampleFlow ? (
				<div className="rightbox flex items-center gap-2">
					<Tooltip content="Custom to use this flow" style={'light'}>
						<button
							onClick={handleUseExampleFlow}
							className="w-[40px] h-[40px] mr-2  rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200"
						>
							<Icons.SettingProfile />
						</button>
					</Tooltip>
				</div>
			) : (
				<div className="rightbox flex items-center gap-2">
					<Tooltip content="Save Flow" style={'light'}>
						<button
							onClick={onSaveFlow}
							className="w-[40px] h-[40px] mr-2  rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200"
						>
							<Icons.IconTick />
						</button>
					</Tooltip>
					<Tooltip content="Delete Flow" style={'light'}>
						<Popover content={<ConfirmDeleteFlowPopup onConfirm={handleClickDeleteButton} />} trigger="click">
							<button
								disabled={!flowId}
								className="w-[40px] h-[40px] mr-2  rounded-md flex items-center justify-center cursor-pointer bg-blue-200 hover:bg-blue-300 dark:hover:bg-blue-600 dark:bg-blue-500 border-[1px] transition-all active:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<Icons.DeleteMessageRightClick />
							</button>
						</Popover>
					</Tooltip>
				</div>
			)}
		</div>
	);
};
export default FlowHeaderBar;
