import type { IMessageActionRow } from '@mezon/utils';
import React, { createContext, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';

export interface IEmbedField {
	name: string;
	value: string;
	inline?: boolean;
	inputs?: any;
	shape?: any;
	button?: any[];
}

export interface IEmbedObject {
	author?: {
		name: string;
		url?: string;
		icon_url?: string;
	};
	title?: string;
	description?: string;
	url?: string;
	color?: string;
	timestamp?: string;
	image?: {
		url: string;
		width?: number;
		height?: number;
	};
	footer?: {
		text: string;
		icon_url?: string;
	};
	thumbnail?: {
		url: string;
	};
	fields?: IEmbedField[];
	components?: any[];
}

export interface IEmbedData {
	embed?: IEmbedObject;
	components?: IMessageActionRow[];
}

interface EmbedBuilderContextType {
	data: IEmbedData;
	updateEmbed: (partialEmbed: Partial<IEmbedObject>) => void;
	updateData: (data: Partial<IEmbedData>) => void;
	updateEmbedSection: (section: keyof IEmbedObject, data: any) => void;
	setData: (data: IEmbedData) => void;
}

const defaultData: IEmbedData = {
	embed: {
		color: '#3b82f6',
		fields: []
	},
	components: []
};

const EmbedBuilderContext = createContext<EmbedBuilderContextType | undefined>(undefined);

export const EmbedBuilderProvider: React.FC<{ children: React.ReactNode; initialData?: IEmbedData }> = ({ children, initialData }) => {
	const [data, setDataState] = useState<IEmbedData>(() => initialData || defaultData);
	const prevInitialDataRef = useRef<string>();

	useLayoutEffect(() => {
		if (initialData) {
			const currentDataStr = JSON.stringify(initialData);
			if (currentDataStr !== prevInitialDataRef.current) {
				prevInitialDataRef.current = currentDataStr;
				setDataState(initialData);
			}
		}
	}, [initialData]);

	const setData = useCallback((newData: IEmbedData) => {
		setDataState(newData);
	}, []);

	const updateData = useCallback((partial: Partial<IEmbedData>) => {
		setDataState((prev) => {
			const newState = { ...prev };

			if ('components' in partial) {
				newState.components = partial.components;
			}

			if ('embed' in partial) {
				newState.embed = { ...(prev.embed || {}), ...partial.embed };
			}

			return newState;
		});
	}, []);

	const updateEmbed = useCallback((partialEmbed: Partial<IEmbedObject>) => {
		setDataState((prev) => ({
			...prev,
			embed: {
				...(prev.embed || {}),
				...partialEmbed
			}
		}));
	}, []);

	const updateEmbedSection = useCallback((section: keyof IEmbedObject, sectionData: any) => {
		setDataState((prev) => {
			const currentEmbed = prev.embed || {};
			const currentValue = (currentEmbed as any)[section];
			const prevSectionData = currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue) ? currentValue : {};

			return {
				...prev,
				embed: {
					...currentEmbed,
					[section]: {
						...prevSectionData,
						...sectionData
					}
				}
			};
		});
	}, []);

	return (
		<EmbedBuilderContext.Provider value={{ data, updateData, updateEmbed, updateEmbedSection, setData }}>{children}</EmbedBuilderContext.Provider>
	);
};

export const useEmbedBuilder = () => {
	const context = useContext(EmbedBuilderContext);
	if (!context) {
		throw new Error('useEmbedBuilder must be used within an EmbedBuilderProvider');
	}
	return context;
};
