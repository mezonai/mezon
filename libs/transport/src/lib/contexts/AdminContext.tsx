import type { Client } from 'mezon-js';
import React from 'react';
import type { CreateMezonClientOptions } from '../mezon';
import { createClient as createMezonClient } from '../mezon';
export type MezonAdminContextValue = {
	client: Client;
};

const MezonAdminContext = React.createContext<MezonAdminContextValue>({} as MezonAdminContextValue);
type MezonContextProviderProps = {
	children: React.ReactNode;
	mezon: CreateMezonClientOptions;
};
const MezonAdminContextProvider: React.FC<MezonContextProviderProps> = ({ children, mezon }) => {
	const client = createMezonClient(mezon);

	const value = React.useMemo<MezonAdminContextValue>(
		() => ({
			client
		}),
		[client]
	);

	return <MezonAdminContext.Provider value={value}>{children}</MezonAdminContext.Provider>;
};

const MezonAdminContextConsumer = MezonAdminContext.Consumer;
const MezonAdminSuspense: React.FC<{
	children: React.ReactNode;
}> = ({ children }: { children: React.ReactNode }) => {
	const { client } = React.useContext(MezonAdminContext);
	if (!client) {
		return <>Loading...</>;
	}
	// eslint-disable-next-line react/jsx-no-useless-fragment
	return <>{children}</>;
};

export { MezonAdminContext, MezonAdminContextConsumer, MezonAdminContextProvider, MezonAdminSuspense };
