import React from 'react';

export const filterOptionReactSelect = (option: { label: JSX.Element | string; value: string }, inputValue: string) => {
	let label = '';
	if (React.isValidElement(option.label)) {
		const children = (option.label as JSX.Element).props.children;

		if (Array.isArray(children)) {
			const secondChild = children[1];
			if (React.isValidElement(secondChild)) {
				label = (secondChild as React.ReactElement<any>).props.children?.toString() || '';
			} else {
				label = secondChild?.toString() || '';
			}
		} else {
			label = children?.toString() || '';
		}
	} else if (typeof option.label === 'string') {
		label = option.label;
	}
	return label.toLowerCase().includes(inputValue.toLowerCase());
};
