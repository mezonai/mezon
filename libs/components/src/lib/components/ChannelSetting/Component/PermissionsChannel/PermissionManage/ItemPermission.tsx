import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type ItemPermissionProps = {
	id: string;
	title?: string;
	/** Undefined while the entity's overrides are unknown: no option shows as chosen. */
	choice?: TypeChoose;
	canEdit: boolean;
	dimmed: boolean;
	onSelect: (id: string, option: number, active?: boolean) => void;
};

export enum TypeChoose {
	Remove = 2,
	Or = 0,
	Tick = 1
}

const BUTTON_CLASS = 'w-9 flex justify-center items-center border-theme-primary';

const ItemPermission = memo((props: ItemPermissionProps) => {
	const { id, title, choice, canEdit, dimmed, onSelect } = props;
	const { t } = useTranslation('channelSetting');
	const denyLabel = t('channelPermission.deny');
	const inheritLabel = t('channelPermission.inherit');
	const allowLabel = t('channelPermission.allow');
	const buttonClass = `${BUTTON_CLASS} ${canEdit ? 'cursor-pointer' : 'cursor-default'}`;

	const handleDeny = useCallback(() => {
		onSelect(id, TypeChoose.Remove, false);
	}, [id, onSelect]);

	const handleInherit = useCallback(() => {
		onSelect(id, TypeChoose.Or);
	}, [id, onSelect]);

	const handleAllow = useCallback(() => {
		onSelect(id, TypeChoose.Tick, true);
	}, [id, onSelect]);

	return (
		<div
			className="flex justify-between items-center gap-3 py-2 border-b-theme-primary"
			data-e2e={generateE2eId('clan_page.settings.role.override.item')}
		>
			<p className="font-semibold text-sm min-w-0">{title}</p>
			<div
				className={`h-8 shrink-0 flex rounded-md overflow-hidden border-theme-primary bg-theme-setting-primary ${dimmed ? 'opacity-50' : ''}`}
			>
				<button
					disabled={!canEdit}
					title={denyLabel}
					aria-label={denyLabel}
					className={`${buttonClass} ${choice === TypeChoose.Remove ? 'bg-colorDanger text-white' : ''}`}
					onClick={handleDeny}
					data-e2e={generateE2eId('clan_page.settings.role.override.item.button.remove')}
				>
					<Icons.Close className="size-4" />
				</button>
				<button
					disabled={!canEdit}
					title={inheritLabel}
					aria-label={inheritLabel}
					className={`${buttonClass} ${choice === TypeChoose.Or ? 'bg-item-theme' : ''}`}
					onClick={handleInherit}
				>
					<Icons.IconOr className="size-4" />
				</button>
				<button
					disabled={!canEdit}
					title={allowLabel}
					aria-label={allowLabel}
					className={`${buttonClass} ${choice === TypeChoose.Tick ? 'bg-colorSuccess text-white' : ''}`}
					onClick={handleAllow}
					data-e2e={generateE2eId('clan_page.settings.role.override.item.button.tick')}
				>
					<Icons.IconTick className="size-4" />
				</button>
			</div>
		</div>
	);
});

export default ItemPermission;
