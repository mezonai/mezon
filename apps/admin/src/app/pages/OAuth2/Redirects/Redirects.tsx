const Redirects = () => {
	return (
		<div className="flex flex-col gap-2 rounded-md dark:bg-bgSecondary bg-bgLightSecondary p-5 dark:text-textPrimary text-colorTextLightMode">
			<div className="text-black dark:text-white font-medium text-xl">Redirects</div>
			<div className="flex flex-col gap-5">
				<div>
					You must specify at least one URI for authentication to work. If you pass a URI in an OAuth request, it must exactly match one of
					the URIs you enter here.
				</div>
				<div className="py-[7px] px-4 cursor-pointer bg-blue-600 hover:bg-blue-800 transition-colors rounded-sm w-fit select-none font-medium text-white">
					Add Redirect
				</div>
			</div>
		</div>
	);
};

export default Redirects;
