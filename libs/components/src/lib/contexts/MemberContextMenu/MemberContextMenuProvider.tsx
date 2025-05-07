import { selectTheme } from '@mezon/store';
import { CSSProperties, FC, createContext, useContext, useState } from 'react';
import { Menu, useContextMenu } from 'react-contexify';
import 'react-contexify/dist/ReactContexify.css';
import { useSelector } from 'react-redux';
import ModalRemoveMemberClan from '../../components/MemberProfile/ModalRemoveMemberClan';
import { MemberMenuItem } from './MemberMenuItem';
import {
	MEMBER_CONTEXT_MENU_ID,
	MemberContextMenuContextType,
	MemberContextMenuHandlers,
	MemberContextMenuOptions,
	MemberContextMenuProps
} from './types';
import { useModals } from './useModals';

const MemberContextMenuContext = createContext<MemberContextMenuContextType | undefined>(undefined);

// const isOwnerClanOrGroup =
// (dataMemberCreate?.createId || currentClan?.creator_id) &&
// (dataMemberCreate ? dataMemberCreate?.createId : currentClan?.creator_id) === user?.user?.id;

export const MemberContextMenuProvider: FC<MemberContextMenuProps> = ({ children }) => {
	const {
		currentUser,
		openModalRemoveMember,
		closeRemoveMemberModal,
		handleRemoveMember,
		openUserProfile,
		openProfileItem,
		openRemoveMemberModal
	} = useModals();

	const [currentHandlers, setCurrentHandlers] = useState<MemberContextMenuHandlers | null>(null);
	const [currentOptions, setCurrentOptions] = useState<MemberContextMenuOptions>({
		showRemoveOption: false,
		hideSpecificOptions: []
	});

	const { show } = useContextMenu({
		id: MEMBER_CONTEXT_MENU_ID
	});

	const showMenu = (event: React.MouseEvent) => {
		show({ event });
	};

	const shouldShow = (optionName: string) => !currentOptions.hideSpecificOptions?.includes(optionName);

	const contextValue: MemberContextMenuContextType = {
		setCurrentHandlers,
		setCurrentOptions,
		showMenu,
		openUserProfile,
		openRemoveMemberModal,
		openProfileItem
	};

	const appearanceTheme = useSelector(selectTheme);

	const isLightMode = appearanceTheme === 'light';

	const className: CSSProperties = {
		'--contexify-menu-bgColor': isLightMode ? '#FFFFFF' : '#111214',
		'--contexify-activeItem-bgColor': '#4B5CD6',
		'--contexify-rightSlot-color': '#6f6e77',
		'--contexify-activeRightSlot-color': '#fff',
		'--contexify-arrow-color': '#6f6e77',
		'--contexify-activeArrow-color': '#fff',
		'--contexify-itemContent-padding': '-3px',
		'--contexify-menu-radius': '2px',
		'--contexify-activeItem-radius': '2px',
		'--contexify-menu-minWidth': '188px',
		'--contexify-separator-color': '#ADB3B9'
	} as CSSProperties;

	return (
		<MemberContextMenuContext.Provider value={contextValue}>
			{children}

			<Menu id={MEMBER_CONTEXT_MENU_ID} style={className}>
				{currentHandlers && (
					<>
						{shouldShow('profile') && <MemberMenuItem label="Profile" onClick={currentHandlers.handleViewProfile} />}

						{shouldShow('message') && <MemberMenuItem label="Message" onClick={currentHandlers.handleMessage} />}
						{shouldShow('markAsRead') && <MemberMenuItem label="Mark as read" onClick={currentHandlers.handleMarkAsRead} />}

						{shouldShow('addFriend') && <MemberMenuItem label="Add Friend" onClick={currentHandlers.handleAddFriend} />}
						{shouldShow('removeFriend') && (
							<MemberMenuItem label="Remove Friend" onClick={currentHandlers.handleRemoveFriend} isWarning={true} />
						)}

						{shouldShow('kick') && <MemberMenuItem label="Kick" onClick={currentHandlers.handleKick} isWarning={true} />}
					</>
				)}
			</Menu>

			{openModalRemoveMember && currentUser && (
				<ModalRemoveMemberClan
					openModal={openModalRemoveMember}
					username={currentUser?.user?.username}
					onClose={closeRemoveMemberModal}
					onRemoveMember={handleRemoveMember}
				/>
			)}
		</MemberContextMenuContext.Provider>
	);
};

export const useMemberContextMenu = () => {
	const context = useContext(MemberContextMenuContext);
	if (!context) {
		throw new Error('useMemberContextMenu must be used within a MemberContextMenuProvider');
	}
	return context;
};
