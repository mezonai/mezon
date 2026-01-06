import { getStore, selectAllChannels } from '@mezon/store';
import { searchMentionsHashtag } from '@mezon/utils';
import { ChannelStreamMode, ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mention as MentionComponent, MentionsInput as MentionsInputComponent } from 'react-mentions';
import { UserMentionList } from '../UserMentionList';
import SelectGroup from './SelectGroup';
import SelectItemUser from './SelectItemUser';
import type { ChannelOption, HasOption, SearchInputProps } from './types';

const MentionsInput = MentionsInputComponent as any;
const Mention = MentionComponent as any;
const MentionsInputStyle = {
	background: 'var(--bg-item-hover)',
	borderRadius: '4px',
	padding: '0 2px'
};

const HAS_OPTIONS: HasOption[] = [
	{ id: 'video', display: 'video' },
	{ id: 'link', display: 'link' },
	{ id: 'image', display: 'image' }
];

const SearchInput = ({
	channelId,
	mode,
	currentClanId,
	valueInputSearch,
	valueDisplay,
	appearanceTheme,
	lightMentionsInputStyle,
	darkMentionsInputStyle,
	searchRef,
	onInputClick,
	onKeyDown,
	onChange,
	setIsShowSearchOptions
}: SearchInputProps) => {
	const { t } = useTranslation('searchMessageChannel');
	const isClanMode = mode === ChannelStreamMode.STREAM_MODE_CHANNEL;
	const userListData = UserMentionList({
		channelID: channelId,
		channelMode: mode
	});

	const channelOptions: ChannelOption[] = useMemo(() => {
		const allChannels = selectAllChannels(getStore().getState());
		const textChannels = allChannels
			.filter(
				(channel) =>
					(channel.type === ChannelType.CHANNEL_TYPE_CHANNEL || channel.type === ChannelType.CHANNEL_TYPE_THREAD) &&
					channel.clanId === currentClanId
			)
			.map((channel) => ({
				id: channel.channelId || channel.id,
				display: channel.channelLabel || ''
			}));

		return [...textChannels];
	}, [currentClanId]);

	const [valueHighlight, setValueHighlight] = useState<string>('');
	const [activeTrigger, setActiveTrigger] = useState<string>('');

	const triggerGroupNames: Record<string, string> = useMemo(
		() => ({
			'>': t('fromUser'),
			'~': t('mentionsUser'),
			'&': t('hasContent'),
			'#': t('inChannel')
		}),
		[t]
	);

	const handleSearchUserMentionFrom = useCallback(
		(search: string, callback: any) => {
			setActiveTrigger('>');
			setValueHighlight(search);
			const results = searchMentionsHashtag(search, userListData || []);
			callback(results.length > 0 ? results : userListData || []);
		},
		[userListData]
	);

	const handleSearchUserMentionMentions = useCallback(
		(search: string, callback: any) => {
			setActiveTrigger('~');
			setValueHighlight(search);
			const results = searchMentionsHashtag(search, userListData || []);
			callback(results.length > 0 ? results : userListData || []);
		},
		[userListData]
	);

	const handleSearchHasOptions = useCallback((search: string, callback: any) => {
		setActiveTrigger('&');
		setValueHighlight(search);
		const filtered = HAS_OPTIONS.filter((opt) => opt.display.toLowerCase().includes(search.toLowerCase()));
		callback(filtered.length > 0 ? filtered : HAS_OPTIONS);
	}, []);

	const handleSearchChannel = useCallback(
		(search: string, callback: any) => {
			setActiveTrigger('#');
			setValueHighlight(search);
			if (!search) {
				callback(channelOptions);
				return;
			}
			const filtered = channelOptions.filter((channel) => channel.display.toLowerCase().includes(search.toLowerCase()));
			callback(filtered.length > 0 ? filtered : channelOptions);
		},
		[channelOptions]
	);

	const renderSuggestionsContainer = useCallback(
		(children: any) => (
			<div
				className={`absolute left-0 top-10 pb-3 bg-theme-setting-primary ${valueInputSearch ? 'pt-0' : 'pt-3'} rounded  z-[9999] w-widthModalSearch min-h-heightModalSearch shadow`}
			>
				{valueInputSearch && (
					<div className="first:mt-0 mt-3 p-3 rounded-t border-b last:border-b-0 last:bottom-b-0">
						<div className="flex items-center justify-between">
							<div className="flex flex-row items-center flex-1 overflow-x-hidden">
								<h3 className="text-xs font-medium  uppercase mr-1 flex-shrink-0">{t('searchFor')}</h3>
								<p className="text-sm font-semibold w-full mr-[10px] whitespace-normal text-ellipsis overflow-x-hidden">
									{valueDisplay}
								</p>
							</div>
							<button className="px-1 h-5 w-10 text-xs  font-semibold rounded bg-borderDividerLight ">{t('enter')}</button>
						</div>
					</div>
				)}
				<SelectGroup groupName={triggerGroupNames[activeTrigger] || t('fromUser')}>{children}</SelectGroup>
			</div>
		),
		[valueInputSearch, valueDisplay, activeTrigger, triggerGroupNames, t]
	);

	return (
		<MentionsInput
			inputRef={searchRef as any}
			placeholder={t('searchPlaceholder')}
			value={valueInputSearch ?? ''}
			style={{
				...(appearanceTheme === 'light' ? lightMentionsInputStyle : darkMentionsInputStyle),
				suggestions: {
					...(appearanceTheme === 'light' ? lightMentionsInputStyle.suggestions : darkMentionsInputStyle.suggestions),
					width: '100%',
					left: '0px'
				}
			}}
			onChange={onChange}
			className="none-draggable-area w-full mr-[10px] bg-transparent text-theme-primary rounded-md focus-visible:!border-0 focus-visible:!outline-none focus-visible:[&>*]:!outline-none"
			allowSpaceInQuery={true}
			singleLine={true}
			onClick={onInputClick}
			onKeyDown={onKeyDown}
			customSuggestionsContainer={renderSuggestionsContainer as any}
		>
			{/* From user filter: > */}
			<Mention
				markup=">[__display__](__id__)"
				appendSpaceOnAdd={true}
				data={handleSearchUserMentionFrom}
				trigger=">"
				displayTransform={(id: string, display: string) => `from:${display}`}
				renderSuggestion={(suggestion: any, search: any, highlightedDisplay: any, index: any, focused: any) => (
					<SelectItemUser
						search={valueHighlight}
						isFocused={focused}
						title={t('prefixes.from')}
						content={t(suggestion.display) || suggestion.display}
						onClick={() => setIsShowSearchOptions('')}
					/>
				)}
				style={MentionsInputStyle}
			/>

			<Mention
				markup="~[__display__](__id__)"
				appendSpaceOnAdd={true}
				data={handleSearchUserMentionMentions}
				trigger="~"
				displayTransform={(id: string, display: string) => `mentions:${display}`}
				renderSuggestion={(suggestion: any, search: any, highlightedDisplay: any, index: any, focused: any) => (
					<SelectItemUser
						search={valueHighlight}
						isFocused={focused}
						title={t('prefixes.mentions')}
						content={t(suggestion.display) || suggestion.display}
						onClick={() => setIsShowSearchOptions('')}
					/>
				)}
				style={MentionsInputStyle}
			/>

			<Mention
				markup="&[__display__](__id__)"
				appendSpaceOnAdd={true}
				data={handleSearchHasOptions}
				trigger="&"
				displayTransform={(id: string, display: string) => `has:${display}`}
				renderSuggestion={(suggestion: any, search: any, highlightedDisplay: any, index: any, focused: any) => (
					<SelectItemUser
						search={search}
						isFocused={focused}
						title={t('prefixes.has')}
						content={t(`hasOptions.${suggestion.display}`) || suggestion.display}
						key={suggestion.id}
					/>
				)}
				style={MentionsInputStyle}
			/>

			{isClanMode && (
				<Mention
					markup="#[__display__](__id__)"
					appendSpaceOnAdd={true}
					data={handleSearchChannel}
					trigger="#"
					displayTransform={(id: string, display: string) => `in:${display}`}
					renderSuggestion={(suggestion: any, search: any, highlightedDisplay: any, index: any, focused: any) => (
						<SelectItemUser
							search={valueHighlight}
							isFocused={focused}
							title={t('prefixes.in')}
							content={t(suggestion.display) || suggestion.display}
							onClick={() => setIsShowSearchOptions('')}
						/>
					)}
					style={MentionsInputStyle}
				/>
			)}
		</MentionsInput>
	);
};

export default memo(SearchInput);
