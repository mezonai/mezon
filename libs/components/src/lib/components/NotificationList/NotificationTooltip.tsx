import { selectCurrentClanBadgeCount, selectCurrentClanId, topicsActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import Tooltip from 'rc-tooltip';
import { memo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RedDot } from '../ChannelTopbar';
import { NotificationTooltipContent } from './NotificationTooltipContent';

interface NotificationTooltipProps {
	isGridView?: boolean;
	isShowMember?: boolean;
}

export const NotificationTooltip = memo(({ isGridView, isShowMember }: NotificationTooltipProps) => {
	const dispatch = useAppDispatch();
	const currentClanId = useSelector(selectCurrentClanId);
	const badgeCount = useSelector(selectCurrentClanBadgeCount);
	const [visible, setVisible] = useState(false);

	const handleVisibleChange = (visible: boolean) => {
		setVisible(visible);
		if (visible) {
			dispatch(topicsActions.fetchTopics({ clanId: currentClanId as string }));
		}
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
			overlay={<NotificationTooltipContent onCloseTooltip={handleCloseTooltip} />}
			onVisibleChange={handleVisibleChange}
			visible={visible}
			overlayClassName="notification-tooltip"
			align={{
				offset: [0, 8]
			}}
		>
			<button
				title="Inbox"
				className={`focus-visible:outline-none relative ${visible ? 'text-theme-primary-active' : ''} ${
					(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
						? 'text-theme-primary text-theme-primary-hover'
						: 'text-theme-primary text-theme-primary-hover'
				}`}
				onContextMenu={(e) => e.preventDefault()}
				data-e2e={generateE2eId('chat.channel_message.header.button.inbox')}
			>
				<Icons.Inbox defaultSize="size-5" />
				{badgeCount > 0 && <RedDot />}
			</button>
		</Tooltip>
	);
});
