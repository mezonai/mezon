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
import NodeTypes from './NodeType';

const iconByLabel: Record<string, React.ComponentType> = {
	'Chat Trigger': ChatIcon,
	Response: ResponseIcon,
	Webhook: WebhookIcon,
	'HTTP Request': HttpRequestIcon,
	If: IfIcon,
	'Edit Field': EditFieldIcon,
	Schedule: SchedulerIcon,
	'Embed Message': CodeIcon,
	Switch: SwitchIcon
};

const NextNodePopup = ({
	visible,
	position,
	onSelect,
	onMouseEnter,
	onMouseLeave,
	sourceNodeLabel
}: {
	visible: boolean;
	position: { x: number; y: number };
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onSelect: (nodeType: any) => void;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	sourceNodeLabel: string;
}) => {
	if (!visible) return null;

	const connectionRules: Record<string, string[]> = {
		'Chat Trigger': ['Response', 'HTTP Request', 'Edit Field', 'If', 'Embed Message'],
		Webhook: ['Edit Field', 'If', 'HTTP Request', 'Response', 'Embed Message'],
		If: ['If', 'Response', 'HTTP Request', 'Edit Field', 'Embed Message'],
		'HTTP Request': ['Edit Field', 'If', 'Embed Message', 'Response', 'Embed Message'],
		Schedule: ['HTTP Request', 'Response', 'Edit Field', 'Embed Message'],
		Switch: ['Response', 'HTTP Request', 'Edit Field', 'If', 'Embed Message']
	};

	const allowedTargetTypes = sourceNodeLabel ? connectionRules[sourceNodeLabel] : [];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const availableNodes = NodeTypes.reduce((result: any[], item) => {
		const isAllowed = !sourceNodeLabel || allowedTargetTypes.includes(item.label);
		const isNotChatTrigger = item.label !== 'Chat Trigger';

		if (!isAllowed || !isNotChatTrigger) return result;

		const existingNode = result.some((n) => n.label === item.label);

		return existingNode ? result : [...result, item];
	}, []);

	if (availableNodes.length === 0) return null;

	return (
		<div
			className="fixed z-[100] bg-white dark:bg-[#2b2d31] shadow-xl rounded-lg border border-gray-200 dark:border-gray-600 p-2 w-[200px] flex flex-col gap-1 animate-in fade-in zoom-in duration-200"
			style={{ top: position.y - 10, left: position.x + 15 }}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Add Next Node</div>
			{availableNodes.map((node, index) => {
				const Icon = iconByLabel[node.label] || ChatIcon;
				return (
					<div
						key={index}
						onClick={() => onSelect(node)}
						className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer transition-colors"
					>
						<div className="w-6 h-6 flex items-center justify-center bg-blue-50 dark:bg-gray-600 rounded-full">
							<Icon />
						</div>
						<span className="text-sm font-medium dark:text-gray-200">{node.label}</span>
					</div>
				);
			})}
		</div>
	);
};

export default NextNodePopup;
