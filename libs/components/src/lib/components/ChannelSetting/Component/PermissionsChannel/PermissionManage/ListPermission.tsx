import { PermissionUserEntity, selectAllPermissionRoleChannel, useAppSelector } from '@mezon/store';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ItemPermission from './ItemPermission';

export type ListPermissionHandle = {
	reset: () => void;
};

type ItemListPermissionProps = {
	onSelect: (id: string, option: number, active?: boolean) => void;
	listPermission: PermissionUserEntity[];
	channelId: string;
};

const ListPermission = forwardRef<ListPermissionHandle, ItemListPermissionProps>((props, ref) => {
	const { onSelect, listPermission } = props;
	const { t } = useTranslation('channelSetting');
	const listPermissionRoleChannel = useAppSelector((state) => selectAllPermissionRoleChannel(state, props.channelId));
	const itemRefs = useRef<{ [key: string]: { reset: () => void } }>({});

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
					const matchingRoleChannel = listPermissionRoleChannel?.permission_role_channel?.find(
						(roleChannel) => roleChannel.permission_id === item.id
					);

					return (
						<ItemPermission
							key={item.id}
							id={item.id}
							title={item.title}
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
