import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { useTranslation } from 'react-i18next';

const SearchFile = ({ setKeywordSearch }: { setKeywordSearch: React.Dispatch<React.SetStateAction<string>> }) => {
	const { t } = useTranslation('channelTopbar');

	const hanldeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setKeywordSearch(event.target.value);
	};

	return (
		<div className="relative">
			<div className={`transition-all duration-300 w-56 h-6 pl-4 pr-2 py-3 bg-theme-input rounded items-center inline-flex`}>
				<input
					type="text"
					placeholder={t('files.searchPlaceholder')}
					className="text-sm placeholder:text-sm outline-none bg-transparent w-full"
					onChange={(event) => hanldeChange(event)}
				/>
			</div>
			<div className="w-5 h-6 flex flex-row items-center pl-1 absolute right-1 bg-transparent top-1/2 transform -translate-y-1/2">
				<MezonIcon icon={MzIcons20.mzSearch} className="text-[var(--mz-icon)]" />
			</div>
		</div>
	);
};

export default SearchFile;
