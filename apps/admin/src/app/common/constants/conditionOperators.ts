// Operators for each data type
import { BooleanIcon, CalendarIcon, ListIcon, NumberIcon, ObjectIcon, StringIcon } from '../../../assets/icons/conditionIcon';

export const SingleParamOperators = ['exists', 'does not exist', 'is empty', 'is not empty', 'is true', 'is false'];

export const OperatorsByType: Record<string, { label: string; value: string }[]> = {
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

export const TypeOptions = [
	{ label: 'String', value: 'string', icon: StringIcon },
	{ label: 'Number', value: 'number', icon: NumberIcon },
	{ label: 'Date & Time', value: 'dateTime', icon: CalendarIcon },
	{ label: 'Boolean', value: 'boolean', icon: BooleanIcon },
	{ label: 'Array', value: 'array', icon: ListIcon },
	{ label: 'Object', value: 'object', icon: ObjectIcon }
];
