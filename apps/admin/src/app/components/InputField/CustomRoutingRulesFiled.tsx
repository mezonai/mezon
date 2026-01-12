import { useEffect, useRef, useState } from 'react';
import { connectField } from 'uniforms';
import { OperatorsByType, SingleParamOperators, TypeOptions } from '../../common/constants/conditionOperators';

interface Condition {
	left: string;
	operator: string;
	right: string;
	type: string;
}

interface InternalCondition extends Condition {
	_cachedRight?: string;
}

interface RoutingRule {
	condition: Condition;
}

interface InternalRoutingRule {
	condition: InternalCondition;
}

interface CustomRoutingRulesFieldProps {
	value: RoutingRule[];
	onChange: (value: RoutingRule[]) => void;
	label?: string;
	name?: string;
	error?: boolean;
	errorMessage?: string;
	showInlineError?: boolean;
	[key: string]: any;
}

const needsRightValue = (operator: string): boolean => {
	return !SingleParamOperators.includes(operator);
};

const normalizeRules = (rules: InternalRoutingRule[]): RoutingRule[] => {
	return rules.map((rule) => {
		const { _cachedRight, ...restCondition } = rule.condition;
		return {
			condition: {
				...restCondition,
				right: needsRightValue(rule.condition.operator) ? rule.condition.right : ''
			}
		};
	});
};

const CustomRoutingRulesField = ({ value = [], onChange, label, error, errorMessage, showInlineError, ...props }: CustomRoutingRulesFieldProps) => {
	const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
	const [hoveredType, setHoveredType] = useState<string | null>(null);

	const [internalRules, setInternalRules] = useState<InternalRoutingRule[]>([]);
	const isInternalUpdate = useRef(false);

	useEffect(() => {
		if (!isInternalUpdate.current) {
			setInternalRules(
				value.map((rule) => ({
					condition: {
						...rule.condition,
						_cachedRight: rule.condition.right
					}
				}))
			);
		}
		isInternalUpdate.current = false;
	}, [value]);

	const updateRules = (newInternalRules: InternalRoutingRule[]) => {
		setInternalRules(newInternalRules);
		isInternalUpdate.current = true;
		onChange(normalizeRules(newInternalRules));
	};

	const handleAddRule = () => {
		const newRule: InternalRoutingRule = {
			condition: { left: '', operator: 'is equal to', right: '', type: 'string', _cachedRight: '' }
		};
		updateRules([...internalRules, newRule]);
	};

	const handleRemoveRule = (index: number) => {
		const newRules = internalRules.filter((_, i) => i !== index);
		updateRules(newRules);
	};

	const handleUpdateCondition = (index: number, field: keyof Condition, newValue: string) => {
		const newRules = internalRules.map((rule, i) => {
			if (i === index) {
				const condition = rule.condition;
				if (field === 'type') {
					const defaultOperator = OperatorsByType[newValue]?.[0]?.value || 'is equal to';
					return { condition: { ...condition, type: newValue, operator: defaultOperator } };
				}
				if (field === 'right') {
					return { condition: { ...condition, right: newValue, _cachedRight: newValue } };
				}
				return { condition: { ...condition, [field]: newValue } };
			}
			return rule;
		});
		updateRules(newRules);
	};

	const handleSelectTypeAndOperator = (index: number, type: string, operator: string) => {
		const newRules = internalRules.map((rule, i) => {
			if (i === index) {
				const condition = rule.condition;
				const wasHidden = !needsRightValue(condition.operator);
				const willBeHidden = !needsRightValue(operator);

				let newRight = condition.right;
				let newCachedRight = condition._cachedRight;

				if (wasHidden && !willBeHidden) {
					newRight = condition._cachedRight || '';
				}

				if (!wasHidden && willBeHidden) {
					newCachedRight = condition.right;
				}

				return {
					condition: {
						...condition,
						type,
						operator,
						right: newRight,
						_cachedRight: newCachedRight
					}
				};
			}
			return rule;
		});
		updateRules(newRules);
		setOpenDropdownIndex(null);
		setHoveredType(null);
	};

	return (
		<div className="w-full">
			{label && <label className="block text-sm font-medium mb-2">{label}</label>}

			{/* Display inline error */}
			{showInlineError && error && <div className="text-red-500 text-sm mb-2">{errorMessage}</div>}

			<div className="space-y-3">
				{internalRules.map((rule, index) => {
					const condition = rule.condition;
					const showRightValue = needsRightValue(condition.operator);

					return (
						<div key={index} className="border border-gray-700 rounded-lg p-2 mb-2 bg-gray-900 flex items-center gap-3">
							<input
								type="text"
								value={condition.left}
								onChange={(e) => handleUpdateCondition(index, 'left', e.target.value)}
								placeholder="value1"
								className={`bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 ${
									showRightValue ? 'flex-1' : 'flex-[2]'
								}`}
							/>

							<div className="relative">
								<button
									type="button"
									onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
									className="flex items-center gap-2 bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 hover:border-blue-500 min-w-[180px]"
								>
									<span className="text-gray-400">
										{(() => {
											const Icon = TypeOptions.find((type) => type.value === condition.type)?.icon;
											return Icon ? <Icon /> : null;
										})()}
									</span>
									<span className="flex-1 text-left">{condition.operator}</span>
									<span className="text-gray-400">▼</span>
								</button>

								{openDropdownIndex === index && (
									<div className="absolute top-full left-0 mt-1 z-50 flex bg-gray-800 rounded-lg shadow-lg border border-gray-600">
										<div className="w-36 border-r border-gray-600">
											{TypeOptions.map((type) => (
												<div
													key={type.value}
													onMouseEnter={() => setHoveredType(type.value)}
													className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700 ${
														condition.type === type.value ? 'text-orange-400' : 'text-white'
													}`}
												>
													<span>
														<type.icon />
													</span>
													<span>{type.label}</span>
													<span className="ml-auto text-gray-400">›</span>
												</div>
											))}
										</div>
										{hoveredType && (
											<div className="w-48 max-h-64 overflow-y-auto">
												{OperatorsByType[hoveredType]?.map((op) => (
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

							{showRightValue && (
								<input
									type="text"
									value={condition.right}
									onChange={(e) => handleUpdateCondition(index, 'right', e.target.value)}
									placeholder="value2"
									className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
								/>
							)}

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
