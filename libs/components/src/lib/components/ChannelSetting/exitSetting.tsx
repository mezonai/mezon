import { MezonIcon, MzIcons20 } from '@mezon/ui';
import { generateE2eId } from '@mezon/utils';

export type ModalExitProps = {
	onClose: () => void;
};
const ExitSetting = (props: ModalExitProps) => {
	const { onClose } = props;
	const handleClose = () => {
		onClose();
	};

	return (
		<div className=" w-1/12 xl:w-1/5 flex-grow hidden sbm:block bg-theme-setting-primary">
			<div className="w-1/4 ml-5 pt-[94px]">
				<div className="w-fit flex flex-col items-center gap-2 group">
					<div
						onClick={handleClose}
						className="rounded-full p-[10px] border-2 border-theme-primary text-theme-primary cursor-pointer text-theme-primary-hover group/mzi"
						data-e2e={generateE2eId('clan_page.settings.button.exit')}
					>
						<MezonIcon icon={MzIcons20.mzClose} className="text-[var(--mz-icon)] group-hover/mzi:text-[var(--mz-icon-selected)]" />
					</div>
					<div className="font-semibold text-[13px] text-theme-primary">ESC</div>
				</div>
			</div>
		</div>
	);
};

export default ExitSetting;
