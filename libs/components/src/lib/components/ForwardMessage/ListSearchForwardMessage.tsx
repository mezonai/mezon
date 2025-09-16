import { selectClanById } from '@mezon/store';
import { Checkbox } from '@mezon/ui';
import { filterListByName, sortFilteredList, TypeSearch } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import SuggestItem from '../MessageBox/ReactionMentionInput/SuggestItem';

type ListSearchForwardMessageProps = {
	listSearch: any[];
	searchText: string;
	selectedObjectIdSends: any[];
	handleToggle: (id: string, type: number, isPublic: boolean, clanId?: string, channelLabel?: string) => void;
};

const ListSearchForwardMessage = (props: ListSearchForwardMessageProps) => {
	const { listSearch, searchText, selectedObjectIdSends, handleToggle } = props;

	const filteredList = useMemo(() => filterListByName(listSearch, searchText, false), [listSearch, searchText]);
	const sortedList = useMemo(() => sortFilteredList(filteredList, searchText, false), [filteredList, searchText]);
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
							id={item.idDM}
							avatar={item.avatarUser}
							name={item.prioritizeName}
							searchText={searchText}
							checked={selectedObjectIdSends.some((selectedItem: any) => selectedItem.id === item.idDM)}
							handleToggle={() => handleToggle(item.idDM, item.typeChat || 0, false)}
							username={item.name}
							hiddenSubText={item.typeChat === ChannelType.CHANNEL_TYPE_GROUP}
						/>
					) : (
						<ItemChannel
							id={item.id}
							name={item.prioritizeName}
							subText={item.subText}
							searchText={searchText}
							checked={selectedObjectIdSends.some((selectedItem: any) => selectedItem.id === item.id)}
							handleToggle={() => handleToggle(item.id, item.type || 0, item.isPublic, item.clanId, item.channelLabel || '')}
							clanId={item.clanId}
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
	handleToggle: () => void;
	username?: string;
	hiddenSubText: boolean;
};

const ItemDm = (props: ItemDmProps) => {
	const { id, name, avatar, searchText, checked, handleToggle, username, hiddenSubText } = props;

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
};

type ItemChannelProps = {
	id: string;
	name: string;
	subText: string;
	searchText: string;
	checked: boolean;
	handleToggle: () => void;
	clanId: string;
};

const ItemChannel = (props: ItemChannelProps) => {
	const { id, name, subText, searchText, checked, handleToggle, clanId } = props;
	const clanByClanId = useSelector(selectClanById(clanId));

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
				/>
			</div>
			<Checkbox className="w-4 h-4 focus:ring-transparent" id={`checkbox-item-${id}`} checked={checked} onChange={handleToggle} />
		</>
	);
};
