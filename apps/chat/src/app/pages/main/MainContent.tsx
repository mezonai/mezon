import { EmojiSuggestionProvider } from '@mezon/core';
import { memo } from 'react';
import { Outlet } from 'react-router-dom';

export const MainContent = memo(
	() => (
		// <EmojiSuggestionProvider isMobile={false}>
			<Outlet />
		// </EmojiSuggestionProvider>
	),
	() => true
);
