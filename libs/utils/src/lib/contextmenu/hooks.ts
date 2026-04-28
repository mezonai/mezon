import { useMemo } from 'react';
import { MenuBuilder, MenuBuilderPlugin, MenuBuilderPluginSetup } from './MenuBuilder';

export function createMenuBuilderPlugin(setup: MenuBuilderPluginSetup) {
	return {
		setup: setup
	};
}

export function useMenuBuilder(plugins: MenuBuilderPlugin[]) {
	const builder = useMemo(() => new MenuBuilder(plugins), [plugins]);

	const items = useMemo(() => {
		return builder.build();
	}, [builder]);

	return items;
}
