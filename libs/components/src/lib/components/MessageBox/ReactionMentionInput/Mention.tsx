import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface MentionData {
	id: string;
	display: string;
	src?: string;
	category?: string;
	shortname?: string;
	is_for_sale?: boolean;
	emoji?: string;
	[key: string]: any;
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
	renderSuggestion?: (suggestion: MentionData, search: string, highlightedDisplay: React.ReactNode, index: number, focused: boolean) => React.ReactNode;
	markup?: string;
	displayTransform?: (id: string, display: string) => string;
	regex?: RegExp;
	onAdd?: (id: string, display: string, startPos: number, endPos: number) => void;
	appendSpaceOnAdd?: boolean;
	allowSpaceInQuery?: boolean;
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
	className = "",
	style,
	mentionState,
	onSelect,
	onKeyDown,
	suggestionsClassName = "",
	suggestionStyle,
	onMouseEnter,
	triggerSelection,
	onSelectionTriggered,
	onSuggestionsChange,
}: MentionProps) {
	const [suggestions, setSuggestions] = useState<MentionData[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const loadSuggestions = useCallback(async (query: string) => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

    console.log(query);


		if (Array.isArray(data)) {
			const queryLower = query.toLowerCase();
			const filtered: MentionData[] = [];

			for (const item of data) {
				if (filtered.length >= 10) break;

				const display = item.display?.toLowerCase() || '';
				const username = (item as any).username?.toLowerCase() || '';
				const displayName = (item as any).displayName?.toLowerCase() || '';
				const subText = (item as any).subText?.toLowerCase() || '';

				if (display.includes(queryLower) || username.includes(queryLower) || displayName.includes(queryLower) || subText.includes(queryLower)) {
					filtered.push(item);
				}
			}

			setSuggestions(filtered);
			onSuggestionsChange?.(filtered.length, false);
			return;
		}

		if (typeof data === 'function') {
			try {
				setIsLoading(true);
				abortControllerRef.current = new AbortController();
				const result = data(query);
				if (result instanceof Promise) {
					const resolved = await result;
					if (!abortControllerRef.current?.signal.aborted) {
						const slicedResults = resolved.slice(0, 10);
						setSuggestions(slicedResults);
						onSuggestionsChange?.(slicedResults.length, false);
					}
				} else {
					if (!abortControllerRef.current?.signal.aborted) {
						const slicedResults = result.slice(0, 10);
						setSuggestions(slicedResults);
						onSuggestionsChange?.(slicedResults.length, false);
					}
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
	}, [data]);

	const handleSelect = useCallback((suggestion: MentionData) => {
		onSelect?.(suggestion);
		onAdd?.(suggestion.id, suggestion.display, mentionState?.startPos || 0, mentionState?.endPos || 0);
	}, [onSelect, onAdd, mentionState]);

	const debouncedLoadSuggestions = useCallback((query: string) => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		debounceTimeoutRef.current = setTimeout(() => {
			loadSuggestions(query);
		}, 100);
	}, [loadSuggestions]);

	useEffect(() => {
		if (mentionState?.isActive && mentionState.query !== undefined) {
			debouncedLoadSuggestions(mentionState.query);
		} else {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			setSuggestions([]);
			setIsLoading(false);
			onSuggestionsChange?.(0, false);
		}

		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [mentionState?.isActive, mentionState?.query, debouncedLoadSuggestions]);

	useEffect(() => {
		if (triggerSelection && mentionState?.isActive && suggestions.length > 0) {
			const selectedSuggestion = suggestions[mentionState.selectedIndex];
			if (selectedSuggestion) {
				handleSelect(selectedSuggestion);
			}
			onSelectionTriggered?.();
		}
	}, [triggerSelection, mentionState?.isActive, mentionState?.selectedIndex, suggestions, handleSelect, onSelectionTriggered]);

	if (!mentionState?.isActive) {
		return null;
	}

	if (isLoading) {
		return (
			<div
				className={`mention-dropdown ${suggestionsClassName}`}
				style={suggestionStyle}
			>
				<div className="mention-item mention-loading">Loading...</div>
			</div>
		);
	}

	if (suggestions.length === 0) {
		return null;
	}

	return (
		<div
			className={`mention-dropdown thread-scroll ${className} ${suggestionsClassName}`}
			style={{ ...style, ...suggestionStyle }}
		>
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
							{renderSuggestion(
								suggestion,
								query,
								<span>{suggestion.display}</span>,
								index,
								focused
							)}
						</div>
					);
				}

				return (
					<div
						key={suggestion.id}
						className={`mention-item ${focused ? "selected" : ""}`}
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
