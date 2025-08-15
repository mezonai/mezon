import { selectAppDetail } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FlowContext } from '../../context/FlowContext';
import flowService from '../../services/flowService';
import AppTokenModal from './AppTokenModal';
import ListFlow from './ListFlows';

const Flows = () => {
	const { applicationId } = useParams();
	const navigate = useNavigate();
	const { flowState } = useContext(FlowContext);
	const handleGoToAddFlowPage = () => {
		navigate(`/developers/applications/${applicationId}/add-flow`);
	};
	const appDetail = useSelector(selectAppDetail);

	const [hasToken, setHasToken] = useState(false);
	const [openAppTokenModal, setOpenAppTokenModal] = useState(false);

	useEffect(() => {
		const getApplication = async () => {
			try {
				const res = await flowService.getApplication(applicationId ?? '');
				if (res.id) {
					setHasToken(true);
				}
			} catch {
				//
			}
		};
		getApplication();
	}, [applicationId]);

	const handleCreateApplication = useCallback(
		(token: string) => {
			flowService.createApplication(applicationId as string, appDetail?.appname ?? '', applicationId as string, token);
		},
		[applicationId]
	);

	return (
		<div className="relative">
			<div className="flex justify-between items-center">
				<h4 className="text-xl font-semibold">Chat Flows</h4>
				<div className="flex gap-2">
					<button
						onClick={() => setOpenAppTokenModal(true)}
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg active:bg-indigo-600 transition-all"
					>
						Set Token
					</button>
					<button
						disabled={!hasToken}
						onClick={handleGoToAddFlowPage}
						className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg active:bg-indigo-600 transition-all"
					>
						Add Flow
					</button>
				</div>
			</div>
			{flowState.isLoading && <Icons.LoadingSpinner />}
			<div className="mt-5 list-flows">
				<ListFlow />
			</div>
			<AppTokenModal
				open={openAppTokenModal}
				onClose={() => setOpenAppTokenModal(false)}
				title="App Token"
				onSave={(data: { token: string }) => {
					handleCreateApplication(data.token);
				}}
			/>
		</div>
	);
};
export default Flows;
