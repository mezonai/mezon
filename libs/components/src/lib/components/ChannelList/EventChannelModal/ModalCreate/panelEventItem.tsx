import { useAuth, usePermissionChecker } from '@mezon/core';
import { EventManagementEntity, selectUserMaxPermissionLevel } from '@mezon/store';
import { EPermission } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Coords } from '../../../ChannelLink';
import ItemPanel from '../../../PanelChannel/ItemPanel';

type PanelEventItemProps = {
	coords: Coords;
	event?: EventManagementEntity;
	onHandle: (e: unknown) => void;
	setOpenModalUpdateEvent?: () => void;
	onTrigerEventUpdateId?: () => void;
	setOpenModalDelEvent?: React.Dispatch<React.SetStateAction<boolean>>;
	onClose: () => void;
};

function PanelEventItem(props: PanelEventItemProps) {
	const { coords, event, onHandle, setOpenModalDelEvent, setOpenModalUpdateEvent, onClose, onTrigerEventUpdateId } = props;
	const { userProfile } = useAuth();
	const [isClanOwner, hasClanPermission, hasAdminPermission] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.manageClan,
		EPermission.administrator
	]);
	const userMaxPermissionLevel = useSelector(selectUserMaxPermissionLevel);

	const canModifyEvent = useMemo(() => {
		if (isClanOwner || hasClanPermission || hasAdminPermission) {
			return true;
		}
		const isEventICreated = event?.creator_id === userProfile?.user?.id;
		if (isEventICreated) {
			return true;
		}

		return Number(userMaxPermissionLevel) > Number(event?.max_permission);
	}, [event?.creator_id, event?.max_permission, hasAdminPermission, hasClanPermission, isClanOwner, userMaxPermissionLevel, userProfile?.user?.id]);

	const handleDeleteEvent = async () => {
		if (setOpenModalDelEvent) {
			setOpenModalDelEvent(true);
			onClose();
		}
	};

	const handleUpdateEvent = async () => {
		if (setOpenModalUpdateEvent && onTrigerEventUpdateId) {
			setOpenModalUpdateEvent();
			onTrigerEventUpdateId();
			onClose();
		}
	};
	return (
		<div
			className="fixed dark:bg-bgProfileBody bg-gray-100 rounded-sm shadow z-10 w-[200px] py-[10px] px-[10px]"
			style={{
				left: coords.mouseX + 10,
				top: coords.distanceToBottom > 150 ? coords.mouseY : '',
				bottom: coords.distanceToBottom > 150 ? '' : '20px'
			}}
			onClick={onHandle}
		>
			{canModifyEvent && (
				<>
					<ItemPanel children="Start Event" />
					<ItemPanel children="Edit Event" onClick={handleUpdateEvent} />
					<ItemPanel children="Cancel Event" danger={true} onClick={handleDeleteEvent} />
				</>
			)}
			<ItemPanel children="Copy Event Link" />
		</div>
	);
}

export default PanelEventItem;
