import { debounce, normalizeSearchString } from '@mezon/utils';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const MAX_ROWS = 10;

type RowFlags = MentionData & { isRole?: boolean; isRemote?: boolean; username?: string; displayName?: string; subText?: string };

const matchesQuery = (item: MentionData, normalizedQuery: string) => {
	const row = item as RowFlags;
	return [row.display, row.username, row.displayName, row.subText].some((field) => normalizeSearchString(field || '').includes(normalizedQuery));
};

export interface MentionData {
	id: string;
	display: string;
	src?: string;
	category?: string;
	shortname?: string;
	is_for_sale?: boolean;
	type?: number;
	parent_id?: string;
	channel_private?: number;
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
	// Matches known right away, picked from when Enter/Tab lands while the `data` answer for the query is pending.
	getImmediateSuggestions?: (query: string) => MentionData[];
	// Changing it reloads the suggestions for the current query.
	refreshKey?: unknown;
	// Whether a slow source is still searching this query; the dropdown then shows `searchingLabel` instead of closing.
	isSearching?: (query: string) => boolean;
	searchingLabel?: string;
	// Enter/Tab found no row to pick for the typed query.
	onSelectionUnresolved?: () => void;
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
	onSuggestionsChange,
	getImmediateSuggestions,
	refreshKey,
	isSearching,
	searchingLabel,
	onSelectionUnresolved
}: MentionProps) {
	const [suggestions, setSuggestions] = useState<MentionData[]>([]);
	// The query `suggestions` answers: an older one while the answer for the current query is pending.
	const [suggestionsQuery, setSuggestionsQuery] = useState<string | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	// Only the latest load may fill the dropdown: an answer for an older query that lands late is dropped.
	const loadIdRef = useRef(0);
	const shownRef = useRef<{ suggestions: MentionData[]; query: string | null }>({ suggestions: [], query: null });
	const selectedIndexRef = useRef(0);
	selectedIndexRef.current = mentionState?.selectedIndex ?? 0;
	const isSearchingRef = useRef(isSearching);
	isSearchingRef.current = isSearching;
	const getImmediateSuggestionsRef = useRef(getImmediateSuggestions);
	getImmediateSuggestionsRef.current = getImmediateSuggestions;
	const dropdownRef = useRef<HTMLDivElement | null>(null);
	// The query an async `data` call is still answering.
	const pendingQueryRef = useRef<string | null>(null);

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

		const roles = results.filter((item: RowFlags) => item.isRole);
		const users = results.filter((item: RowFlags) => !item.isRole && !item.isRemote);
		// Rows from a slow source form their own group below, so landing late never moves the rows already on screen.
		const remote = results.filter((item: RowFlags) => !item.isRole && item.isRemote);

		const sortedRoles = sortByRelevance(roles);
		const sortedUsers = sortByRelevance(users);

		return [...[...sortedRoles, ...sortedUsers].slice(0, MAX_ROWS), ...sortByRelevance(remote).slice(0, MAX_ROWS)];
	}, []);

	// Puts rows on screen. The highlight stays on the same member when the rows change under it: a late source answering
	// this query, or newer rows replacing held ones the user had moved through.
	const replaceRows = useCallback(
		(items: MentionData[], query: string, loading: boolean) => {
			const shown = shownRef.current;
			const selectedId = shown.query === query || selectedIndexRef.current > 0 ? shown.suggestions[selectedIndexRef.current]?.id : undefined;
			shownRef.current = { suggestions: items, query };
			setSuggestions(items);
			setSuggestionsQuery(query);
			onSuggestionsChange?.(items.length, loading);
			if (selectedId !== undefined) {
				const index = items.findIndex((item) => item.id === selectedId);
				if (index !== selectedIndexRef.current) {
					onMouseEnter?.(Math.max(index, 0));
				}
			}
		},
		[onSuggestionsChange, onMouseEnter]
	);

	const showSuggestions = useCallback(
		(items: MentionData[], query: string) => {
			pendingQueryRef.current = null;
			// With nothing to show yet, a pending search keeps the dropdown open (and Enter waiting for it).
			replaceRows(items, query, items.length === 0 && !!isSearchingRef.current?.(query));
		},
		[replaceRows]
	);

	// An answer for an earlier query landed while the current one is still pending. When it is newer than the rows on
	// screen, show its rows that still match what is typed now, so the list fills in while typing instead of growing after.
	const showEarlierAnswer = useCallback(
		(items: MentionData[], query: string) => {
			const current = pendingQueryRef.current;
			const shown = shownRef.current;
			if (current === null || !current.toLowerCase().startsWith(query.toLowerCase())) return;
			if (shown.query !== null && !query.toLowerCase().startsWith(shown.query.toLowerCase())) return;
			// Only a slow source's rows are worth showing early: the local ones come with the current answer anyway.
			const remote = items.filter((item: RowFlags) => item.isRemote);
			if (remote.length === 0) return;
			const normalized = normalizeSearchString(current);
			const immediate = getImmediateSuggestionsRef.current;
			const local = immediate ? immediate(current) : items.filter((item: RowFlags) => !item.isRemote && matchesQuery(item, normalized));
			const matching = prioritizeAndLimitResults([...local, ...remote.filter((item) => matchesQuery(item, normalized))], current);
			// Never trade rows on screen for fewer: the answer for the current query replaces them soon anyway.
			if (
				matching.length === 0 ||
				matching.length < shown.suggestions.length ||
				(shown.query === query && matching.length === shown.suggestions.length)
			) {
				return;
			}
			// Still an older query's rows: Enter keeps treating them as held.
			replaceRows(matching, query, true);
		},
		[replaceRows, prioritizeAndLimitResults]
	);

	const loadSuggestions = useCallback(
		async (query: string) => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			const loadId = ++loadIdRef.current;

			if (Array.isArray(data)) {
				const normalizedQuery = normalizeSearchString(query);
				const matchedItems = data.filter((item) => matchesQuery(item, normalizedQuery));
				showSuggestions(prioritizeAndLimitResults(matchedItems, query), query);
				return;
			}

			if (typeof data === 'function') {
				try {
					const result = data(query);
					if (result instanceof Promise) {
						pendingQueryRef.current = query;
						// An answer still pending after this tick keeps the dropdown active, so Enter/Tab picks a member instead of
						// sending. Answers that come at once (no server search) settle first and cost no extra render.
						const pendingReport = setTimeout(() => {
							if (loadId === loadIdRef.current) onSuggestionsChange?.(shownRef.current.suggestions.length, true);
						}, 0);
						const resolved = await result.finally(() => clearTimeout(pendingReport));
						if (loadId !== loadIdRef.current) {
							showEarlierAnswer(resolved, query);
							return;
						}
						showSuggestions(prioritizeAndLimitResults(resolved, query), query);
					} else {
						showSuggestions(prioritizeAndLimitResults(result, query), query);
					}
				} catch (error) {
					if (loadId !== loadIdRef.current) return;
					if (error instanceof Error && error.name !== 'AbortError') {
						console.error('Error loading mention suggestions:', error);
					}
					showSuggestions([], query);
				}
			}
		},
		[data, showSuggestions, showEarlierAnswer, prioritizeAndLimitResults, onSuggestionsChange]
	);

	const handleSelect = useCallback(
		(suggestion: MentionData) => {
			onSelect?.(suggestion);
			onAdd?.(suggestion.id, suggestion.display, mentionState?.startPos || 0, mentionState?.endPos || 0);
		},
		[onSelect, onAdd, mentionState]
	);

	// `debounce` runs both the first and the last call of a burst, so a lone keystroke would load the same query twice.
	const lastLoadRef = useRef<{ query: string; load: typeof loadSuggestions } | null>(null);
	const debouncedLoadSuggestions = useCallback(
		debounce((query: string) => {
			if (lastLoadRef.current?.query === query && lastLoadRef.current.load === loadSuggestions) return;
			lastLoadRef.current = { query, load: loadSuggestions };
			loadSuggestions(query);
		}, 50),
		[loadSuggestions]
	);

	// A refresh must load the current query again.
	useEffect(() => {
		lastLoadRef.current = null;
	}, [refreshKey]);

	useEffect(() => {
		if (mentionState && mentionState.query !== undefined) {
			debouncedLoadSuggestions(mentionState.query);
		} else {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			loadIdRef.current++;
			shownRef.current = { suggestions: [], query: null };
			setSuggestions([]);
			setSuggestionsQuery(null);
			onSuggestionsChange?.(0, false);
		}

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [mentionState?.query, debouncedLoadSuggestions, refreshKey]);

	// An answer landing after the dropdown closed must not reach the next mention.
	useEffect(
		() => () => {
			loadIdRef.current++;
		},
		[]
	);

	useEffect(() => {
		if (!triggerSelection || !mentionState) return;
		const query = mentionState.query;
		if (suggestionsQuery !== query) {
			// The rows on screen answer an older query. A row the user moved to since the last keystroke is their pick
			// while it still matches what is typed; otherwise take the best match known for this query.
			const moved = mentionState.selectedIndex > 0 ? suggestions[mentionState.selectedIndex] : undefined;
			const movedTo = moved && matchesQuery(moved, normalizeSearchString(query)) ? moved : undefined;
			const immediate = movedTo || !getImmediateSuggestions ? [] : prioritizeAndLimitResults(getImmediateSuggestions(query), query);
			const pick = movedTo ?? immediate[0];
			if (pick) {
				handleSelect(pick);
				onSelectionTriggered?.();
				return;
			}
			// Nothing to pick yet: wait for the answer, unless this reads as a sentence typed after a mention that matched
			// nobody and nothing is still being searched.
			if (suggestions.length > 0 || !/\s/.test(query.trim()) || pendingQueryRef.current !== null) return;
			onSelectionTriggered?.();
			onSelectionUnresolved?.();
			return;
		}
		const selectedSuggestion = suggestions[mentionState.selectedIndex] ?? suggestions[0];
		if (selectedSuggestion) {
			handleSelect(selectedSuggestion);
		} else if (isSearchingRef.current?.(query) || pendingQueryRef.current === query) {
			// No rows yet, but an answer for this query is still coming.
			return;
		}
		onSelectionTriggered?.();
		if (!selectedSuggestion) {
			onSelectionUnresolved?.();
		}
	}, [
		triggerSelection,
		mentionState,
		suggestions,
		suggestionsQuery,
		getImmediateSuggestions,
		prioritizeAndLimitResults,
		handleSelect,
		onSelectionTriggered,
		onSelectionUnresolved
	]);

	const overflowing = suggestions.length > MAX_ROWS;

	// Past MAX_ROWS (a slow source's group below the local one) the dropdown keeps the height of MAX_ROWS rows and scrolls,
	// following the highlighted row.
	useLayoutEffect(() => {
		const dropdown = dropdownRef.current;
		if (!dropdown) return;
		if (!overflowing) {
			dropdown.style.maxHeight = '';
			return;
		}
		const lastVisible = dropdown.children[MAX_ROWS] as HTMLElement | undefined;
		if (lastVisible) {
			dropdown.style.maxHeight = `${lastVisible.offsetTop + lastVisible.offsetHeight}px`;
		}
	}, [overflowing, suggestions]);

	const selectedIndex = mentionState?.selectedIndex ?? 0;
	useLayoutEffect(() => {
		const dropdown = dropdownRef.current;
		const row = dropdown?.children[selectedIndex + 1] as HTMLElement | undefined;
		if (!dropdown || !row || !overflowing) return;
		if (row.offsetTop < dropdown.scrollTop) {
			dropdown.scrollTop = row.offsetTop;
		} else if (row.offsetTop + row.offsetHeight > dropdown.scrollTop + dropdown.clientHeight) {
			dropdown.scrollTop = row.offsetTop + row.offsetHeight - dropdown.clientHeight;
		}
	}, [selectedIndex, overflowing, suggestions]);

	if (suggestions.length <= 0) {
		if (!mentionState || !isSearching?.(mentionState.query)) {
			return null;
		}
		return (
			<div className={`mention-dropdown thread-scroll ${className} ${suggestionsClassName}`} style={{ ...style, ...suggestionStyle }}>
				<div className="flex items-center justify-between p-2 h-10">
					<h3 className="text-xs font-bold text-theme-primary uppercase">{title}</h3>
				</div>
				<div className="px-3 py-2 text-sm text-theme-primary opacity-70">{searchingLabel ?? 'Searching...'}</div>
			</div>
		);
	}

	return (
		<div
			ref={dropdownRef}
			className={`mention-dropdown thread-scroll ${overflowing ? 'overflow-y-auto' : ''} ${className} ${suggestionsClassName}`}
			style={{ ...style, ...suggestionStyle }}
		>
			<div className="flex items-center justify-between p-2 h-10">
				<h3 className="text-xs font-bold text-theme-primary uppercase">{title}</h3>
			</div>
			{suggestions.map((suggestion, index) => {
				const focused = index === (mentionState?.selectedIndex || 0);
				// Only a pointer that moves picks a row: rows that slide under a resting pointer as the list changes must not.
				const hoverSelect = () => {
					if (!focused) onMouseEnter?.(index);
				};

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
							onMouseMove={hoverSelect}
						>
							{renderSuggestion(suggestion, query, <span>{suggestion.display}</span>, index, focused)}
						</div>
					);
				}

				return (
					<div
						key={suggestion.id}
						className={`bg-item-theme ${focused ? 'selected' : ''}`}
						onClick={() => handleSelect(suggestion)}
						onTouchEnd={(e) => {
							e.preventDefault();
							handleSelect(suggestion);
						}}
						onMouseMove={hoverSelect}
					>
						<div className="bg-item-theme">{suggestion.display}</div>
					</div>
				);
			})}
		</div>
	);
}
