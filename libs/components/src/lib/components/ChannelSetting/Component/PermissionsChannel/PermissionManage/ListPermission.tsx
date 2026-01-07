import type { PermissionUserEntity } from '@mezon/store';
import { permissionRoleChannelActions, selectAllPermissionRoleChannel, useAppDispatch, useAppSelector } from '@mezon/store';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ItemPermission from './ItemPermission';
import { ENTITY_TYPE } from './MainPermissionManage';

export type ListPermissionHandle = {
	reset: () => void;
};

type ItemListPermissionProps = {
	onSelect: (id: string, option: number, active?: boolean) => void;
	listPermission: PermissionUserEntity[];
	channelId: string;
	currentRoleId?: { id: string; type: number };
};

const ListPermission = forwardRef<ListPermissionHandle, ItemListPermissionProps>((props, ref) => {
	const { onSelect, listPermission, currentRoleId } = props;
	const { t } = useTranslation('channelSetting');
	const { t: tClanRoles } = useTranslation('clanRoles');
	const dispatch = useAppDispatch();

	const listPermissionRoleChannel = useAppSelector((state) =>
		selectAllPermissionRoleChannel(
			state,
			props.channelId,
			currentRoleId?.type === ENTITY_TYPE.ROLE ? currentRoleId.id : undefined,
			currentRoleId?.type === ENTITY_TYPE.USER ? currentRoleId.id : undefined
		)
	);
	const itemRefs = useRef<{ [key: string]: { reset: () => void } }>({});

	const getPermissionTitle = (slug: string) => {
		return tClanRoles(`permissionTitles.${slug}`, { defaultValue: '' });
	};

	useEffect(() => {
		if (currentRoleId && !listPermissionRoleChannel) {
			dispatch(
				permissionRoleChannelActions.fetchPermissionRoleChannel({
					channelId: props.channelId,
					roleId: currentRoleId.type === ENTITY_TYPE.ROLE ? currentRoleId.id : '',
					userId: currentRoleId.type === ENTITY_TYPE.USER ? currentRoleId.id : ''
				})
			);
		}
	}, [currentRoleId, listPermissionRoleChannel, props.channelId, dispatch]);
	useImperativeHandle(ref, () => ({
		reset: () => {
			Object.values(itemRefs.current).forEach((item) => item.reset());
		}
	}));

	useEffect(() => {
		Object.values(itemRefs.current).forEach((item) => item.reset());
	}, [listPermissionRoleChannel]);

	return (
		<div className="basis-2/3 text-theme-primary">
			<h4 className="uppercase font-bold text-xs text-theme-primary-active mb-2">{t('channelPermission.generalChannelPermission')}</h4>
			<div className="space-y-2">
				{listPermission.map((item, index) => {
					const matchingRoleChannel = listPermissionRoleChannel?.permissionRoleChannel?.find(
						(roleChannel) => roleChannel.permissionId === item.id
					);

					return (
						<ItemPermission
							key={item.id}
							id={item.id}
							title={item.slug ? getPermissionTitle(item.slug) || item.title : item.title}
							active={matchingRoleChannel?.active}
							onSelect={onSelect}
							ref={(el) => (itemRefs.current[item.id] = el!)}
						/>
					);
				})}
			</div>
		</div>
	);
});

export default ListPermission;
