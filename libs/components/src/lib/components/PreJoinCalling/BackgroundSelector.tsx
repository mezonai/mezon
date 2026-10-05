import { memo } from 'react';
import { VIRTUAL_BACKGROUNDS, type BackgroundMode } from './mediaPipeBackground';

interface BackgroundSelectorProps {
	selectedMode: BackgroundMode;
	onSelectMode: (mode: BackgroundMode) => void;
	disabled?: boolean;
}

export const BackgroundSelector = memo(({ selectedMode, onSelectMode, disabled = false }: BackgroundSelectorProps) => {
	return (
		<div className="w-full flex flex-col gap-2 my-2">
			<div className="grid grid-cols-5 gap-2.5">
				{VIRTUAL_BACKGROUNDS.map((bg) => {
					const isSelected = selectedMode === bg.id;

					return (
						<button
							key={bg.id}
							type="button"
							onClick={() => onSelectMode(bg.id)}
							disabled={disabled}
							className={`group relative flex flex-col items-center justify-center rounded-lg overflow-hidden border transition-all aspect-video ${
								isSelected
									? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20 scale-[1.02]'
									: 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:brightness-105'
							} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
						>
							<img src={bg.url} alt="" className="w-full h-full object-cover pointer-events-none" loading="lazy" />
							<div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />

							{/* Active badge */}
							{isSelected && (
								<div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center shadow">
									<svg className="w-2.5 h-2.5 text-white stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3">
										<path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
});

export default BackgroundSelector;
