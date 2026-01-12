import { auditLogFilterActions, useAppDispatch } from '@mezon/store';
import { Icons } from '@mezon/ui';
import { UserAuditLog, generateE2eId } from '@mezon/utils';

export type ModalExitProps = {
	onClose: () => void;
};
const ExitSetting = (props: ModalExitProps) => {
	const dispatch = useAppDispatch();
	const { onClose } = props;
	const handleClose = () => {
		dispatch(auditLogFilterActions.setAction(''));
		dispatch(
			auditLogFilterActions.setUser({
				userId: '',
				username: UserAuditLog.ALL_USER_AUDIT
			})
		);
		onClose();
	};

	return (
		<div className="relative w-1/12 xl:w-1/5 flex-grow hidden lg:block">
			<div className="fixed w-1/4 xl:ml-5 pt-[94px]">
				<div className="w-fit flex flex-col items-center gap-2 text-theme-primary text-theme-primary-hover">
					<div
						onClick={handleClose}
						className="rounded-full p-[10px] border-theme-primary bg-button-secondary bg-secondary-button-hover cursor-pointer"
						data-e2e={generateE2eId('user_setting.account.exit_setting')}
					>
						<Icons.CloseButton className="w-4" />
					</div>
					<div className="font-semibold text-[13px] text-theme-primary">ESC</div>
				</div>
			</div>
		</div>
	);
};

export default ExitSetting;
