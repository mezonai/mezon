import { useAuth, usePermissionChecker } from '@mezon/core';
import type { EventManagementEntity } from '@mezon/store';
import { selectUserMaxPermissionLevel } from '@mezon/store';
import { EPermission } from '@mezon/utils';
import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { Coords } from '../../../ChannelLink';
import ItemPanel from '../../../PanelChannel/ItemPanel';

type PanelEventItemProps = {
	coords: Coords;
	event?: EventManagementEntity;
	onHandle: (e: unknown) => void;
	setOpenModalUpdateEvent?: () => void;
	onTrigerEventUpdateId?: () => void;
	setOpenModalDelEvent?: React.Dispatch<React.SetStateAction<boolean>>;
	onClose: () => void;
	handleCopyLink: () => void;
};

function PanelEventItem(props: PanelEventItemProps) {
	const { coords, event, onHandle, setOpenModalDelEvent, setOpenModalUpdateEvent, onClose, onTrigerEventUpdateId, handleCopyLink } = props;
	const { t } = useTranslation('eventCreator');
	const containerRef = useRef<HTMLDivElement | null>(null);
	const { userProfile } = useAuth();
	const [isClanOwner, hasClanPermission, hasAdminPermission] = usePermissionChecker([
		EPermission.clanOwner,
		EPermission.manageClan,
		EPermission.administrator
	]);
	const userMaxPermissionLevel = useSelector(selectUserMaxPermissionLevel);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (!containerRef.current) return;
			if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside, true);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside, true);
		};
	}, [onClose]);

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
			ref={containerRef}
			className="fixed bg-option-theme rounded-sm shadow z-10 w-[200px] py-[10px] px-[10px]"
			style={{
				left: coords.mouseX + 10,
				top: coords.distanceToBottom > 150 ? coords.mouseY : '',
				bottom: coords.distanceToBottom > 150 ? '' : '20px'
			}}
			onClick={onHandle}
		>
			{canModifyEvent && (
				<>
					<ItemPanel children={t('actions.editEvent')} onClick={handleUpdateEvent} />
					<ItemPanel children={t('actions.cancelEvent')} danger={true} onClick={handleDeleteEvent} />
				</>
			)}
			<ItemPanel children={t('actions.copyEventLink')} onClick={handleCopyLink} />
		</div>
	);
}

export default PanelEventItem;
