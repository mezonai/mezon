import React from 'react';

interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'dangerouslySetInnerHTML' | 'ref'> {
	className?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, InputProps>(({ ...rest }, ref) => {
	return <input type="checkbox" className={`${rest.className}`} {...rest} ref={ref} />;
});

export default Checkbox;
