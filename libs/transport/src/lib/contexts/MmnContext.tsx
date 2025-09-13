import type { MmnClient, MmnClientConfig } from '@mezonai/mmn-client-js';
import { createMmnClient } from '@mezonai/mmn-client-js';
import React, { createContext, useContext, useMemo } from 'react';

export interface MmnContextProviderProps {
	children: React.ReactNode;
	config?: MmnClientConfig;
}

export type MmnContextValue = {
	client: MmnClient;
	config: MmnClientConfig;
};

const MmnContext = createContext<MmnContextValue | null>(null);

export const MmnContextProvider: React.FC<MmnContextProviderProps> = ({
	children,
	config = {
		baseUrl: process.env.NX_MMN_CLIENT_BASE_URL || '',
		timeout: 30000,
		headers: {
			'Content-Type': 'application/json'
		}
	}
}) => {
	const client = useMemo(() => {
		return createMmnClient(config);
	}, [config]);

	const value = useMemo<MmnContextValue>(
		() => ({
			client,
			config
		}),
		[client, config]
	);

	return <MmnContext.Provider value={value}>{children}</MmnContext.Provider>;
};

export const useMmn = (): MmnContextValue => {
	const context = useContext(MmnContext);
	if (!context) {
		throw new Error('useMmn must be used within a MmnContextProvider');
	}
	return context;
};

export { MmnContext };

