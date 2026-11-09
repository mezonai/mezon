import { useState } from 'react';
import Button from '../Button';
import { SpinningIcon } from '../IconKit';
import * as MzIcons20 from '../mezon-icons/20';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
	label?: React.ReactNode;
	className?: string;
	disabled?: boolean;
}

const ButtonLoading: React.FC<ButtonProps> = ({ onClick, label, className = '', disabled = false, ...rest }) => {
	const [loading, setLoading] = useState(false);

	const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		if (loading || disabled) return;

		setLoading(true);
		try {
			await Promise.resolve(onClick(e));
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button {...rest} onClick={handleClick} disabled={disabled || loading} className={className}>
			{loading ? (
				<span className="flex items-center justify-center">
					<SpinningIcon icon={MzIcons20.mzSpinner} />
				</span>
			) : (
				label
			)}
		</Button>
	);
};

export default ButtonLoading;
