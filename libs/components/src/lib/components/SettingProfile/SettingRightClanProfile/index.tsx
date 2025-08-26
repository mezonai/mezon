import { selectAllClans } from '@mezon/store';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import SettingUserClanProfileEdit from './SettingUserClanProfileEdit';

interface SettingUserClanProfileEditProps {
	clanId: string;
}

const SettingRightClan: React.FC<SettingUserClanProfileEditProps> = ({ clanId }) => {
	const clans = useSelector(selectAllClans);
	const [flagOption, setFlagOption] = useState<boolean>(false);
	const [selectedClanId, setSelectedClanId] = useState<string | undefined>(clanId as string);

	return (
		<div className="flex flex-col">
			<div className="flex flex-col xl:flex-row gap-x-1 text-sm font-normal">
				<p className="">Show who you are with different profiles for each of your clans</p>
			</div>
			<p className="mt-[20px] font-bold text-sm  tracking-wide">CHOOSE A CLAN</p>

			<Select
				classNames={{
					menuList: () => 'thread-scroll'
				}}
				className=" mt-1 text-theme-primary-active bg-input-secondary rounded-lg	"
				classNamePrefix="select"
				value={
					clans.find((clan) => clan.id === selectedClanId)
						? { value: selectedClanId, label: clans.find((clan) => clan.id === selectedClanId)?.clan_name }
						: null
				}
				isDisabled={flagOption}
				isLoading={false}
				isClearable={false}
				isRtl={false}
				isSearchable={true}
				name="clan"
				options={clans.map((clan) => ({ value: clan.id, label: clan.clan_name }))}
				onChange={(option: any) => setSelectedClanId(option.value)}
				styles={{
					control: (provided: any) => ({
						...provided,
						backgroundColor: 'var(--bg-input-secondary)',
						borderRadius: '8px',
						color: 'red'
					}),
					menu: (provided: any) => ({
						...provided,
						backgroundColor: 'var(--bg-option-theme)'
					}),
					option: (provided: any, state: any) => ({
						...provided,
						backgroundColor: state.isFocused ? 'var(--bg-option-active)' : '',
						color: 'var(--text-secondary)'
					}),
					multiValue: (provided: any) => ({
						...provided,
						backgroundColor: 'var(--bg-tertiary)'
					}),
					multiValueLabel: (provided: any) => ({
						...provided,
						color: 'var(--text-secondary)'
					}),
					multiValueRemove: (provided: any) => ({
						...provided,
						color: 'red',
						':hover': {
							backgroundColor: 'var(--bg-tertiary)',
							color: 'var(--text-secondary)'
						}
					}),
					input: (provided: any) => ({
						...provided,
						color: 'var(--text-secondary)'
					}),
					singleValue: (provided: any) => ({
						...provided,
						color: 'var(--text-secondary)'
					})
				}}
			/>

			<SettingUserClanProfileEdit flagOption={flagOption} setFlagOption={setFlagOption} clanId={selectedClanId ?? ''} />
		</div>
	);
};
export default SettingRightClan;
