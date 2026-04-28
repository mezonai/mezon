import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'dangerouslySetInnerHTML'> {
	className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...rest }, ref) => {
	return <input type="checkbox" className={className} {...rest} ref={ref} />;
});

export default Checkbox;
