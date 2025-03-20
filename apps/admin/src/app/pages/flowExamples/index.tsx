import { Link, useParams } from 'react-router-dom';
import ExampleFlow from './ExampleFlows';

const FlowExamples = () => {
	const { applicationId } = useParams();
	return (
		<div className="">
			<div className="flex justify-between items-center">
				<h4 className="text-xl font-semibold">Flow Examples</h4>
			</div>
			<div className="mt-5 list-flows">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
					{ExampleFlow.map((flow) => (
						<Link
							to={`/developers/applications/${applicationId}/flow/${flow.id}`}
							key={flow.id}
							className="bg-white min-h-[150px] dark:bg-gray-800 dark:hover:bg-gray-700 p-3 rounded-md shadow-md border-[1px] border-gray-400 cursor-pointer hover:shadow-inner transition-all"
						>
							<h4 className="font-semibold">{flow.flowName}</h4>
							<p className="text-gray-500 mt-2">{flow.description}</p>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
};
export default FlowExamples;
