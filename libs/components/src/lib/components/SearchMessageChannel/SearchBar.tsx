import { Icons } from '@mezon/ui';
import { memo } from 'react';
import SearchInput from './SearchInput';
import type { SearchBarProps } from './types';

const SearchBar = ({
	expanded,
	valueInputSearch,
	valueDisplay,
	channelId,
	mode,
	currentClanId,
	searchedRequest,
	appearanceTheme,
	lightMentionsInputStyle,
	darkMentionsInputStyle,
	searchRef,
	onInputClick,
	onKeyDown,
	onChange,
	onClose,
	setIsShowSearchOptions
}: SearchBarProps) => {
	return (
		<>
			<div
				className={`transition-all duration-300 ${
					expanded ? 'w-80' : 'w-40'
				} h-8 pl-2 pr-2 py-3 bg-theme-surface border-theme-primary text-theme-primary rounded-lg items-center inline-flex`}
			>
				<SearchInput
					channelId={channelId}
					mode={mode}
					currentClanId={currentClanId}
					valueInputSearch={valueInputSearch}
					valueDisplay={valueDisplay}
					searchedRequest={searchedRequest}
					appearanceTheme={appearanceTheme}
					lightMentionsInputStyle={lightMentionsInputStyle}
					darkMentionsInputStyle={darkMentionsInputStyle}
					searchRef={searchRef}
					onInputClick={onInputClick}
					onKeyDown={onKeyDown}
					onChange={onChange}
					setIsShowSearchOptions={setIsShowSearchOptions}
				/>
			</div>
			<div className="w-6 h-6 flex flex-row items-center pl-1 absolute right-1 bg-transparent top-1/2 transform -translate-y-1/2">
				<button
					onClick={onInputClick}
					className={`${valueInputSearch ? 'z-0 opacity-0 rotate-0' : 'z-10 opacity-100 rotate-90'} w-4 h-4 absolute transition-transform`}
				>
					<Icons.Search className="w-4 h-4 text-theme-primary" />
				</button>
				<button
					onClick={onClose}
					className={`${valueInputSearch ? 'z-10 opacity-100 rotate-90' : 'z-0 opacity-0 rotate-0'} w-4 h-4 absolute transition-transform`}
				>
					<Icons.Close className="w-4 h-4" />
				</button>
			</div>
		</>
	);
};

export default memo(SearchBar);
