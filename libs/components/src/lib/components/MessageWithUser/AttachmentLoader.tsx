export const AttachmentLoader = ({
	appearanceTheme
}: {
	appearanceTheme: 'light' | 'dark' | 'sunrise' | 'purple_haze' | 'redDark' | 'abyss_dark';
}) => {
	return (
		<div className="w-[30px] h-[30px] flex justify-center items-center">
			<div className={appearanceTheme === 'light' ? 'light-attachment-loader' : 'dark-attachment-loader'} />
		</div>
	);
};
