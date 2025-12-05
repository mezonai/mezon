import React from 'react';
import {
	ChatIcon,
	CodeIcon,
	EditFieldIcon,
	HttpRequestIcon,
	IfIcon,
	ResponseIcon,
	SchedulerIcon,
	SwitchIcon,
	WebhookIcon
} from '../../../../assets/icons/nodeIcons';
import SearchInput from '../../../components/InputField/SearchInput';
import type { INodeType } from '../../../stores/flow/flow.interface';
import MenuItem from './MenuItem';

export interface INodeMenu {
	title: string;
	nodeType: INodeType;
	description: string;
	icon?: React.ReactNode;
}
const AddNodeMenuPopup = () => {
	const [searchTerm, setSearchTerm] = React.useState('');
	const nodeMenu: INodeMenu[] = [
		{
			title: 'Chat Trigger',
			nodeType: 'chatTrigger',
			description: 'Listens for specific triggers to start the bot’s response.',
			icon: <ChatIcon />
		},
		{
			title: 'Response',
			nodeType: 'uploadedImage',
			description: 'Sends the bot’s reply based on the input and processing.',
			icon: <ResponseIcon />
		},
		{
			title: 'If',
			nodeType: 'if',
			description: 'Executes custom logic or processes for flexible responses.',
			icon: <IfIcon />
		},
		{
			title: 'HTTP Request',
			nodeType: 'httpRequest',
			description: 'Fetches data from external APIs for integration into bot responses.',
			icon: <HttpRequestIcon />
		},
		{
			title: 'Webhook',
			nodeType: 'webhook',
			description: 'Receives updates via HTTP requests for real-time integrations.',
			icon: <WebhookIcon />
		},
		{
			title: 'Edit Field',
			nodeType: 'editField',
			description: 'Modifies or sets specific fields in the data flow.',
			icon: <EditFieldIcon />
		},
		{
			title: 'Schedule',
			nodeType: 'schedule',
			description: 'Triggers actions based on a defined schedule or interval.',
			icon: <SchedulerIcon />
		},
		{
			title: 'Embed Message',
			nodeType: 'embedMessage',
			description: 'Executes custom JavaScript code for advanced processing.',
			icon: <CodeIcon />
		},
		{
			title: 'Switch',
			nodeType: 'switch',
			description: 'Routes the flow based on multiple conditions or cases.',
			icon: <SwitchIcon />
		}
	];
	return (
		<div className="text-sm bg-white text-gray-500 dark:text-gray-400 w-[350px]">
			<div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
				<h2 id="default-popover" className="font-semibold text-gray-900 dark:text-white select-none">
					Add Node
				</h2>
			</div>
			<div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
				<SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search nodes..." className="w-full" autoFocus />
			</div>
			<div className="p-2 max-h-full overflow-x-hidden overflow-y-auto [&::-webkit-scrollbar]:[width:3px] [&::-webkit-scrollbar-thumb]:bg-gray-100 transition-all">
				{nodeMenu
					.filter((node) => node.title.toLowerCase().includes(searchTerm.toLowerCase()))
					.map((node, index) => (
						<MenuItem key={index} nodeType={node.nodeType} title={node.title} description={node.description} icon={node.icon} />
					))}
			</div>
		</div>
	);
};
export default AddNodeMenuPopup;
