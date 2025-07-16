import { selectCurrentClan, topicsActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
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
	const currentClan = useSelector(selectCurrentClan);
	const [visible, setVisible] = useState(false);

	const handleVisibleChange = (visible: boolean) => {
		setVisible(visible);
		if (visible) {
			dispatch(topicsActions.fetchTopics({ clanId: currentClan?.clan_id as string }));
		}
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
			overlay={<NotificationTooltipContent />}
			onVisibleChange={handleVisibleChange}
			visible={visible}
			overlayClassName="notification-tooltip"
			align={{
				offset: [0, 8]
			}}
		>
			<button
				title="Inbox"
				className={`focus-visible:outline-none ${
					(isGridView && !isShowMember) || (isGridView && isShowMember) || (isShowMember && !isGridView)
						? 'text-theme-primary-active text-theme-primary-hover'
						: 'text-theme-primary text-theme-primary-hover'
				}`}
				onContextMenu={(e) => e.preventDefault()}
			>
				<Icons.Inbox defaultSize="size-5" />
				{(currentClan?.badge_count ?? 0) > 0 && <RedDot />}
			</button>
		</Tooltip>
	);
});
