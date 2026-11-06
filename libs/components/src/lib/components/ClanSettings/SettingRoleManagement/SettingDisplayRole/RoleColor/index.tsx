import { getNewColorRole, setColorRoleNew } from '@mezon/store';
import { MezonIcon, MzIcons16 } from '@mezon/ui';
import { DEFAULT_ROLE_COLOR, generateE2eId } from '@mezon/utils';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { colorArray } from '../index';

const RoleColor = ({ hasPermissionEdit, isEveryoneRole }: { hasPermissionEdit: boolean; isEveryoneRole?: boolean }) => {
	const { t } = useTranslation('clanRoles');
	const colorInputRef = useRef<HTMLInputElement>(null);
	const colorRole = useSelector(getNewColorRole);
	const dispatch = useDispatch();
	const [selectedColor, setSelectedColor] = useState<string>(colorRole || '');
	const [isCustoms, setIsCustoms] = useState<boolean>(false);
	const isDisabled = !hasPermissionEdit || isEveryoneRole;

	const handleButtonClick = () => {
		if (isDisabled) return;
		if (colorInputRef.current) {
			colorInputRef.current.click();
		}
	};

	const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (isDisabled) return;
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

		setSelectedColor(colorRole || '');
	}, [selectedColor, colorRole]);

	return (
		<div
			className={`w-full flex flex-col text-[15px] dark:text-textSecondary text-textSecondary800 pr-0 md:pr-5 ${isDisabled ? 'opacity-60' : ''}`}
		>
			<div className="border-t-[1px] h-4 dark:border-borderDividerLight"></div>
			<div className="text-xs font-bold uppercase mb-2">
				{t('roleManagement.roleColour')} <b className="text-red-600">*</b>
			</div>
			<div className="text-xs mb-2">{t('roleManagement.membersUseColour')}</div>
			<div className="w-full flex flex-col md:grid md:grid-cols-10 gap-2">
				<div className="flex flex-row md:contents gap-2">
					<button
						className={`flex-1 md:col-span-2 h-[40px] md:h-[50px] rounded relative ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
						style={{ backgroundColor: DEFAULT_ROLE_COLOR }}
						onClick={() => {
							if (isDisabled) return;
							setSelectedColor(DEFAULT_ROLE_COLOR);
							dispatch(setColorRoleNew(DEFAULT_ROLE_COLOR));
						}}
						disabled={isDisabled}
					>
						{selectedColor === DEFAULT_ROLE_COLOR && !isCustoms && (
							<span className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</span>
						)}
					</button>
					<div
						className={`flex-1 md:col-span-2 h-[40px] md:h-[50px] relative inline-block rounded ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
					>
						<input
							type="color"
							ref={colorInputRef}
							value={selectedColor}
							onChange={handleColorChange}
							disabled={isDisabled}
							className="w-full h-full opacity-0 absolute top-0 left-0 cursor-pointer rounded"
						/>
						<div
							className={`w-full h-full rounded ${isDisabled ? 'pointer-events-none' : ''}`}
							style={{ backgroundColor: selectedColor }}
							onClick={handleButtonClick}
						/>
						{selectedColor === colorRole && isCustoms && (
							<span className="absolute inset-0 flex items-center justify-center text-white font-bold pointer-events-none">✓</span>
						)}
						<MezonIcon icon={MzIcons16.mzPalette} className="absolute top-1 right-1 text-black pointer-events-none" />
					</div>
				</div>
				<div className="md:col-span-6 grid grid-cols-7 md:grid-cols-10 gap-2">
					{colorArray.map((color, index) => (
						<button
							key={index}
							className={`w-[24px] h-[24px] md:w-[20px] md:h-[20px] rounded relative ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
							style={{ backgroundColor: color }}
							onClick={() => {
								if (isDisabled) return;
								setSelectedColor(color);
								dispatch(setColorRoleNew(color));
							}}
							disabled={isDisabled}
							data-e2e={generateE2eId('clan_page.settings.role.container.role_color')}
						>
							{selectedColor === color && !isCustoms && (
								<span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">✓</span>
							)}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

export default RoleColor;
