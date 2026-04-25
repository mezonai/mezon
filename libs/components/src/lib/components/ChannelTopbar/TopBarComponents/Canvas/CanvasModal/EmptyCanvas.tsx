import { usePermissionChecker } from '@mezon/core';
import { selectCurrentChannelId } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { EOverriddenPermission, EPermission } from '@mezon/utils';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

type EmptyCanvasProps = {
	onClick: () => void;
};

const EmptyCanvas = ({ onClick }: EmptyCanvasProps) => {
	const { t } = useTranslation('channelTopbar');
	const currentChannelId = useSelector(selectCurrentChannelId);
	const [canManageThread] = usePermissionChecker([EOverriddenPermission.manageThread, EPermission.viewChannel], currentChannelId ?? '');
	const handleCreateCanvas = () => {
		onClick();
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] p-12">
			<div className="mx-auto mb-4 p-6 rounded-full flex items-center justify-center cursor-default" aria-hidden>
				<Icons.CanvasIcon
					defaultSize="!w-14 !h-14 shrink-0"
					className="[--canvas-fill-1:var(--bg-icon-theme)] [--canvas-fill-2:var(--bg-theme-secounnd)]"
					defaultFill1="var(--canvas-fill-1)"
					defaultFill2="var(--canvas-fill-2)"
				/>
			</div>
			<h2 className="text-2xl font-semibold mb-2">{t('canvas.emptyTitle')}</h2>
			<p className="text-base text-center">{t('canvas.emptyDescription')}</p>
			{canManageThread && (
				<button
					onClick={handleCreateCanvas}
					className="mt-6 py-3 px-2  font-medium text-sm rounded-lg focus:ring-transparent btn-primary btn-primary-hover"
				>
					{t('canvas.createCanvas')}
				</button>
			)}
		</div>
	);
};

export default EmptyCanvas;
