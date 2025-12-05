import { useState } from 'react';
import { connectField } from 'uniforms';

interface Condition {
	left: string;
	operator: string;
	right: string;
	type: string;
}

interface RoutingRule {
	condition: Condition;
}

interface CustomRoutingRulesFieldProps {
	value: RoutingRule[];
	onChange: (value: RoutingRule[]) => void;
	label?: string;
	name?: string;
	[key: string]: any;
}

// Operators for each data type
const operatorsByType: Record<string, { label: string; value: string }[]> = {
	string: [
		{ label: 'exists', value: 'exists' },
		{ label: 'does not exist', value: 'does not exist' },
		{ label: 'is empty', value: 'is empty' },
		{ label: 'is not empty', value: 'is not empty' },
		{ label: 'is equal to', value: 'is equal to' },
		{ label: 'is not equal to', value: 'is not equal to' },
		{ label: 'contains', value: 'contains' },
		{ label: 'does not contain', value: 'does not contain' },
		{ label: 'starts with', value: 'starts with' },
		{ label: 'does not start with', value: 'does not start with' },
		{ label: 'ends with', value: 'ends with' },
		{ label: 'does not end with', value: 'does not end with' },
		{ label: 'matches regex', value: 'matches regex' },
		{ label: 'does not match regex', value: 'does not match regex' }
	],
	number: [
		{ label: 'exists', value: 'exists' },
		{ label: 'does not exist', value: 'does not exist' },
		{ label: 'is empty', value: 'is empty' },
		{ label: 'is not empty', value: 'is not empty' },
		{ label: 'is equal to', value: 'is equal to' },
		{ label: 'is not equal to', value: 'is not equal to' },
		{ label: 'is greater than', value: 'is greater than' },
		{ label: 'is less than', value: 'is less than' },
		{ label: 'is greater than or equal', value: 'is greater than or equal' },
		{ label: 'is less than or equal', value: 'is less than or equal' }
	],
	boolean: [
		{ label: 'exists', value: 'exists' },
		{ label: 'does not exist', value: 'does not exist' },
		{ label: 'is true', value: 'is true' },
		{ label: 'is false', value: 'is false' },
		{ label: 'is equal to', value: 'is equal to' },
		{ label: 'is not equal to', value: 'is not equal to' }
	],
	array: [
		{ label: 'exists', value: 'exists' },
		{ label: 'does not exist', value: 'does not exist' },
		{ label: 'is empty', value: 'is empty' },
		{ label: 'is not empty', value: 'is not empty' },
		{ label: 'contains', value: 'contains' },
		{ label: 'does not contain', value: 'does not contain' },
		{ label: 'length equal to', value: 'length equal to' },
		{ label: 'length not equal to', value: 'length not equal to' },
		{ label: 'length greater than', value: 'length greater than' },
		{ label: 'length less than', value: 'length less than' }
	],
	object: [
		{ label: 'exists', value: 'exists' },
		{ label: 'does not exist', value: 'does not exist' },
		{ label: 'is empty', value: 'is empty' },
		{ label: 'is not empty', value: 'is not empty' }
	],
	dateTime: [
		{ label: 'exists', value: 'exists' },
		{ label: 'does not exist', value: 'does not exist' },
		{ label: 'is equal to', value: 'is equal to' },
		{ label: 'is not equal to', value: 'is not equal to' },
		{ label: 'is after', value: 'is after' },
		{ label: 'is before', value: 'is before' },
		{ label: 'is after or equal', value: 'is after or equal' },
		{ label: 'is before or equal', value: 'is before or equal' }
	]
};

const typeOptions = [
	{ label: 'String', value: 'string', icon: 'T' },
	{ label: 'Number', value: 'number', icon: '#' },
	{ label: 'Date & Time', value: 'dateTime', icon: '📅' },
	{ label: 'Boolean', value: 'boolean', icon: '☑' },
	{ label: 'Array', value: 'array', icon: '≡' },
	{ label: 'Object', value: 'object', icon: '⚙' }
];

const CustomRoutingRulesField = ({ value = [], onChange, label }: CustomRoutingRulesFieldProps) => {
	const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
	const [hoveredType, setHoveredType] = useState<string | null>(null);

	const handleAddRule = () => {
		const newRule: RoutingRule = {
			condition: { left: '', operator: 'is equal to', right: '', type: 'string' }
		};
		onChange([...value, newRule]);
	};

	const handleRemoveRule = (index: number) => {
		const newRules = value.filter((_, i) => i !== index);
		onChange(newRules);
	};

	const handleUpdateCondition = (index: number, field: keyof Condition, newValue: string) => {
		const newRules = value.map((rule, i) => {
			if (i === index) {
				const condition = rule.condition;
				if (field === 'type') {
					const defaultOperator = operatorsByType[newValue]?.[0]?.value || 'is equal to';
					return { condition: { ...condition, type: newValue, operator: defaultOperator } };
				}
				return { condition: { ...condition, [field]: newValue } };
			}
			return rule;
		});
		onChange(newRules);
	};

	const handleSelectTypeAndOperator = (index: number, type: string, operator: string) => {
		const newRules = value.map((rule, i) => {
			if (i === index) {
				return { condition: { ...rule.condition, type, operator } };
			}
			return rule;
		});
		onChange(newRules);
		setOpenDropdownIndex(null);
		setHoveredType(null);
	};

	return (
		<div className="w-full">
			{label && <label className="block text-sm font-medium mb-2">{label}</label>}

			<div className="space-y-3">
				{value.map((rule, index) => {
					const condition = rule.condition;
					return (
						<div key={index} className="border border-gray-700 rounded-lg p-3 mb-2 bg-gray-900 flex items-center gap-3">
							<input
								type="text"
								value={condition.left}
								onChange={(e) => handleUpdateCondition(index, 'left', e.target.value)}
								placeholder="value1"
								className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
							/>

							<div className="relative">
								<button
									type="button"
									onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
									className="flex items-center gap-2 bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 hover:border-blue-500 min-w-[180px]"
								>
									<span className="text-gray-400">{typeOptions.find((t) => t.value === condition.type)?.icon || 'T'}</span>
									<span className="flex-1 text-left">{condition.operator}</span>
									<span className="text-gray-400">▼</span>
								</button>

								{openDropdownIndex === index && (
									<div className="absolute top-full left-0 mt-1 z-50 flex bg-gray-800 rounded-lg shadow-lg border border-gray-600">
										<div className="w-36 border-r border-gray-600">
											{typeOptions.map((type) => (
												<div
													key={type.value}
													onMouseEnter={() => setHoveredType(type.value)}
													className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700 ${
														condition.type === type.value ? 'text-orange-400' : 'text-white'
													}`}
												>
													<span>{type.icon}</span>
													<span>{type.label}</span>
													<span className="ml-auto text-gray-400">›</span>
												</div>
											))}
										</div>
										{hoveredType && (
											<div className="w-48 max-h-64 overflow-y-auto">
												{operatorsByType[hoveredType]?.map((op) => (
													<div
														key={op.value}
														onClick={() => handleSelectTypeAndOperator(index, hoveredType, op.value)}
														className={`px-3 py-2 cursor-pointer hover:bg-gray-700 ${
															condition.operator === op.value && condition.type === hoveredType
																? 'text-orange-400'
																: 'text-white'
														}`}
													>
														{op.label}
													</div>
												))}
											</div>
										)}
									</div>
								)}
							</div>

							<input
								type="text"
								value={condition.right}
								onChange={(e) => handleUpdateCondition(index, 'right', e.target.value)}
								placeholder="value2"
								className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
							/>

							<button
								type="button"
								onClick={() => handleRemoveRule(index)}
								className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
							>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clipRule="evenodd"
									/>
								</svg>
							</button>
						</div>
					);
				})}
			</div>

			<button
				type="button"
				onClick={handleAddRule}
				className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
			>
				Add Rule
			</button>
		</div>
	);
};

export default connectField<CustomRoutingRulesFieldProps>(CustomRoutingRulesField);
