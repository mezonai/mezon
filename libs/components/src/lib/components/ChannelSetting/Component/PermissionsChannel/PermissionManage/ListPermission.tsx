import type { PermissionUserEntity } from '@mezon/store';
import type { ApiPermissionRoleChannelListEventResponse } from 'mezon-js';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import ItemPermission, { TypeChoose } from './ItemPermission';

type ListPermissionProps = {
	listPermission: PermissionUserEntity[];
	/** The selected entity's saved overrides; null until they have loaded. */
	persisted: ApiPermissionRoleChannelListEventResponse | null;
	/** Choices not saved yet. A realtime update to `persisted` leaves them alone. */
	pending: Record<string, number>;
	selectedTitle?: string;
	isLoaded: boolean;
	isLoading: boolean;
	/** The load has outlasted the grace period and may now say so. */
	loadingRevealed: boolean;
	canEdit: boolean;
	hasPendingChanges: boolean;
	onSelect: (id: string, option: number, active?: boolean) => void;
	onRetry: () => void;
};

const savedChoice = (active?: boolean) => {
	if (active === true) {
		return TypeChoose.Tick;
	}
	if (active === false) {
		return TypeChoose.Remove;
	}
	return TypeChoose.Or;
};

const ListPermission = memo((props: ListPermissionProps) => {
	const { listPermission, persisted, pending, selectedTitle, isLoaded, isLoading, loadingRevealed, canEdit, hasPendingChanges, onSelect, onRetry } =
		props;
	const { t } = useTranslation('channelSetting');
	const { t: tClanRoles } = useTranslation('clanRoles');

	const hasSelection = selectedTitle !== undefined;
	const showLoading = isLoading && loadingRevealed;
	// The first moments of a load keep the table's resting look instead of blanking and
	// dimming for a few frames; most entities carry no override, so that is what a fast load
	// lands on anyway. Editing stays off until the real answer is in.
	const inGrace = isLoading && !loadingRevealed;
	const loadFailed = hasSelection && !isLoaded && !isLoading;
	const dimmed = !canEdit && !inGrace;

	const getPermissionTitle = (slug: string) => {
		return tClanRoles(`permissionTitles.${slug}`, { defaultValue: '' });
	};

	const choiceFor = (permissionId: string) => {
		if (isLoaded) {
			const active = persisted?.permission_role_channel?.find((roleChannel) => roleChannel.permission_id === permissionId)?.active;
			return pending[permissionId] ?? savedChoice(active);
		}
		if (inGrace) {
			return pending[permissionId] ?? TypeChoose.Or;
		}
		return undefined;
	};

	return (
		<div className="flex-1 min-w-0 text-theme-primary">
			<div className="flex flex-col gap-2 mb-4">
				<div className="flex items-center justify-between gap-2 h-8">
					<h4 className="uppercase font-bold text-xs text-theme-primary-active truncate">
						{t('channelPermission.generalChannelPermission')}
					</h4>
					<div className="flex items-center shrink-0 h-8 text-xs">
						{showLoading && <span>{t('channelPermission.loading')}</span>}
						{loadFailed && (
							<button onClick={onRetry} className="px-2 py-1 rounded-md bg-item-hover text-theme-primary-active">
								{t('channelPermission.loadPermissions')}
							</button>
						)}
					</div>
				</div>
				{hasSelection && <p className="truncate text-base font-semibold text-theme-primary-active">{selectedTitle}</p>}
				<p className="text-xs whitespace-pre-wrap">{t('channelPermission.choiceLegend')}</p>
			</div>
			{hasPendingChanges && <p className="mb-2 p-2 rounded-md bg-input-secondary text-sm">{t('channelPermission.saveBeforeSwitch')}</p>}
			<div>
				{listPermission.map((item) => (
					<ItemPermission
						key={item.id}
						id={item.id}
						title={item.slug ? getPermissionTitle(item.slug) || item.title : item.title}
						choice={choiceFor(item.id)}
						canEdit={canEdit}
						dimmed={dimmed}
						onSelect={onSelect}
					/>
				))}
			</div>
		</div>
	);
});

export default ListPermission;
