import { scopes } from './Scopes';

const Generator = () => {
	return (
		<div className="rounded-md dark:bg-bgSecondary bg-bgLightSecondary p-5 dark:text-textPrimary text-colorTextLightMode flex flex-col gap-5">
			<div className="flex flex-col gap-2">
				<div className="text-black dark:text-white font-medium text-xl">OAuth2 URL Generator</div>
				<div>
					Generate an invite link for your application by picking the scopes and permissions it needs to function. Then, share the URL to
					others!
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<div className="uppercase text-black dark:text-white font-bold text-xs">Scopes</div>
				<div className="flex flex-wrap dark:bg-bgPrimary bg-bgLightPrimary p-5 rounded-md gap-y-3 gap-5">
					{scopes.map((item, index) => (
						<div key={index} className="w-[calc(33.33%_-_20px)] max-xl:w-[calc(50%_-_20px)] max-[962px]:w-full flex gap-2">
							<div className="w-6 h-6">
								<input type="checkbox" className="w-6 h-6" />
							</div>
							<div>{item.id}</div>
						</div>
					))}
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<div className="uppercase text-black dark:text-white font-bold text-xs">Generated URL</div>
				<div className="relative w-full">
					<input
						type="text"
						placeholder="Please select one OAuth2 scope"
						className="py-2 pl-2 pr-[85px] w-full bg-bgLightModeThird rounded-sm border dark:border-[#4d4f52] outline-primary dark:bg-[#1e1f22]"
						readOnly
					/>
					<div className="absolute top-1 right-2 w-[65px] h-[32px] flex justify-center items-center cursor-pointer bg-blue-600 hover:bg-blue-800 transition-colors rounded-sm select-none font-medium text-white">
						Copy
					</div>
				</div>
			</div>
		</div>
	);
};

export default Generator;
