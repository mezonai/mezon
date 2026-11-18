import { HighlightMatchBold } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';

interface CommandSuggestionProps {
	display: string;
	description: string;
	search: string;
	focused: boolean;
}

export const CommandSuggestion = ({ display, description, search, focused }: CommandSuggestionProps) => (
	<div
		className={`bg-item-theme-hover flex min-w-0 items-start gap-3 px-3 py-2.5 cursor-pointer rounded-lg ${focused ? 'bg-item-theme text-white' : ''}`}
		data-e2e={generateE2eId('suggest_item')}
	>
		<span className="max-w-[40%] shrink-0 truncate text-sm font-semibold text-theme-primary-active" title={`/${display}`}>
			/{HighlightMatchBold(display, search)}
		</span>
		<span
			className="min-w-0 flex-1 line-clamp-2 whitespace-pre-wrap text-sm text-theme-primary [overflow-wrap:anywhere]"
			title={description}
			data-e2e={generateE2eId('suggest_item.username')}
		>
			{HighlightMatchBold(description, search)}
		</span>
	</div>
);
