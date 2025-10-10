import { Icons } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';
import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MainPermissionManage from './MainPermissionManage';

type PermissionManageProps = {
	channelId: string;
	channelPrivate: boolean;
	setIsPrivateChannel: React.Dispatch<React.SetStateAction<boolean>>;
	setPermissionsListHasChanged: React.Dispatch<React.SetStateAction<boolean>>;
	saveTriggerRef: React.MutableRefObject<(() => void) | null>;
	resetTriggerRef: React.MutableRefObject<(() => void) | null>;
};

const PermissionManage: React.FC<PermissionManageProps> = ({
	channelId,
	channelPrivate,
	setIsPrivateChannel,
	setPermissionsListHasChanged,
	saveTriggerRef,
	resetTriggerRef
}) => {
	const [showRole, setShowRole] = useState(true);
	return (
		channelPrivate && (
			<div data-e2e={generateE2eId('channel_setting_page.permissions.section.advanced_permissions')}>
				<HeaderPermissionManage showRole={showRole} setShowRole={setShowRole} />
				{showRole && (
					<MainPermissionManage
						channelId={channelId}
						setIsPrivateChannel={setIsPrivateChannel}
						setPermissionsListHasChanged={setPermissionsListHasChanged}
						saveTriggerRef={saveTriggerRef}
						resetTriggerRef={resetTriggerRef}
					/>
				)}
			</div>
		)
	);
};

export default PermissionManage;

type HeaderPermissionManageProps = {
	showRole: boolean;
	setShowRole: React.Dispatch<React.SetStateAction<boolean>>;
};

const HeaderPermissionManage = memo(({ showRole, setShowRole }: HeaderPermissionManageProps) => {
	const { t } = useTranslation('channelSetting');
	return (
		<div className="flex items-center gap-x-3.5 w-fit text-theme-primary" onClick={() => setShowRole(!showRole)}>
			<h3 className="text-xl font-semibold">{t('channelPermission.permissionOverrides')}</h3>
			<Icons.ArrowDown defaultSize={`size-5  transition-all duration-300 ${showRole ? '' : '-rotate-90'}`} />
		</div>
	);
});
