import { Icons } from '@mezon/ui';
import { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FlowContext } from '../../context/FlowContext';
import ListFlow from './ListFlows';

const Flows = () => {
	const { applicationId } = useParams();
	const navigate = useNavigate();
	const { flowState } = useContext(FlowContext);
	const handleGoToAddFlowPage = () => {
		navigate(`/developers/applications/${applicationId}/add-flow`);
	};
	return (
		<div className="relative">
			<div className="flex justify-between items-center">
				<h4 className="text-xl font-semibold">Chat Flows</h4>
				<div className="flex gap-2">
					<button
						onClick={handleGoToAddFlowPage}
						className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md active:bg-blue-500 transition-all"
					>
						Add Flow
					</button>
				</div>
			</div>
			{flowState.isLoading && <Icons.LoadingSpinner />}
			<div className="mt-5 list-flows">
				<ListFlow />
			</div>
		</div>
	);
};
export default Flows;
