import { useMemo } from 'react';
import type { MenuBuilderPlugin, MenuBuilderPluginSetup } from './MenuBuilder';
import { MenuBuilder } from './MenuBuilder';

export function useMenuBuilderPlugin(setup: MenuBuilderPluginSetup) {
	return {
		setup
	};
}

export function useMenuBuilder(plugins: MenuBuilderPlugin[]) {
	const builder = useMemo(() => new MenuBuilder(plugins), [plugins]);

	const items = useMemo(() => {
		return builder.build();
	}, [builder]);

	return items;
}
