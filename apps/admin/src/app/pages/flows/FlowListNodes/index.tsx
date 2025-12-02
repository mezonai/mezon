import React, { useContext, useMemo, useState } from 'react';
import { ApiIcon, ConditionIcon, ResponseIcon, TriggerIcon, WebhookIcon } from '../../../../assets/icons/nodeIcons';
import SearchInput from '../../../components/InputField/SearchInput';
import { FlowContext } from '../../../context/FlowContext';
import { default as NodeTypes } from '../nodes/NodeType';

const iconByLabel: Record<string, React.ComponentType> = {
	Trigger: TriggerIcon,
	Response: ResponseIcon,
	Webhook: WebhookIcon,
	Api: ApiIcon,
	Condition: ConditionIcon
};

const FlowListNodesPopup = () => {
	const { flowState } = useContext(FlowContext);
	const [searchTerm, setSearchTerm] = useState('');

	const recentNodes = useMemo(() => {
		if (!flowState.nodes) return [];

		const nodesArray = Object.values(flowState.nodes);
		const uniqueNodeTypes = NodeTypes.filter((nodeType) => nodesArray.some((node) => node.type === nodeType.type));
		return uniqueNodeTypes.filter((nodeType) => nodeType.label.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [flowState.nodes, searchTerm]);

	const availableNodes = useMemo(() => {
		const seenLabels = new Set<string>();
		return NodeTypes.filter((node) => {
			const label = node.label.toLowerCase();
			if (!label.includes(searchTerm.toLowerCase())) return false;
			if (seenLabels.has(label)) return false;
			seenLabels.add(label);
			return true;
		});
	}, [searchTerm]);

	return (
		<div
			className="bg-white w-[400px] max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200"
			onClick={(e) => e.stopPropagation()}
		>
			{/* Header */}
			<div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
				<h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
					<span>Workflow</span>
					{/*<span className="text-blue-600 truncate max-w-[200px] block">{flowState.flowName ? `: ${flowState.flowName}` : ''}</span>*/}
				</h2>
			</div>

			{/* Search Input */}
			<div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
				<SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search nodes..." className="w-full" autoFocus />
			</div>

			{/* Content List */}
			<div className="overflow-y-auto p-3 flex-1 custom-scrollbar">
				{/* Recent Nodes Section */}
				{recentNodes.length > 0 && (
					<div className="mb-5">
						<div className="px-2 py-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Recent</div>
						<div className="space-y-1">
							{recentNodes.map((node: any) => {
								const nodeTypeDefinition = NodeTypes.find((t) => t.type === node.type);
								const iconLabel = nodeTypeDefinition?.label || 'Trigger';

								const NodeIcon = iconByLabel[iconLabel] || TriggerIcon;

								return (
									<div
										key={node.type}
										className="flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-blue-100"
									>
										<div className="w-9 h-9 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-lg group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all">
											<NodeIcon />
										</div>
										<span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">{iconLabel}</span>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* Available Nodes Section */}
				<div>
					<div className="px-2 py-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider">Nodes</div>
					<div className="space-y-1">
						{availableNodes.map((node) => {
							const NodeIcon = iconByLabel[node.label] || TriggerIcon;
							return (
								<div
									key={node.type}
									className="flex items-center gap-3 p-2.5 hover:bg-blue-50 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-blue-100"
								>
									<div className="w-9 h-9 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center text-lg group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-sm transition-all">
										{NodeIcon && <NodeIcon />}
									</div>
									<span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">{node.label}</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default FlowListNodesPopup;
