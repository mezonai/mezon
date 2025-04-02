import { threadsActions, useAppDispatch } from '@mezon/store';

export type NavLinkProps = {
	readonly active?: boolean;
	readonly children?: React.ReactElement | string;
};

function NavLinkComponent({ active, children }: NavLinkProps) {
	const dispatch = useAppDispatch();
	const setTurnOffThreadMessage = () => {
		dispatch(threadsActions.setOpenThreadMessageState(false));
		dispatch(threadsActions.setValueThread(null));
	};

	return (
		<div className="group block relative rounded-3xl">
			<div className="flex absolute -left-2 items-center h-full">
				<div
					className={`${
						active ? 'scale-y-100 h-8' : 'h-8 scale-y-0 opacity-0 group-hover:opacity-100'
					} rounded-xl w-1 transition-all duration-200 ease-out transform origin-center bg-primary dark:bg-white`}
				></div>
			</div>

			<div onClick={setTurnOffThreadMessage} className={`flex items-center justify-center w-12 h-12 overflow-hidden`}>
				{children}
			</div>
		</div>
	);
}

export default NavLinkComponent;
