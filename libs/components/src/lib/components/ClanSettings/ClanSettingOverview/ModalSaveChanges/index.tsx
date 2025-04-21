import { Icons } from '@mezon/ui';

type ModalSaveChangesProps = {
	onSave: () => void;
	onReset: () => void;
	isLoading?: boolean;
};

const ModalSaveChanges = ({ onSave, onReset, isLoading }: ModalSaveChangesProps) => {
	const handleSaveChanges = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.currentTarget.disabled = true;
		onSave();
	};
	return (
		<div
			className="w-fit min-w-[700px] max-md:min-w-[90%] fixed bottom-[20px] left-[50%] translate-x-[-50%] py-[10px] pl-4 pr-[10px] rounded-[5px] dark:bg-bgProfileBody bg-white dark:text-white text-colorTextLightMode border-0 text-sm font-medium z-50"
			style={{ boxShadow: '0 2px 10px 0 hsl(0 calc( 1 * 0%) 0% / 0.1)' }}
		>
			<div className="flex flex-row justify-between items-center">
				<h3>Careful — you have unsaved changes!</h3>
				<div className="flex flex-row justify-end gap-[20px]">
					<button onClick={onReset} className="rounded px-4 py-1.5 hover:underline">
						Reset
					</button>
					<button onClick={handleSaveChanges} className="ml-auto bg-blue-600 rounded-[4px] px-4 py-1.5 text-nowrap text-white w-28">
						{isLoading ? <Icons.IconLoadingTyping bgFill="mx-auto" iconFill={'fill-white'} /> : 'Save Changes'}
					</button>
				</div>
			</div>
		</div>
	);
};

export default ModalSaveChanges;
