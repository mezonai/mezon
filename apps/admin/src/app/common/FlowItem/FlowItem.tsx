import { Link } from 'react-router-dom';
import type { IFlow } from '../../stores/flow/flow.interface';
import { formatUpdatedTime } from '../../utils/dateFormatter';

interface FlowItemProps {
	applicationId: string;
	flow: IFlow;
}

const FlowItem = ({ applicationId, flow }: FlowItemProps) => {
	return (
		<Link
			to={`/developers/applications/${applicationId}/flow/${flow.id}`}
			key={flow.id}
			className="bg-white min-h-[150px] dark:bg-gray-800 dark:hover:bg-gray-700 p-3 rounded-md shadow-md border-[1px] border-gray-400 cursor-pointer hover:shadow-inner transition-all flex flex-col justify-between"
		>
			<div>
				<h4 className="font-semibold">{flow.flowName}</h4>
				<p className="mt-1">{flow.description}</p>
			</div>
			{flow.updatedAt && (
				<div className="flex justify-end mt-1">
					<p className="text-sm text-gray-500">Last updated: {formatUpdatedTime(flow.updatedAt!)}</p>
				</div>
			)}
		</Link>
	);
};
export default FlowItem;
