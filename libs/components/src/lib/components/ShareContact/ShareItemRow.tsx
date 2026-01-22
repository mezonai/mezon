import { Checkbox, Icons } from '@mezon/ui';
import { SuggestItem } from '../../components';

type ShareItemType = 'friend' | 'dm' | 'group' | 'channel' | 'thread';

type ShareItem = {
	id: string;
	name: string;
	avatarUser: string;
	displayName: string;
	type: ShareItemType;
	channelId?: string;
	clanId?: string;
	isPublic?: boolean;
};

type ShareItemRowProps = {
	item: ShareItem;
	isSelected: boolean;
	onToggle: (itemId: string) => void;
	searchText: string;
	t: (key: string) => string;
};

export const ShareItemRow = ({ item, isSelected, onToggle, searchText, t }: ShareItemRowProps) => {
	const isChannelOrThread = item.type === 'channel' || item.type === 'thread';

	return (
		<div key={item.id} className="flex items-center px-4 py-1 rounded bg-item-hover cursor-pointer" onClick={() => onToggle(item.id)}>
			{isChannelOrThread ? (
				<div className="flex items-center flex-1 mr-1 gap-2">
					{item.type === 'channel' ? (
						item.isPublic ? (
							<Icons.Hashtag defaultSize="w-5 h-5 text-theme-secondary" />
						) : (
							<Icons.HashtagLocked defaultSize="w-5 h-5 text-theme-secondary" />
						)
					) : item.isPublic ? (
						<Icons.ThreadIcon defaultSize="w-5 h-5 text-theme-secondary" />
					) : (
						<Icons.ThreadIconLocker className="w-5 h-5 text-theme-secondary" />
					)}
					<span className="text-theme-primary text-sm">{item.displayName}</span>
				</div>
			) : (
				<div className="flex-1 mr-1">
					<SuggestItem
						display={item.displayName}
						avatarUrl={item.avatarUser}
						showAvatar
						valueHightLight={searchText}
						subText={item.type === 'group' ? t('modal.group') : item.name}
						wrapSuggestItemStyle="gap-x-1"
						subTextStyle="text-[13px]"
						emojiId=""
					/>
				</div>
			)}
			<Checkbox
				className="w-4 h-4 focus:ring-transparent"
				id={`checkbox-item-${item.id}`}
				checked={isSelected}
				onChange={() => onToggle(item.id)}
			/>
		</div>
	);
};
