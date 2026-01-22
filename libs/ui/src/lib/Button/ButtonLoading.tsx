import { useState } from 'react';
import Button from '../Button';
import { Icons } from '../Icons';

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
			{loading ? <Icons.IconLoadingTyping bgFill="mx-auto" /> : label}
		</Button>
	);
};

export default ButtonLoading;
