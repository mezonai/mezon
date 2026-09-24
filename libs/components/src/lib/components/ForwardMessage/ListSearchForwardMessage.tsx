import { selectClanById } from '@mezon/store';
import { Checkbox } from '@mezon/ui';
import { filterListByName, sortFilteredList, TypeSearch } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { memo, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import SuggestItem from '../MessageBox/ReactionMentionInput/SuggestItem';

type ListSearchForwardMessageProps = {
	listSearch: any[];
	searchText: string;
	selectedObjectIdSends: any[];
	handleToggle: (id: string, type: number, isPublic: boolean, clanId?: string, channelLabel?: string, isFriend?: boolean) => void;
};

const ListSearchForwardMessage = (props: ListSearchForwardMessageProps) => {
	const { listSearch, searchText, selectedObjectIdSends, handleToggle } = props;

	const filteredList = useMemo(() => filterListByName(listSearch, searchText, false), [listSearch, searchText]);
	const sortedList = useMemo(() => sortFilteredList(filteredList, searchText, false), [filteredList, searchText]);

	const onToggleChannel = useCallback(
		(id: string, type: number, isPublic: boolean, clanId: string, channelLabel: string) => {
			handleToggle(id, type, isPublic, clanId, channelLabel, false);
		},
		[handleToggle]
	);

	const onToggleDm = useCallback(
		(id: string, type: number, isFriend: boolean) => {
			handleToggle(id, type, false, '', '', isFriend);
		},
		[handleToggle]
	);

	if (sortedList.length === 0) {
		return null;
	}
	return (
		sortedList.length &&
		sortedList.slice(0, 15).map((item: any) => {
			const isTypeDm = item.typeSearch === TypeSearch.Dm_Type;
			return (
				<div key={item.id} className="flex items-center px-4 py-1 rounded bg-item-hover">
					{isTypeDm ? (
						<ItemDm
							id={item.idDM || item.id}
							avatar={item.avatarUser}
							name={item.prioritizeName}
							searchText={searchText}
							checked={selectedObjectIdSends.some((selectedItem) => selectedItem.id === (item.idDM || item.id))}
							username={item.name}
							hiddenSubText={item.typeChat === ChannelType.CHANNEL_TYPE_GROUP}
							onToggle={onToggleDm}
							typeChat={item.typeChat}
							isFriend={item.isFriend}
						/>
					) : (
						<ItemChannel
							id={item.id}
							name={item.prioritizeName}
							subText={item.subText}
							searchText={searchText}
							checked={selectedObjectIdSends.some((selectedItem) => selectedItem.id === item.id)}
							clanId={item.clanId}
							channelType={item.type}
							channelPrivate={item.channel_private}
							isAgeRestricted={Boolean(item.age_restricted)}
							onToggle={onToggleChannel}
							isPublic={item.isPublic}
							channelLabel={item.channelLabel}
						/>
					)}
				</div>
			);
		})
	);
};

export default ListSearchForwardMessage;

type ItemDmProps = {
	id: string;
	name: string;
	avatar: string;
	searchText: string;
	checked: boolean;
	username?: string;
	hiddenSubText: boolean;
	onToggle: (id: string, type: number, isFriend: boolean) => void;
	typeChat?: number;
	isFriend?: boolean;
};

const ItemDm = memo((props: ItemDmProps) => {
	const { id, name, avatar, searchText, checked, username, hiddenSubText, onToggle, typeChat, isFriend } = props;

	const handleToggle = useCallback(() => {
		onToggle(id, typeChat || 0, Boolean(isFriend));
	}, [onToggle, id, typeChat, isFriend]);

	return (
		<>
			<div className="flex-1 mr-1" onClick={handleToggle}>
				<SuggestItem
					display={name}
					avatarUrl={avatar}
					showAvatar
					valueHightLight={searchText}
					subText={hiddenSubText ? '' : username}
					wrapSuggestItemStyle="gap-x-1"
					subTextStyle="text-[13px]"
					emojiId=""
				/>
			</div>
			<Checkbox className="w-4 h-4 focus:ring-transparent" id={`checkbox-item-${id}`} checked={checked} onChange={handleToggle} />
		</>
	);
});

type ItemChannelProps = {
	id: string;
	name: string;
	subText: string;
	searchText: string;
	checked: boolean;
	clanId: string;
	channelType?: number;
	channelPrivate?: number;
	isAgeRestricted?: boolean;
	onToggle: (id: string, type: number, isPublic: boolean, clanId: string, channelLabel: string) => void;
	isPublic?: boolean;
	channelLabel?: string;
};

const ItemChannel = memo((props: ItemChannelProps) => {
	const { id, name, searchText, checked, clanId, channelType, channelPrivate, isAgeRestricted, onToggle, isPublic, channelLabel } = props;
	const clanByClanId = useSelector(selectClanById(clanId));

	const handleToggle = useCallback(() => {
		onToggle(id, channelType || 0, Boolean(isPublic), clanId, channelLabel || '');
	}, [onToggle, id, channelType, isPublic, clanId, channelLabel]);

	return (
		<>
			<div className="flex-1 mr-1" onClick={handleToggle}>
				<SuggestItem
					display={name}
					subText={clanByClanId?.clan_name || ''}
					channelId={id}
					valueHightLight={searchText}
					subTextStyle="uppercase"
					isOpenSearchModal
					emojiId=""
					channelType={channelType}
					channelPrivate={channelPrivate}
					isAgeRestricted={isAgeRestricted}
					alwaysShowSubText
				/>
			</div>
			<Checkbox className="w-4 h-4 focus:ring-transparent" id={`checkbox-item-${id}`} checked={checked} onChange={handleToggle} />
		</>
	);
});
