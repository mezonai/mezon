import { SearchItemProps, TypeSearch } from '@mezon/utils';
import { ChannelType } from 'mezon-js';
import { useContext, useMemo } from 'react';
import { SuggestItem } from '../../components';
import { ListGroupSearchModalContext } from './ListGroupSearchModalContext';

type ListSearchModalProps = {
	listSearch: SearchItemProps[];
	searchText: string;
	focusItemId: string;
	onMouseEnter: (item: SearchItemProps) => void;
	onItemClick: (item: SearchItemProps) => void;
};

const ListSearchModal = (props: ListSearchModalProps) => {
	const { listSearch, searchText, focusItemId, onItemClick, onMouseEnter } = props;
	const { itemRefs } = useContext(ListGroupSearchModalContext) ?? {};

	const searchingUser = useMemo(() => {
		return searchText.startsWith('@');
	}, [searchText]);

	return (
		listSearch.length > 0 &&
		listSearch.map((item: SearchItemProps) => {
			const isChannel = item.typeChat === TypeSearch.Channel_Type;
			return (
				<div
					key={item.id}
					ref={(element) => item?.id && itemRefs && (itemRefs[item.id] = element)}
					onClick={() => onItemClick(item)}
					onMouseEnter={() => onMouseEnter(item)}
					className={`${focusItemId === item.id ? 'dark:bg-bgModifierHover bg-bgLightModeThird' : ''}  w-full px-[10px] py-[4px] rounded-[6px] cursor-pointer`}
				>
					{isChannel ? (
						<SuggestItem
							display={item?.prioritizeName}
							symbol={item.icon}
							subText={item.subText}
							channelId={item.channelId}
							valueHightLight={searchText}
							subTextStyle="uppercase"
							isOpenSearchModal
							emojiId=""
							channel={item}
							count={item.count_mess_unread}
						/>
					) : (
						<SuggestItem
							display={item?.prioritizeName}
							avatarUrl={item?.avatarUser}
							showAvatar
							valueHightLight={searchingUser ? searchText.slice(1) : searchText}
							subText={item.type === ChannelType.CHANNEL_TYPE_DM ? item?.name : ''}
							wrapSuggestItemStyle="gap-x-1"
							subTextStyle="text-[13px]"
							isHightLight={!searchingUser}
							emojiId=""
							count={item.count_mess_unread}
						/>
					)}
				</div>
			);
		})
	);
};

export default ListSearchModal;
