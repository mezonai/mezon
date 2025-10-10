import { auditLogFilterActions, auditLogList, selectTheme, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { ActionLog, IUserAuditLog } from '@mezon/utils';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface Action {
	name: string;
	icon: string;
}

type SearchActionAuditLogProps = {
	currentClanId: string;
	actionFilter: string;
	userFilter?: IUserAuditLog | null;
	closeModal: () => void;
	pageSize: number;
	currentPage: number;
	selectedDate: string;
};

const iconMap: { [key in ActionLog]: string } = {
	[ActionLog.ALL_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_CLAN_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_CHANNEL_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_CHANNEL_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_CHANNEL_PRIVATE_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_CHANNE_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_CHANNEL_PERMISSION_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_CHANNEL_PERMISSION_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_CHANNEL_PERMISSION_ACTION_AUDIT]: '-',
	[ActionLog.KICK_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.PRUNE_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.BAN_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.UNBAN_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_ROLES_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.MOVE_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.DISCONNECT_MEMBER_ACTION_AUDIT]: '-',
	[ActionLog.ADD_BOT_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_THREAD_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_THREAD_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_THREAD_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_ROLE_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_ROLE_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_ROLE_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_WEBHOOK_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_WEBHOOK_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_WEBHOOK_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_EMOJI_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_EMOJI_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_EMOJI_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_STICKER_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_STICKER_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_STICKER_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_EVENT_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_EVENT_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_EVENT_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_CANVAS_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_CANVAS_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_CANVAS_ACTION_AUDIT]: '-',
	[ActionLog.CREATE_CATEGORY_ACTION_AUDIT]: '-',
	[ActionLog.UPDATE_CATEGORY_ACTION_AUDIT]: '-',
	[ActionLog.DELETE_CATEGORY_ACTION_AUDIT]: '-',
	[ActionLog.ADD_MEMBER_CHANNEL_ACTION_AUDIT]: '-',
	[ActionLog.REMOVE_MEMBER_CHANNEL_ACTION_AUDIT]: '-',
	[ActionLog.ADD_ROLE_CHANNEL_ACTION_AUDIT]: '-',
	[ActionLog.REMOVE_ROLE_CHANNEL_ACTION_AUDIT]: '-',
	[ActionLog.ADD_MEMBER_THREAD_ACTION_AUDIT]: '-',
	[ActionLog.REMOVE_MEMBER_THREAD_ACTION_AUDIT]: '-',
	[ActionLog.ADD_ROLE_THREAD_ACTION_AUDIT]: '-',
	[ActionLog.REMOVE_ROLE_THREAD_ACTION_AUDIT]: '-'
};

const SearchActionAuditLogModal = ({
	currentClanId,
	actionFilter,
	userFilter,
	closeModal,
	pageSize,
	currentPage,
	selectedDate
}: SearchActionAuditLogProps) => {
	const { t } = useTranslation('auditLogSearch');
	const dispatch = useAppDispatch();
	const appearanceTheme = useSelector(selectTheme);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedAction, setSelectedAction] = useState<string>(actionFilter || ActionLog.ALL_ACTION_AUDIT);

	const actions = Object.values(ActionLog).map((action) => ({
		name: action,
		icon: iconMap[action] || '-'
	}));

	const handleActionClick = (action: Action) => {
		setSelectedAction(action?.name || actionFilter);
		dispatch(auditLogFilterActions.setAction(action?.name === ActionLog.ALL_ACTION_AUDIT ? '' : action?.name));
		if (currentClanId) {
			const body = {
				actionLog: action?.name === ActionLog.ALL_ACTION_AUDIT ? '' : action?.name,
				userId: userFilter?.userId ?? '',
				clanId: currentClanId ?? '',
				date_log: selectedDate
			};
			dispatch(auditLogList(body));
		}
		closeModal();
	};

	const handleClearSearch = () => setSearchTerm('');

	const filteredActions = actions.filter((action) => action.name.toLowerCase().includes(searchTerm.toLowerCase()));

	return (
		<div className="absolute border sm:left-0 max-sm:right-0 max-sm:left-[unset] top-8 pb-3 rounded border-solid border-theme-primary bg-theme-setting-nav z-[9999] shadow w-72">
			<div className="bg-theme-setting-primary rounded-lg w-full max-w-xs">
				<div className="relative m-2">
					<input
						type="text"
						placeholder={t('searchActions')}
						className={`w-full p-2 pr-10 bg-theme-input text-theme-primary-active rounded focus:outline-none ${appearanceTheme === 'light' ? 'lightEventInputAutoFill' : ''}`}
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
					<span className="absolute right-3 top-3 text-gray-400 cursor-pointer" onClick={searchTerm ? handleClearSearch : undefined}>
						{searchTerm ? <Icons.Close defaultSize="size-4" /> : <Icons.Search className="w-4 h-4 text-theme-primary" />}
					</span>
				</div>

				<div className={`h-64 ml-2 pr-1 overflow-y-scroll ${appearanceTheme === 'light' ? 'customSmallScrollLightMode' : 'thread-scroll'}`}>
					{filteredActions.length > 0 ? (
						filteredActions.map((action, index) => (
							<div
								key={index}
								className={`flex items-center px-2 py-[10px] mb-1 text-theme-primary font-medium rounded cursor-pointer transition-colors bg-item-theme-hover ${
									selectedAction === action.name ? 'bg-[#5865F2] text-white hover:text-buttonProfile' : ''
								}`}
								onClick={() => handleActionClick(action)}
							>
								<span className="">{action.icon}</span>
								<span className="ml-3 ">{action.name}</span>
								{selectedAction === action.name && (
									<span className="ml-auto">
										<Icons.CheckMarkFilter defaultSize="w-5 h-5" defaultFill="text-white" />
									</span>
								)}
							</div>
						))
					) : (
						<div className="w-full h-full text-center text-gray-400 flex flex-col justify-center items-center">
							<div className="text-theme-primary font-medium text-xl">{t('noResults.title')}</div>
							<div>{t('noResults.description')}</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default SearchActionAuditLogModal;
