import { useAuth, usePermissionChecker } from '@mezon/core';
import type { EventManagementEntity } from '@mezon/store';
import { selectUserMaxPermissionLevel } from '@mezon/store';
import { EPermission } from '@mezon/utils';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import ItemPanel from '../../../PanelChannel/ItemPanel';

type PanelEventItemProps = {
	event?: EventManagementEntity;
	onHandle?: (e: unknown) => void;
	setOpenModalUpdateEvent?: () => void;
	onTrigerEventUpdateId?: () => void;
	setOpenModalDelEvent?: React.Dispatch<React.SetStateAction<boolean>>;
	onClose: () => void;
	handleCopyLink: () => void;
};

function PanelEventItem(props: PanelEventItemProps) {
	const { event, onHandle, setOpenModalDelEvent, setOpenModalUpdateEvent, onClose, onTrigerEventUpdateId, handleCopyLink } = props;
	const { t } = useTranslation('eventCreator');
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

		return false;
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
		<div className="bg-option-theme rounded-md shadow-lg w-[200px] py-[10px] px-[10px]" onClick={onHandle}>
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
