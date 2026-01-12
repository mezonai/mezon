import React, { useCallback, useMemo } from 'react';
import type { HTMLFieldProps } from 'uniforms';
import { connectField } from 'uniforms';
import { EmbedBuilder } from '../EmbedBuilder';
import type { IEmbedData, IEmbedObject } from '../EmbedBuilder/context/EmbedBuilderContext';

type CustomEmbedFieldProps = HTMLFieldProps<any, HTMLDivElement> & {
	className?: string;
};

const fromBackendFormat = (backendData: any): IEmbedData => {
	if (!backendData) {
		return { embed: {}, components: [] };
	}

	if ('embed' in backendData && typeof backendData.embed === 'object' && 'components' in backendData) {
		return backendData as IEmbedData;
	}

	const { components, ...embedFields } = backendData;

	return {
		embed: embedFields as IEmbedObject,
		components: components || []
	};
};

const toBackendFormat = (embedData: IEmbedData): any => {
	return {
		...embedData.embed,
		components: embedData.components
	};
};

const CustomEmbedFieldBase: React.FC<CustomEmbedFieldProps> = ({ value, onChange, className, errorMessage, showInlineError }) => {
	const normalizedValue = useMemo(() => fromBackendFormat(value), [value]);

	const handleChange = useCallback(
		(data: IEmbedData) => {
			if (onChange) {
				const backendFormat = toBackendFormat(data);
				onChange(backendFormat);
			}
		},
		[onChange]
	);

	return (
		<div className={`w-full h-full flex flex-col min-h-0 ${className || ''}`}>
			{/*{label && <label className="block text-sm mb-1">{label}</label>}*/}
			<div className="flex-1 min-h-0">
				<EmbedBuilder initialValue={normalizedValue} onChange={handleChange} />
			</div>
			{showInlineError && errorMessage && <span className="text-xs text-red-500 mt-1 block">{errorMessage}</span>}
		</div>
	);
};

export const CustomEmbedField = connectField(CustomEmbedFieldBase);
