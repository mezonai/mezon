import { getNewColorRole, setColorRoleNew } from '@mezon/store';
import { DEFAULT_ROLE_COLOR } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { colorArray } from '../index';

const RoleColor = () => {
	const { t } = useTranslation('clanRoles');
	const colorInputRef = useRef<HTMLInputElement>(null);
	const colorRole = useSelector(getNewColorRole);
	const dispatch = useDispatch();
	const [selectedColor, setSelectedColor] = useState<string>(colorRole || '');
	const [isCustoms, setIsCustoms] = useState<boolean>(false);

	const handleButtonClick = () => {
		if (colorInputRef.current) {
			colorInputRef.current.click();
		}
	};

	const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const color = event.target.value;
		setSelectedColor(color);
		dispatch(setColorRoleNew(color));
	};

	useEffect(() => {
		if (selectedColor !== DEFAULT_ROLE_COLOR && !colorArray.includes(selectedColor)) {
			setIsCustoms(true);
		} else {
			setIsCustoms(false);
		}
	}, [selectedColor]);

	return (
		<div className="w-full flex flex-col text-[15px] dark:text-textSecondary text-textSecondary800 pr-5">
			<div className="border-t-[1px] h-4 dark:border-borderDividerLight"></div>
			<div className="text-xs font-bold uppercase mb-2">
				{t('roleManagement.roleColour')} <b className="text-red-600">*</b>
			</div>
			<div className="text-xs mb-2">{t('roleManagement.membersUseColour')}</div>
			<div className="w-full grid grid-cols-10 gap-2">
				<button
					className="col-span-2 h-[50px] rounded relative"
					style={{ backgroundColor: DEFAULT_ROLE_COLOR }}
					onClick={() => {
						setSelectedColor(DEFAULT_ROLE_COLOR);
						dispatch(setColorRoleNew(DEFAULT_ROLE_COLOR));
					}}
				>
					{selectedColor === DEFAULT_ROLE_COLOR && !isCustoms && (
						<span className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</span>
					)}
				</button>
				<div className="col-span-2 h-[50px] relative inline-block cursor-pointer rounded">
					<input
						type="color"
						ref={colorInputRef}
						value={selectedColor}
						onChange={handleColorChange}
						className="w-full h-full opacity-0 absolute top-0 left-0 cursor-pointer rounded"
					/>
					<div className="w-full h-full rounded" style={{ backgroundColor: selectedColor }} onClick={handleButtonClick} />
					{selectedColor === colorRole && isCustoms && (
						<span className="absolute inset-0 flex items-center justify-center text-white font-bold pointer-events-none">✓</span>
					)}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width="10"
						height="10"
						className="absolute top-1 right-1 text-black pointer-events-none"
					>
						<path d="M16.25 2.25l-2 2-.63-.63a3 3 0 0 0-4.24 0l-.85.85c-.3.3-.3.77 0 1.06l9.94 9.94c.3.3.77.3 1.06 0l.85-.85a3 3 0 0 0 0-4.24l-.63-.63 2-2a3.89 3.89 0 1 0-5.5-5.5zM9.3 9.7a1 1 0 0 1 1.4 0l3.6 3.6a1 1 0 0 1 0 1.4l-4.84 4.84a5 5 0 0 1-2.7 1.39c-.47.08-.86.42-1.1.83a2.5 2.5 0 1 1-3.42-3.42c.41-.24.75-.63.83-1.1a5 5 0 0 1 1.4-2.7L9.28 9.7z" />
					</svg>
				</div>
				<div className="col-span-6 grid grid-cols-10 gap-2">
					{colorArray.map((color, index) => (
						<button
							key={index}
							className="w-[20px] h-[20px] rounded relative"
							style={{ backgroundColor: color }}
							onClick={() => {
								setSelectedColor(color);
								dispatch(setColorRoleNew(color));
							}}
						>
							{selectedColor === color && !isCustoms && (
								<span className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</span>
							)}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export default RoleColor;
