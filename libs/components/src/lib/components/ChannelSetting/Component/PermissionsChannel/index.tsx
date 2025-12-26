import { useAuth } from '@mezon/core';
import { channelsActions, selectAllCategories, selectChannelById, useAppDispatch, useAppSelector } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { generateE2eId, type IChannel } from '@mezon/utils';
import type { MutableRefObject, RefObject } from 'react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AddMemRole } from '../Modal/addMemRoleModal';
import ModalAskChangeChannel from '../Modal/modalAskChangeChannel';
import PermissionManage from './PermissionManage';
import ListMemberPermission from './listMemberPermission';
import ListRolePermission from './listRolePermission';

export type PermissionsChannelProps = {
	channel: IChannel;
	openModalAdd: MutableRefObject<boolean>;
	parentRef: RefObject<HTMLDivElement>;
	clanId?: string;
};

const PermissionsChannel = (props: PermissionsChannelProps) => {
	const { channel, openModalAdd, parentRef, clanId } = props;
	const realTimeChannel = useAppSelector((state) => selectChannelById(state, channel.channel_id || ''));
	const listCategory = useSelector(selectAllCategories);
	const categoryName = useMemo(() => {
		if (realTimeChannel?.category_name) {
			return realTimeChannel.category_name;
		}
		if (realTimeChannel?.category_id) {
			const category = listCategory.find((cat) => cat.id === realTimeChannel.category_id);
			return category?.category_name || '';
		}
		return '';
	}, [realTimeChannel?.category_name, realTimeChannel?.category_id, listCategory]);
	const { t } = useTranslation('channelSetting');
	const [showAddMemRole, setShowAddMemRole] = useState(false);
	const [valueToggleInit, setValueToggleInit] = useState(!!channel.channel_private);
	const [valueToggle, setValueToggle] = useState(valueToggleInit);
	const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
	const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
	const [permissionsListHasChanged, setPermissionsListHasChanged] = useState(false);
	const saveTriggerRef = useRef<() => void | null>(null);
	const resetTriggerRef = useRef<() => void | null>(null);
	const { userProfile } = useAuth();
	const dispatch = useAppDispatch();

	const handleToggle = useCallback(() => {
		setValueToggle(!valueToggle);
	}, [valueToggle]);

	const handleReset = useCallback(() => {
		setSelectedRoleIds([]);
		setSelectedUserIds([]);
		setValueToggle(valueToggleInit);
		if (resetTriggerRef.current) {
			resetTriggerRef.current();
		}
	}, [valueToggleInit]);
	const handleSaveChannelPrivateChanged = useCallback(async () => {
		setValueToggleInit(valueToggle);
		const updatedUserIds = userProfile?.user?.id ? [...selectedUserIds, userProfile?.user.id] : selectedUserIds;
		await dispatch(
			channelsActions.updateChannelPrivate({
				clan_id: clanId,
				channel_id: channel.id,
				channel_private: channel.channel_private || 0,
				user_ids: updatedUserIds,
				role_ids: selectedRoleIds
			})
		);
	}, [valueToggle, selectedUserIds, selectedRoleIds, userProfile, channel]);

	const handleSave = useCallback(() => {
		if (valueToggle !== valueToggleInit) {
			handleSaveChannelPrivateChanged();
		}
		if (saveTriggerRef.current && permissionsListHasChanged) {
			saveTriggerRef.current();
		}
	}, [valueToggle, valueToggleInit, permissionsListHasChanged, handleSaveChannelPrivateChanged]);

	const openAddMemRoleModal = useCallback(() => {
		setShowAddMemRole(true);
		openModalAdd.current = true;
	}, []);

	const closeAddMemRoleModal = useCallback(() => {
		setShowAddMemRole(false);
		setTimeout(() => {
			openModalAdd.current = false;
			parentRef?.current?.focus();
		}, 0);
	}, [openModalAdd, parentRef]);

	const handleSelectedUsersChange = useCallback((newSelectedUserIds: string[]) => {
		setSelectedUserIds(newSelectedUserIds);
	}, []);

	const handleSelectedRolesChange = useCallback((newSelectedRoleIds: string[]) => {
		setSelectedRoleIds(newSelectedRoleIds);
	}, []);

	return (
		<>
			<div className="overflow-y-auto flex flex-col flex-1 shrink bg-theme-setting-primary w-1/2 pt-[94px] sbm:pb-7 sbm:px-[40px] p-4 overflow-x-hidden min-w-full sbm:min-w-[700px] 2xl:min-w-[900px] max-w-[740px] hide-scrollbar relative">
				<div className="dark:text-white text-[15px] text-black">
					<HeaderModal name={categoryName} />
					<div className="rounded-md overflow-hidden mt-4">
						<div
							className={`bg-theme-setting-nav flex justify-between items-start p-4 border-theme-primary border-1 ${valueToggle ? 'border-b-0 rounded-tl-lg rounded-tr-lg' : 'rounded-lg'} `}
						>
							<div>
								<div className="inline-flex mb-2 text-theme-primary-active">
									<Icons.LockIcon />
									<p className="ml-2 font-bold text-theme-primary">{t('channelPermission.privateChannel')}</p>
								</div>
								<p className="text-xs text-theme-primary">{t('channelPermission.basicViewDescription')}</p>
							</div>
							<input
								className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
								bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
								after:bg-slate-500 after:transition-all
								checked:bg-[#5265EC] checked:after:left-4 checked:after:bg-white
								hover:bg-slate-400 after:hover:bg-slate-600
								checked:hover:bg-[#4654C0] checked:after:hover:bg-white
								focus:outline-none checked:focus:bg-[#4654C0] checked:after:focus:bg-white
								focus-visible:outline-none disabled:cursor-not-allowed
								disabled:bg-slate-200 disabled:after:bg-slate-300"
								type="checkbox"
								checked={valueToggle}
								id="id-c01"
								onChange={handleToggle}
								data-e2e={generateE2eId('channel_setting_page.permissions.button.change_status')}
							/>
						</div>
						{valueToggle && (
							<div
								className="p-4 bg-theme-setting-nav border-theme-primary rounded-bl-lg rounded-br-lg"
								data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management')}
							>
								<div className="flex justify-between items-center pb-4">
									<p className="uppercase font-bold text-xs text-theme-primary">{t('channelPermission.whoCanAccess')}</p>
									<button
										className="btn-primary btn-primary-hover px-4 py-1 rounded-lg "
										onClick={openAddMemRoleModal}
										data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.button.add')}
									>
										{t('channelPermission.addMemberAndRoles')}
									</button>
								</div>
								<hr className="border-t border-solid dark:border-borderDefault border-bgModifierHoverLight" />
								<div className="py-4">
									<p className="uppercase font-bold text-xs pb-4 text-theme-primary">{t('channelPermission.roles')}</p>
									<div data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.role_list')}>
										<ListRolePermission
											channel={channel}
											selectedRoleIds={selectedRoleIds}
											setSelectedRoleIds={setSelectedRoleIds}
										/>
									</div>
								</div>
								<hr className="border-t border-solid dark:border-borderDefault border-bgModifierHoverLight" />
								<div className="py-4">
									<p className="uppercase font-bold text-xs pb-4 text-theme-primary">{t('channelPermission.members')}</p>
									<div data-e2e={generateE2eId('channel_setting_page.permissions.section.member_role_management.member_list')}>
										<ListMemberPermission
											channel={channel}
											selectedUserIds={selectedUserIds}
											setSelectedUserIds={setSelectedUserIds}
										/>
									</div>
								</div>
							</div>
						)}
					</div>
					<hr className="border-t border-solid dark:border-gray-700 border-bgModifierHoverLight mt-10 mb-[30px]" />
					<PermissionManage
						channelId={channel.id}
						channelPrivate={channel.channel_private === 1}
						setIsPrivateChannel={setValueToggle}
						setPermissionsListHasChanged={setPermissionsListHasChanged}
						saveTriggerRef={saveTriggerRef}
						resetTriggerRef={resetTriggerRef}
					/>
				</div>
				{(valueToggleInit !== valueToggle || permissionsListHasChanged) && (
					<ModalAskChangeChannel onReset={handleReset} onSave={handleSave} className="relative mt-8 bg-transparent pr-0" />
				)}
			</div>
			{showAddMemRole && (
				<AddMemRole
					onClose={closeAddMemRoleModal}
					channel={channel}
					onSelectedUsersChange={handleSelectedUsersChange}
					onSelectedRolesChange={handleSelectedRolesChange}
					selectRoleIds={selectedRoleIds}
					selectUserIds={selectedUserIds}
				/>
			)}
		</>
	);
};

export default PermissionsChannel;

type HeaderModalProps = {
	name?: string;
};

const HeaderModal = memo((props: HeaderModalProps) => {
	const { name = '' } = props;
	const { t } = useTranslation('channelSetting');
	return (
		<>
			<h3 className="mb-4 font-bold text-xl text-theme-primary-active ">{t('channelPermission.header.title')}</h3>
			<p className="mb-3 text-theme-primary">{t('channelPermission.header.description')}</p>
			<div className="flex mt-4 p-4">
				<Icons.SyncIcon defaultFill="#F0B033" defaultSize="mr-2" />
				<p className="text-theme-primary">{t('channelPermission.header.syncedWithCategory')} </p>
				<p className="font-bold pl-1 text-theme-primary"> {name}</p>
			</div>
		</>
	);
});
