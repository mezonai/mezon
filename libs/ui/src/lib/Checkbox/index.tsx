import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'dangerouslySetInnerHTML'> {
	className?: string;
	ref?: React.Ref<HTMLInputElement>;
}

const Checkbox: React.FC<InputProps> = React.forwardRef<HTMLInputElement, InputProps>(({ ...rest }, ref) => {
	return <input type="checkbox" className={`${rest.className}`} {...rest} ref={ref} />;
});

export default Checkbox;
