import type { IconData } from '../mezon-icons';
import { MezonIcon } from '../mezon-icons';

export const SpinningIcon = ({ icon, className }: { icon: IconData; className?: string }) => (
	<span className={`inline-flex animate-spin${className ? ` ${className}` : ''}`}>
		<MezonIcon icon={icon} className="!animate-none" />
	</span>
);
