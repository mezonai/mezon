import type { IChannel } from '@mezon/utils';
import type { RefObject } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { Coords } from '../ChannelLink';
import ContextMenuPanel from './ContextMenuPanel';
import GroupPanels from './GroupPanels';
import ItemPanel from './ItemPanel';
import { useChannelPanelModals } from './useChannelPanelModals';
import { useChannelPermissions } from './useChannelPermissions';
import { usePanelPosition } from './usePanelPosition';

type PanelChannelTableProps = {
	coords: Coords;
	channel: IChannel;
	setIsShowPanelChannel: React.Dispatch<React.SetStateAction<boolean>>;
	rootRef?: RefObject<HTMLElement>;
};

const PanelChannelTable = ({ coords, channel, setIsShowPanelChannel, rootRef }: PanelChannelTableProps) => {
	const { t } = useTranslation('channelMenu');

	const { isThread, isWelcomeChannel, canEditAndDelete, shouldShowArchive } = useChannelPermissions(channel);

	const handleClosePanel = useCallback(() => {
		setIsShowPanelChannel(false);
	}, [setIsShowPanelChannel]);

	const { panelRef, positionTop } = usePanelPosition(coords, handleClosePanel, rootRef);
	const { openArchiveConfirm, openDeleteModal, openSettingModal } = useChannelPanelModals(channel, handleClosePanel);

	const archiveLabel = isThread ? t('menu.notification.archiveThread') : t('menu.notification.archiveChannel');

	return (
		<ContextMenuPanel panelRef={panelRef} coords={coords} positionTop={positionTop}>
			<GroupPanels>
				{shouldShowArchive && <ItemPanel onClick={openArchiveConfirm} children={archiveLabel} />}

				{canEditAndDelete && (
					<>
						<ItemPanel
							onClick={openSettingModal}
							children={isThread ? t('menu.manageThreadMenu.editThread') : t('menu.organizationMenu.edit')}
						/>

						{(isThread || !isWelcomeChannel) && (
							<ItemPanel
								onClick={openDeleteModal}
								children={isThread ? t('menu.manageThreadMenu.deleteThread') : t('menu.organizationMenu.deleteChannel')}
								danger
							/>
						)}
					</>
				)}
			</GroupPanels>
		</ContextMenuPanel>
	);
};

export default PanelChannelTable;
