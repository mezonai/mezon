import { ApiIcon, ConditionIcon, ResponseIcon, TriggerIcon, WebhookIcon } from '../../../../assets/icons/nodeIcons';
import type { INodeType } from '../../../stores/flow/flow.interface';
import MenuItem from './MenuItem';

export interface INodeMenu {
	title: string;
	nodeType: INodeType;
	description: string;
	icon?: React.ReactNode;
}
const AddNodeMenuPopup = () => {
	const nodeMenu: INodeMenu[] = [
		{
			title: 'Trigger',
			nodeType: 'trigger',
			description: 'Listens for specific triggers to start the bot’s response.',
			icon: <TriggerIcon />
		},
		{
			title: 'Response',
			nodeType: 'uploadedImage',
			description: 'Sends the bot’s reply based on the input and processing.',
			icon: <ResponseIcon />
		},
		{
			title: 'Condition',
			nodeType: 'condition',
			description: 'Executes custom logic or processes for flexible responses.',
			icon: <ConditionIcon />
		},
		{
			title: 'API',
			nodeType: 'api',
			description: 'Fetches data from external APIs for integration into bot responses.',
			icon: <ApiIcon />
		},
		{
			title: 'Webhook',
			nodeType: 'webhook',
			description: 'Receives updates via HTTP requests for real-time integrations.',
			icon: <WebhookIcon />
		}
	];
	return (
		<div className="text-sm text-gray-500 dark:text-gray-400 w-[350px]">
			<div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
				<h3 id="default-popover" className="font-semibold text-gray-900 dark:text-white select-none">
					Add Node
				</h3>
			</div>
			<div className="p-2 max-h-[450px] overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:[width:3px] [&::-webkit-scrollbar-thumb]:bg-gray-100 transition-all">
				{nodeMenu.map((node, index) => (
					<MenuItem key={index} nodeType={node.nodeType} title={node.title} description={node.description} icon={node.icon} />
				))}
			</div>
		</div>
	);
};
export default AddNodeMenuPopup;
