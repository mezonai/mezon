import { debounce, normalizeSearchString } from '@mezon/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface MentionData {
	id: string;
	display: string;
	src?: string;
	category?: string;
	shortname?: string;
	is_for_sale?: boolean;
	emoji?: string;
	[key: string]: unknown;
}

export interface MentionState {
	isActive: boolean;
	query: string;
	startPos: number;
	endPos: number;
	suggestions: MentionData[];
	isLoading: boolean;
	selectedIndex: number;
}

export interface MentionProps {
	trigger: string;
	title: string;
	displayPrefix?: string;
	data: MentionData[] | ((query: string) => Promise<MentionData[]>) | ((query: string) => MentionData[]);
	renderSuggestion?: (
		suggestion: MentionData,
		search: string,
		highlightedDisplay: React.ReactNode,
		index: number,
		focused: boolean
	) => React.ReactNode;
	markup?: string;
	displayTransform?: (id: string, display: string) => string;
	regex?: RegExp;
	onAdd?: (id: string, display: string, startPos: number, endPos: number) => void;
	appendSpaceOnAdd?: boolean;
	allowSpaceInQuery?: boolean;
	allowedCharacters?: string;
	style?: React.CSSProperties;
	className?: string;
	mentionState?: MentionState;
	onSelect?: (suggestion: MentionData) => void;
	onKeyDown?: (e: React.KeyboardEvent) => boolean;
	suggestionsClassName?: string;
	suggestionStyle?: React.CSSProperties;
	onMouseEnter?: (index: number) => void;
	triggerSelection?: boolean;
	onSelectionTriggered?: () => void;
	onSuggestionsChange?: (count: number, isLoading: boolean) => void;
}

export default function Mention({
	trigger,
	title,
	data,
	renderSuggestion,
	markup = `${trigger}[__display__](__id__)`,
	displayTransform,
	onAdd,
	appendSpaceOnAdd = true,
	className = '',
	style,
	mentionState,
	onSelect,
	onKeyDown,
	suggestionsClassName = '',
	suggestionStyle,
	onMouseEnter,
	triggerSelection,
	onSelectionTriggered,
	onSuggestionsChange
}: MentionProps) {
	const [suggestions, setSuggestions] = useState<MentionData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	const prioritizeAndLimitResults = useCallback((results: MentionData[], query: string) => {
		const queryLower = query.toLowerCase();

		const sortByRelevance = (items: MentionData[]) => {
			return items.sort((a, b) => {
				const aDisplay = a.display?.toLowerCase() || '';
				const bDisplay = b.display?.toLowerCase() || '';
				const aUsername = (a as MentionData & { username?: string }).username?.toLowerCase() || '';
				const bUsername = (b as MentionData & { username?: string }).username?.toLowerCase() || '';

				const aExactMatch = aDisplay === queryLower || aUsername === queryLower;
				const bExactMatch = bDisplay === queryLower || bUsername === queryLower;

				if (aExactMatch && !bExactMatch) return -1;
				if (!aExactMatch && bExactMatch) return 1;

				const aStartsWith = aDisplay.startsWith(queryLower) || aUsername.startsWith(queryLower);
				const bStartsWith = bDisplay.startsWith(queryLower) || bUsername.startsWith(queryLower);

				if (aStartsWith && !bStartsWith) return -1;
				if (!aStartsWith && bStartsWith) return 1;

				return 0;
			});
		};

		const roles = results.filter((item: MentionData & { isRole?: boolean }) => item.isRole);
		const users = results.filter((item: MentionData & { isRole?: boolean }) => !item.isRole);

		const sortedRoles = sortByRelevance(roles);
		const sortedUsers = sortByRelevance(users);

		return [...sortedRoles, ...sortedUsers].slice(0, 10);
	}, []);

	const loadSuggestions = useCallback(
		async (query: string) => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			if (Array.isArray(data)) {
				const normalizedQuery = normalizeSearchString(query);
				const matchedItems: MentionData[] = [];

				for (const item of data) {
					const normalizedDisplay = normalizeSearchString(item.display || '');
					const normalizedUsername = normalizeSearchString((item as MentionData & { username?: string }).username || '');
					const normalizedDisplayName = normalizeSearchString((item as MentionData & { displayName?: string }).displayName || '');
					const normalizedSubText = normalizeSearchString((item as MentionData & { subText?: string }).subText || '');

					if (
						normalizedDisplay.includes(normalizedQuery) ||
						normalizedUsername.includes(normalizedQuery) ||
						normalizedDisplayName.includes(normalizedQuery) ||
						normalizedSubText.includes(normalizedQuery)
					) {
						matchedItems.push(item);
					}
				}

				const filtered = prioritizeAndLimitResults(matchedItems, query);
				setSuggestions(filtered);
				onSuggestionsChange?.(filtered.length, false);
				return;
			}

			if (typeof data === 'function') {
				try {
					setIsLoading(true);
					const result = data(query);
					if (result instanceof Promise) {
						const resolved = await result;
						const prioritizedResults = prioritizeAndLimitResults(resolved, query);

						setSuggestions(prioritizedResults);
						onSuggestionsChange?.(prioritizedResults.length, false);
					} else {
						const prioritizedResults = prioritizeAndLimitResults(result, query);
						setSuggestions(prioritizedResults);
						onSuggestionsChange?.(prioritizedResults.length, false);
					}
				} catch (error) {
					if (error instanceof Error && error.name !== 'AbortError') {
						console.error('Error loading mention suggestions:', error);
						setSuggestions([]);
						onSuggestionsChange?.(0, false);
					}
				} finally {
					if (!abortControllerRef.current?.signal.aborted) {
						setIsLoading(false);
					}
				}
			}
		},
		[data]
	);

	const handleSelect = useCallback(
		(suggestion: MentionData) => {
			onSelect?.(suggestion);
			onAdd?.(suggestion.id, suggestion.display, mentionState?.startPos || 0, mentionState?.endPos || 0);
		},
		[onSelect, onAdd, mentionState]
	);

	const debouncedLoadSuggestions = useCallback(
		debounce((query: string) => {
			loadSuggestions(query);
		}, 50),
		[loadSuggestions]
	);

	useEffect(() => {
		if (mentionState && mentionState.query !== undefined) {
			debouncedLoadSuggestions(mentionState.query);
		} else {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			setSuggestions([]);
			setIsLoading(false);
			onSuggestionsChange?.(0, false);
		}

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [mentionState?.query, debouncedLoadSuggestions]);

	useEffect(() => {
		if (triggerSelection && mentionState?.isActive && suggestions.length > 0) {
			const selectedSuggestion = suggestions[mentionState.selectedIndex];
			if (selectedSuggestion) {
				handleSelect(selectedSuggestion);
			}
			onSelectionTriggered?.();
		}
	}, [triggerSelection, mentionState?.isActive, mentionState?.selectedIndex, suggestions, handleSelect, onSelectionTriggered]);

	if (suggestions.length <= 0) {
		return null;
	}

	return (
		<div className={`mention-dropdown thread-scroll ${className} ${suggestionsClassName}`} style={{ ...style, ...suggestionStyle }}>
			<div className="flex items-center justify-between p-2 h-10">
				<h3 className="text-xs font-bold text-theme-primary uppercase">{title}</h3>
			</div>
			{suggestions.map((suggestion, index) => {
				const focused = index === (mentionState?.selectedIndex || 0);

				if (renderSuggestion) {
					const query = mentionState?.query || '';
					return (
						<div
							key={suggestion.id}
							onClick={() => handleSelect(suggestion)}
							onTouchEnd={(e) => {
								e.preventDefault();
								handleSelect(suggestion);
							}}
							onMouseEnter={() => onMouseEnter?.(index)}
						>
							{renderSuggestion(suggestion, query, <span>{suggestion.display}</span>, index, focused)}
						</div>
					);
				}

				return (
					<div
						key={suggestion.id}
						className={`mention-item ${focused ? 'selected' : ''}`}
						onClick={() => handleSelect(suggestion)}
						onTouchEnd={(e) => {
							e.preventDefault();
							handleSelect(suggestion);
						}}
						onMouseEnter={() => onMouseEnter?.(index)}
					>
						<div className="mention-item-name">{suggestion.display}</div>
					</div>
				);
			})}
		</div>
	);
}
