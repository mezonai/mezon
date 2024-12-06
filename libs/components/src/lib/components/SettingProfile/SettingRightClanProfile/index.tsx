import { selectAllClans } from '@mezon/store';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import SettingUserClanProfileEdit from './SettingUserClanProfileEdit';

interface SettingUserClanProfileEditProps {
	clanId: string;
}

const SettingRightClan: React.FC<SettingUserClanProfileEditProps> = ({ clanId }) => {
	const clans = useSelector(selectAllClans);
	const [flagOption, setFlagOption] = useState<boolean>(false);
	const [selectedClanId, setSelectedClanId] = useState<string | undefined>(clanId as string);

	const handleClanChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedClanId(event.target.value);
	};

	return (
		<div className="flex flex-col">
			<div className="flex flex-col xl:flex-row gap-x-1 text-sm font-normal">
				<p className="dark:text-bgLightPrimary text-bgPrimary">Show who you are with different profiles for each of your clans</p>
				<a href=" " className="text-[#155EEF] text-sm font-normal">
					Learn more about Clan Profiles
				</a>
			</div>
			<p className="mt-[20px] font-bold text-sm dark:text-[#CCCCCC] text-black tracking-wide">CHOOSE A CLAN</p>
			<select
				name="clan"
				className="block w-full mt-1 dark:bg-bgTertiary bg-[#f0f0f0] dark:text-white text-black rounded px-4 py-3 font-normal text-sm tracking-wide outline-none"
				disabled={flagOption}
				value={selectedClanId}
				onChange={handleClanChange}
			>
				{clans.map((clan) => (
					<option key={clan.id} value={clan.id} style={{ width: '200px' }} className="">
						{clan.clan_name}
					</option>
				))}
			</select>
			<SettingUserClanProfileEdit flagOption={flagOption} setFlagOption={setFlagOption} clanId={selectedClanId ?? ''} />
		</div>
	);
};
export default SettingRightClan;
