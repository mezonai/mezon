import { useAppNavigation, useAuth, useDirect, useEscapeKeyClose, useOnClickOutside } from '@mezon/core';
import { selectCurrentClan } from '@mezon/store';
import { ChannelMembersEntity } from '@mezon/utils';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Coords } from '../ChannelLink';
import GroupPanelMember from './GroupPanelMember';
import ItemPanelMember from './ItemPanelMember';

type PanelMemberProps = {
	coords: Coords;
	member?: ChannelMembersEntity;
	onClose: () => void;
	onRemoveMember?: () => void;
	onOpenProfile?: () => void;
	kichMember?: boolean;
	handleRemoveMember?: () => void;
	handleTransferOwner?: () => void;
};

const PanelMemberTable = ({ coords, member, onClose, onOpenProfile, kichMember, handleRemoveMember, handleTransferOwner }: PanelMemberProps) => {
	const { userProfile } = useAuth();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [positionTop, setPositionTop] = useState<boolean>(false);
	const currentClan = useSelector(selectCurrentClan);
	const isClanOwner = useMemo(() => {
		return currentClan?.creator_id === userProfile?.user?.id;
	}, [currentClan?.creator_id, userProfile?.user?.id]);
	useEffect(() => {
		const heightPanel = panelRef.current?.clientHeight;
		if (heightPanel && heightPanel > coords.distanceToBottom) {
			setPositionTop(true);
		}
	}, [coords.distanceToBottom]);
	const isSelf = useMemo(() => userProfile?.user?.id === member?.user?.id, [member?.user?.id, userProfile?.user?.id]);

	const { toDmGroupPageFromMainApp } = useAppNavigation();
	const navigate = useNavigate();
	const { createDirectMessageWithUser } = useDirect();
	const handleOpenProfile = () => {
		if (onOpenProfile) {
			onOpenProfile();
		}
		onClose();
	};

	const handleDirectMessageWithUser = async () => {
		const response = await createDirectMessageWithUser(
			member?.user?.id || '',
			member?.user?.display_name,
			member?.user?.username,
			member?.user?.avatar_url
		);
		if (response?.channel_id) {
			const directDM = toDmGroupPageFromMainApp(response.channel_id, Number(response.type));
			navigate(directDM);
		}
	};

	useEscapeKeyClose(panelRef, onClose);
	useOnClickOutside(panelRef, onClose);

	return (
		<div
			ref={panelRef}
			tabIndex={-1}
			onMouseDown={(e) => e.stopPropagation()}
			style={{
				left: coords.mouseX,
				bottom: positionTop ? '12px' : 'auto',
				top: positionTop ? 'auto' : coords.mouseY,
				boxShadow: 'rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px'
			}}
			className="outline-none fixed top-full  z-20 w-[200px] py-[10px] px-[10px] border-theme-primary bg-theme-contexify rounded-md"
			onClick={(e) => {
				e.stopPropagation();
				onClose();
			}}
		>
			<GroupPanelMember>
				<ItemPanelMember children="Profile" onClick={handleOpenProfile} />

				{!isSelf && <ItemPanelMember children="Message" onClick={handleDirectMessageWithUser} />}
				{isClanOwner && !isSelf && <ItemPanelMember danger children="Transfer Owner" onClick={handleTransferOwner} />}
				{kichMember && !isSelf && !isClanOwner && <ItemPanelMember danger children="Remove Member" onClick={handleRemoveMember} />}
			</GroupPanelMember>
		</div>
	);
};

export default PanelMemberTable;
