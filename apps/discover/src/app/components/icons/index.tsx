import { MezonIcon, MzIcons24 } from '@mezon/ui';

export const FacebookIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M22 12.07C22 6.49 17.52 2 12 2S2 6.49 2 12.07c0 5.03 3.66 9.2 8.44 9.93v-7.02H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.73 8.44-4.9 8.44-9.93z" />
	</svg>
);

export const TwitterIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.26 4.26 0 0 0 1.87-2.35 8.54 8.54 0 0 1-2.7 1.03 4.25 4.25 0 0 0-7.24 3.88 12.06 12.06 0 0 1-8.75-4.44 4.24 4.24 0 0 0 1.32 5.66 4.22 4.22 0 0 1-1.92-.53v.05a4.25 4.25 0 0 0 3.41 4.17 4.26 4.26 0 0 1-1.92.07 4.25 4.25 0 0 0 3.97 2.95A8.52 8.52 0 0 1 2 19.54 12.02 12.02 0 0 0 8.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.35-.02-.53A8.36 8.36 0 0 0 22.46 6z" />
	</svg>
);

export const RedditIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
	<svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
		<path d="M14.5 15.5c-.97.64-2.26 1.03-3.75 1.03s-2.78-.39-3.75-1.03a.5.5 0 1 1 .55-.84c.8.53 1.92.87 3.2.87 1.28 0 2.4-.34 3.2-.87a.5.5 0 0 1 .55.84zM9.75 12.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zm6 0a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0zM22 12c0-1.1-.9-2-2-2-.6 0-1.14.27-1.5.69-1.02-.66-2.4-1.1-3.93-1.2l.79-3.72 2.59.55a1.5 1.5 0 1 0 .2-1 1.5 1.5 0 0 0-.94.34l-3.1-.66a.5.5 0 0 0-.59.38l-.93 4.37c-1.62.07-3.09.51-4.15 1.2A2 2 0 0 0 4 10c-1.1 0-2 .9-2 2 0 .77.43 1.44 1.07 1.77a3.9 3.9 0 0 0-.07.73c0 2.9 3.13 5.25 7 5.25s7-2.35 7-5.25c0-.25-.03-.5-.07-.73.64-.33 1.07-1 1.07-1.77z" />
	</svg>
);

export const LightBulbIcon = ({ className }: { className?: string }) => <MezonIcon icon={MzIcons24.mzLamp} className={className} />;

export const UserGroupIcon = ({ className }: { className?: string }) => <MezonIcon icon={MzIcons24.mzMembers} className={className} />;
