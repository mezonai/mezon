const ClientInformation = () => {
	return (
		<div className="rounded-md dark:bg-bgSecondary bg-bgLightSecondary p-5 dark:text-textPrimary text-colorTextLightMode flex flex-col gap-2">
			<div className="text-black dark:text-white font-medium text-xl">Client information</div>
			<div className="flex flex-col gap-5">
				<div className="flex gap-5 max-md:flex-col">
					<div className="flex flex-col gap-2 xl:w-1/3 max-xl:w-1/2">
						<div className="uppercase text-black dark:text-white font-bold text-xs">Client ID</div>
						<div className="text-black dark:text-white font-bold text-xs">1273168487367577641</div>
						<div className="py-[7px] px-4 cursor-pointer bg-blue-600 hover:bg-blue-800 transition-colors rounded-sm w-fit select-none font-medium text-white">
							Copy
						</div>
					</div>
					<div className="flex flex-col gap-2 xl:w-1/3 max-xl:w-1/2">
						<div className="uppercase text-black dark:text-white font-bold text-xs">Client Secret</div>
						<div className="text-xs">Hidden for security</div>
						<div className="py-[7px] px-4 cursor-pointer transition-colors rounded-sm w-fit select-none font-medium dark:text-white text-black dark:hover:bg-[#35373c] dark:bg-[#3b3d44] hover:bg-[#dfe1e5] bg-[#d7d9dc]">
							Reset secret
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-2">
					<div className="uppercase text-black dark:text-white font-bold text-xs">Public client</div>
					<div className="flex gap-5">
						<div>
							Public clients cannot maintain the confidentiality of their client credentials (i.e. desktop/mobile applications that do
							not use a server to make requests)
						</div>
						<div className="w-8">
							<input
								className="peer relative h-4 w-8 cursor-pointer appearance-none rounded-lg
                            bg-slate-300 transition-colors after:absolute after:top-0 after:left-0 after:h-4 after:w-4 after:rounded-full
                            after:bg-slate-500 after:transition-all checked:bg-blue-200 checked:after:left-4 checked:after:bg-blue-500
                            hover:bg-slate-400 after:hover:bg-slate-600 checked:hover:bg-blue-300 checked:after:hover:bg-blue-600
                            focus:outline-none checked:focus:bg-blue-400 checked:after:focus:bg-blue-700 focus-visible:outline-none disabled:cursor-not-allowed
                            disabled:bg-slate-200 disabled:after:bg-slate-300"
								type="checkbox"
								id="id-c01"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ClientInformation;
