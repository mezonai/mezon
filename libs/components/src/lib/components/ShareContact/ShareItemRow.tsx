import { Checkbox, MezonIcon, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
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
	clanName?: string;
	isPublic?: boolean;
	isAgeRestricted?: boolean;
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
		<div
			key={item.id}
			className="flex items-center px-4 py-1 rounded bg-item-hover cursor-pointer"
			onClick={() => onToggle(item.id)}
			data-e2e={generateE2eId('suggest_item')}
		>
			{isChannelOrThread ? (
				<div className="flex items-center flex-1 min-w-0 mr-1 gap-2 overflow-hidden">
					{item.type === 'channel' ? (
						item.isAgeRestricted ? (
							<MezonIcon icon={MzIcons20.mzChannelWarning} className="shrink-0 text-[var(--mz-icon)]" />
						) : item.isPublic ? (
							<MezonIcon icon={MzIcons20.mzChannel} className="shrink-0 text-[var(--mz-icon)]" />
						) : (
							<MezonIcon icon={MzIcons20.mzChannelPrivate} className="shrink-0 text-[var(--mz-icon)]" />
						)
					) : item.isPublic ? (
						<MezonIcon icon={MzIcons20.mzThread} className="shrink-0 text-[var(--mz-icon)]" />
					) : (
						<MezonIcon icon={MzIcons20.mzThreadPrivate} className="shrink-0 text-[var(--mz-icon)]" />
					)}
					<span className="text-theme-primary text-sm flex-1 min-w-0 truncate" title={item.displayName}>
						{item.displayName}
					</span>
					{item.clanName && (
						<span
							className="text-theme-primary text-xs uppercase ml-2 shrink-0 truncate max-w-[140px]"
							title={item.clanName}
							data-e2e={generateE2eId('suggest_item.clan_name')}
						>
							{item.clanName}
						</span>
					)}
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
			<div
				className="flex items-center"
				onClick={(e) => {
					e.stopPropagation();
					onToggle(item.id);
				}}
			>
				<Checkbox
					className="w-4 h-4 focus:ring-transparent pointer-events-none cursor-pointer"
					id={`checkbox-item-${item.id}`}
					checked={isSelected}
					readOnly
				/>
			</div>
		</div>
	);
};
