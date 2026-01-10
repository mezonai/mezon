import { generateE2eId } from '@mezon/utils';

type UserDescriptionProps = {
	title: string;
	detail: string;
};

const UserDescription = ({ title, detail }: UserDescriptionProps) => {
	return (
		detail && (
			<>
				<div className="w-full border-b-theme-primary p-1"></div>
				<div className="flex flex-col">
					<div className="font-bold tracking-wider text-xs pt-2 text-theme-primary-active">{title}</div>
					<div className="font-normal tracking-wider text-xs one-line pt-2" data-e2e={generateE2eId('mention.text.aboutMe')}>
						{detail}
					</div>
				</div>
			</>
		)
	);
};
export default UserDescription;
