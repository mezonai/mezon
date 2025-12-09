import { useEffect, useRef, useState } from 'react';
import { connectField } from 'uniforms';

interface Condition {
	left: string;
	operator: string;
	right: string;
	type: string;
	logic?: string;
}

interface InternalCondition extends Condition {
	_cachedRight?: string;
}

interface CustomConditionsFieldProps {
	value: Condition[];
	onChange: (value: Condition[]) => void;
	label?: string;
	name?: string;
	error?: any;
	errorMessage?: string;
	showInlineError?: boolean;
	changed?: boolean;
	disabled?: boolean;
	field?: any;
	fields?: any;
	fieldType?: any;
	id?: string;
	placeholder?: string;
	readOnly?: boolean;
	[key: string]: any;
}

const singleParamOperators = ['exists', 'does not exist', 'is empty', 'is not empty', 'is true', 'is false'];

// Operators by data type
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

const logicOptions = [
	{ label: 'AND', value: 'AND' },
	{ label: 'OR', value: 'OR' }
];

const needsRightValue = (operator: string): boolean => {
	return !singleParamOperators.includes(operator);
};

const normalizeConditions = (conditions: InternalCondition[]): Condition[] => {
	return conditions.map((condition) => {
		const { _cachedRight, ...rest } = condition;
		return {
			...rest,
			right: needsRightValue(condition.operator) ? condition.right : ''
		};
	});
};

const CustomConditionsField = ({
	value = [],
	onChange,
	label,
	error,
	errorMessage,
	showInlineError,
	changed,
	disabled,
	field,
	fields,
	fieldType,
	id,
	name,
	placeholder,
	readOnly,
	...restProps
}: CustomConditionsFieldProps) => {
	const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
	const [hoveredType, setHoveredType] = useState<string | null>(null);

	const [internalConditions, setInternalConditions] = useState<InternalCondition[]>([]);

	const isInternalUpdate = useRef(false);

	useEffect(() => {
		if (!isInternalUpdate.current) {
			setInternalConditions(
				value.map((cond) => ({
					...cond,
					_cachedRight: cond.right
				}))
			);
		}
		isInternalUpdate.current = false;
	}, [value]);

	const updateConditions = (newInternalConditions: InternalCondition[]) => {
		setInternalConditions(newInternalConditions);
		isInternalUpdate.current = true;
		onChange(normalizeConditions(newInternalConditions));
	};

	const handleAddCondition = () => {
		const newCondition: InternalCondition = {
			left: '',
			operator: 'is equal to',
			right: '',
			type: 'string',
			logic: 'AND',
			_cachedRight: ''
		};
		updateConditions([...internalConditions, newCondition]);
	};

	const handleRemoveCondition = (index: number) => {
		const newConditions = internalConditions.filter((_, i) => i !== index);
		updateConditions(newConditions);
	};

	const handleUpdateCondition = (index: number, fieldName: keyof Condition, newValue: string) => {
		const newConditions = internalConditions.map((condition, i) => {
			if (i === index) {
				if (fieldName === 'type') {
					const defaultOperator = operatorsByType[newValue]?.[0]?.value || 'is equal to';
					// Giữ nguyên cached right, chỉ đổi type và operator
					return { ...condition, type: newValue, operator: defaultOperator };
				}
				if (fieldName === 'right') {
					return { ...condition, right: newValue, _cachedRight: newValue };
				}
				return { ...condition, [fieldName]: newValue };
			}
			return condition;
		});
		updateConditions(newConditions);
	};

	const handleSelectTypeAndOperator = (index: number, type: string, operator: string) => {
		const newConditions = internalConditions.map((condition, i) => {
			if (i === index) {
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
					...condition,
					type,
					operator,
					right: newRight,
					_cachedRight: newCachedRight
				};
			}
			return condition;
		});
		updateConditions(newConditions);
		setOpenDropdownIndex(null);
		setHoveredType(null);
	};

	return (
		<div className="w-full">
			{label && <label className="block text-sm font-medium mb-2">{label}</label>}

			{/* Hiển thị error nếu cần */}
			{showInlineError && error && <div className="text-red-500 text-sm mb-2">{errorMessage}</div>}

			<div className="space-y-3">
				{internalConditions.map((condition, index) => {
					const showRightValue = needsRightValue(condition.operator);

					return (
						<div key={index}>
							{index > 0 && (
								<div className="mb-2">
									<select
										value={condition.logic || 'AND'}
										onChange={(e) => handleUpdateCondition(index, 'logic', e.target.value)}
										className="bg-gray-700 text-white text-sm rounded px-3 py-1 border border-gray-600 focus:outline-none focus:border-blue-500"
										disabled={disabled}
									>
										{logicOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</div>
							)}

							{/* Condition row */}
							<div className="flex items-center gap-3 bg-gray-800 rounded-lg p-2">
								{/* Left value */}
								<input
									type="text"
									value={condition.left}
									onChange={(e) => handleUpdateCondition(index, 'left', e.target.value)}
									placeholder="value1"
									disabled={disabled}
									readOnly={readOnly}
									className={`bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 ${
										showRightValue ? 'flex-1' : 'flex-[2]'
									}`}
								/>

								<div className="relative">
									<button
										type="button"
										onClick={() => setOpenDropdownIndex(openDropdownIndex === index ? null : index)}
										disabled={disabled}
										className="flex items-center gap-2 bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 hover:border-blue-500 min-w-[180px]"
									>
										<span className="text-gray-400">{typeOptions.find((t) => t.value === condition.type)?.icon || 'T'}</span>
										<span className="flex-1 text-left">{condition.operator}</span>
										<span className="text-gray-400">▼</span>
									</button>

									{/* Dropdown menu */}
									{openDropdownIndex === index && (
										<div className="absolute top-full left-0 mt-1 z-50 flex bg-gray-800 rounded-lg shadow-lg border border-gray-600">
											{/* Type list */}
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

											{/* Operator list */}
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

								{/* Right value - show only if needed (not for single param operators) */}
								{showRightValue && (
									<input
										type="text"
										value={condition.right}
										onChange={(e) => handleUpdateCondition(index, 'right', e.target.value)}
										placeholder="value2"
										disabled={disabled}
										readOnly={readOnly}
										className="flex-1 bg-gray-700 text-white text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
									/>
								)}

								{/* Remove button */}
								<button
									type="button"
									onClick={() => handleRemoveCondition(index)}
									disabled={disabled}
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
						</div>
					);
				})}
			</div>

			{/* Add a condition button */}
			<button
				type="button"
				onClick={handleAddCondition}
				disabled={disabled}
				className="w-full mt-3 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Add condition
			</button>
		</div>
	);
};

export default connectField<CustomConditionsFieldProps>(CustomConditionsField);
