import { ClanEmoji } from 'mezon-js';
import SettingEmojiItem from '../SettingEmojiItem';

type SettingEmojiListProps = {
	title: string;
	emojiList: ClanEmoji[];
	onUpdateEmoji: (emoji: ClanEmoji) => void;
};

const SettingEmojiList = ({ title, emojiList, onUpdateEmoji }: SettingEmojiListProps) => {
	return (
		<div className={'flex flex-col gap-3 dark:text-textDarkTheme text-textLightTheme pb-[60px]'}>
			<div className={'flex items-center flex-row w-full dark:text-textSecondary text-textSecondary800'}>
				<p className={'w-14 text-xs font-bold '}>IMAGE</p>
				<p className={'flex-1 text-xs font-bold'}>NAME</p>
				<p className={'flex-1 flex text-xs font-bold'}>UPLOADED BY</p>
			</div>
			<div className={'flex flex-col w-full'}>
				{emojiList.map((emoji) => (
					<SettingEmojiItem emoji={emoji} key={emoji.id} onUpdateEmoji={onUpdateEmoji} />
				))}
			</div>
		</div>
	);
};

export default SettingEmojiList;
