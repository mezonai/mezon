import { selectIsPrivate, threadsActions, useAppDispatch } from '@mezon/store';
import { useSelector } from 'react-redux';

type PrivateThreadProps = {
	label?: string;
	title?: string;
};

const PrivateThread = ({ label, title }: PrivateThreadProps) => {
	const dispatch = useAppDispatch();
	const isPrivate = useSelector(selectIsPrivate);

	const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.checked ? 1 : 0;
		dispatch(threadsActions.setIsPrivate(value));
	};

	return (
		<div className="flex flex-col mt-4 mb-4">
			<span className="text-xs font-semibold uppercase mb-2 text-theme-primary-active">{title}</span>
			<div className="flex items-center gap-2">
				<input type="checkbox" onChange={handleToggle} id="private" className="w-6 h-6 rounded-lg focus:ring-transparent cursor-pointer" />
				<label htmlFor="private" className="text-theme-primary text-base hover:text-theme-primary cursor-pointer">
					{label}
				</label>
			</div>
			{isPrivate === 1 && <span className="text-xs text-theme-primary mt-2">You can invite new people by @mentioning them.</span>}
		</div>
	);
};

export default PrivateThread;
