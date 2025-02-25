export const TitleSection = () => {
	return (
		<div className="flex flex-col justify-start items-center w-fit h-fit">
			<h1 className="text-4xl font-bold dark:text-[#ffffff] text-black leading-[120%] text-center">WELCOME BACK</h1>
			<p className="text-base font-medium dark:text-[#cccccc] text-black leading-[150%] text-center">So glad to meet you again!</p>
		</div>
	);
};

export const DescriptionStructure = () => {
	return (
		<div className=" shadow-lg rounded-2xl p-6 text-center max-w-md w-full">
			<h2 className="text-xl font-semibold mb-4 text-gray-700">To use Mezon on your computer:</h2>
			<ol className="text-gray-600 text-left list-decimal list-inside mb-4">
				<li>Open Mezon on your phone</li>
				<li>
					Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Mezon Web</strong>
				</li>
				<li>Point your phone to this screen to capture the code</li>
			</ol>

			<div className="mt-4 text-gray-500 text-sm">
				<input type="checkbox" id="keepSignedIn" className="mr-2" />
				<label htmlFor="keepSignedIn">Keep me signed in</label>
			</div>
		</div>
	);
};
