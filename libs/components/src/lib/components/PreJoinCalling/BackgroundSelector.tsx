import { memo } from 'react';
import { VIRTUAL_BACKGROUNDS, type BackgroundMode } from './mediaPipeBackground';

interface BackgroundSelectorProps {
	selectedMode: BackgroundMode;
	onSelectMode: (mode: BackgroundMode) => void;
	disabled?: boolean;
}

export const BackgroundSelector = memo(({ selectedMode, onSelectMode, disabled = false }: BackgroundSelectorProps) => {
	return (
		<div className="w-full flex flex-col gap-2 my-3">
			<div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
				<span>Virtual Background</span>
				<span className="text-[11px] text-zinc-500">Google MediaPipe</span>
			</div>
			<div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
				{VIRTUAL_BACKGROUNDS.map((bg) => {
					const isSelected = selectedMode === bg.id;
					const isNone = bg.id === 'none';

					return (
						<button
							key={bg.id}
							type="button"
							onClick={() => onSelectMode(bg.id)}
							disabled={disabled}
							title={bg.label}
							className={`group relative flex flex-col items-center justify-center rounded-lg overflow-hidden border transition-all aspect-video ${
								isSelected
									? 'border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20 scale-[1.02]'
									: 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:brightness-105'
							} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
						>
							{isNone ? (
								<div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400">
									<span role="img" aria-label="none" className="text-xl select-none mb-0.5">
										🚫
									</span>
									<span className="text-[11px] font-medium leading-tight">None</span>
								</div>
							) : (
								<>
									<img src={bg.url} alt={bg.label} className="w-full h-full object-cover" loading="lazy" crossOrigin="anonymous" />
									<div className="absolute inset-0 bg-black/15 group-hover:bg-black/0 transition-colors" />
									<span className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs text-[10px] text-white py-0.5 px-1 truncate text-center font-medium">
										{bg.label}
									</span>
								</>
							)}

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
