import { useEffect, useState } from 'react';
import { ButtonCopy } from '../../components';

interface IPreClassProps {
	children?: any;
	isInPinMsg?: boolean;
}

const PreClass = ({ children, isInPinMsg }: IPreClassProps) => {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setCopied(false);
		}, 5000);

		return () => clearTimeout(timer);
	}, [copied]);

	return (
		<pre
			className={`pre dark:text-white text-colorTextLightMode bg-bgLightSecondary dark:bg-bgSecondary border border-[#E3E5E8] dark:border-[#1E1F22] ${isInPinMsg ? 'flex items-start' : ''}`}
		>
			<ButtonCopy
				copyText={children.props.children}
				className={`absolute top-2 !rounded-full overflow-hidden dark:border-black dark:shadow-[#000000]  `}
			/>
			<code className={`code ${isInPinMsg ? 'whitespace-pre-wrap block break-words' : ''}`}>
				{children.props.children?.toString()?.split('```')}
			</code>
		</pre>
	);
};

export default PreClass;
