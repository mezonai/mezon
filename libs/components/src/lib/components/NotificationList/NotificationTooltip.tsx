import { selectBadgeClanById, selectCurrentClanId } from '@mezon/store';
import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RedDot } from '../ChannelTopbar';
import { NotificationTooltipContent } from './NotificationTooltipContent';

const SFU_HEADER_ICON_BUTTON_CLASS = '[--sfu-header-icon-fill:var(--mz-icon)] hover:[--sfu-header-icon-fill:var(--text-secondary)] transition-colors';

type NotificationTooltipProps = {
	useSfuHeaderIconFill?: boolean;
};

export const NotificationTooltip = memo(({ useSfuHeaderIconFill = false }: NotificationTooltipProps) => {
	const { t } = useTranslation('notifications');
	const currentClanId = useSelector(selectCurrentClanId);
	const badgeCount = useSelector((state) => selectBadgeClanById(state, currentClanId || ''));
	const [visible, setVisible] = useState(false);
	const [openCount, setOpenCount] = useState(0);

	const handleVisibleChange = (visible: boolean) => {
		if (visible) {
			setOpenCount((c) => c + 1);
		}
		setVisible(visible);
	};

	const handleCloseTooltip = () => {
		setVisible(false);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && visible) {
				setVisible(false);
			}
		};

		if (visible) {
			window.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [visible]);

	return (
		<Tooltip
			placement="bottomRight"
			trigger={['click']}
			overlay={<NotificationTooltipContent key={openCount} onCloseTooltip={handleCloseTooltip} />}
			onVisibleChange={handleVisibleChange}
			visible={visible}
			overlayClassName="notification-tooltip"
			align={{
				offset: [0, 8]
			}}
		>
			<button
				title={t('inbox')}
				className={`focus-visible:outline-none relative group ${
					useSfuHeaderIconFill
						? `${SFU_HEADER_ICON_BUTTON_CLASS} ${visible ? '[--sfu-header-icon-fill:var(--mz-icon-selected)]' : ''}`
						: `text-[var(--mz-icon)] hover:text-[var(--mz-icon-selected)] ${visible ? 'text-[var(--mz-icon-selected)]' : ''}`
				}`}
				onContextMenu={(e) => e.preventDefault()}
				data-e2e={generateE2eId('chat.channel_message.header.button.inbox')}
			>
				<MezonIcon icon={MzIcons20.mzInbox} className={useSfuHeaderIconFill ? 'text-[var(--sfu-header-icon-fill)]' : undefined} />
				{badgeCount > 0 && <RedDot />}
			</button>
		</Tooltip>
	);
});
