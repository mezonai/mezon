import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import FlowItem from '../../../common/FlowItem/FlowItem';
import { FlowContext } from '../../../context/FlowContext';
import flowService from '../../../services/flowService';
import { changeLoading } from '../../../stores/flow/flow.action';
import type { IFlow } from '../../../stores/flow/flow.interface';

const ListFlow = () => {
	const { applicationId } = useParams();
	const { t } = useTranslation('adminApplication');

	const [listFlow, setListFlow] = useState<IFlow[]>([]);
	const { flowDispatch } = useContext(FlowContext);
	useEffect(() => {
		const getListFlow = async () => {
			flowDispatch(changeLoading(true));
			try {
				const res: IFlow[] = await flowService.getAllFlowByApplication(applicationId ?? '');
				setListFlow(res);
			} catch {
				toast.error(t('flows.toasts.errorLoading'));
			} finally {
				flowDispatch(changeLoading(false));
			}
		};
		getListFlow();
	}, [applicationId, flowDispatch]);
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
			{listFlow?.map((flow) => <FlowItem applicationId={applicationId ?? ''} flow={flow} key={flow.id} />)}
		</div>
	);
};
export default ListFlow;
