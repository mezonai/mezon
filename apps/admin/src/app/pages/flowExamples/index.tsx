import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import FlowItem from '../../common/FlowItem/FlowItem';
import ExampleFlow from './ExampleFlows';

const FlowExamples = () => {
	const { t } = useTranslation('adminApplication');
	const { applicationId } = useParams();
	return (
		<div className="">
			<div className="flex justify-between items-center">
				<h4 className="text-xl font-semibold">{t('flowExamples.title')}</h4>
			</div>
			<div className="mt-5 list-flows">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
					{ExampleFlow.map((flow) => (
						<FlowItem applicationId={applicationId ?? ''} flow={flow} key={flow.id} />
					))}
				</div>
			</div>
		</div>
	);
};
export default FlowExamples;
