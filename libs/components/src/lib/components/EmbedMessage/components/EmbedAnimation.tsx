import { useEffect } from 'react';

type EmbedAnimationProps = {
	url_image?: string;
	url_position?: string;
	pool?: Array<string[]>;
	messageId: string;
	repeat?: number;
	duration?: number;
	vertical?: boolean;
	isResult?: number;
};

export const EmbedAnimation = ({
	url_image,
	url_position,
	pool,
	messageId,
	repeat,
	duration = 2,
	vertical = false,
	isResult
}: EmbedAnimationProps) => {
	useEffect(() => {
		const fetchAnimationData = async () => {
			if (!url_position) {
				return;
			}
			const jsonPosition = (await (await fetch(url_position)).json()) as TDataAnimation;

			pool?.map((poolItem, index) => {
				const style = document.createElement('style');
				if (!isResult) {
					const innerAnimation = makeAnimation(jsonPosition, poolItem).animate;
					style.innerHTML = `

          .box_animation_${index}_${messageId} {
            background-image: url(${url_image});
            animation: animation_embed_${index}_${messageId} ${duration}s steps(1) forwards;
            animation-iteration-count: ${repeat ? repeat : 'infinite'};
            background-repeat : no-repeat;
            width : ${jsonPosition.frames[poolItem[index]].frame.w}px;
            height : ${jsonPosition.frames[poolItem[index]].frame.h}px;
            }

            @keyframes animation_embed_${index}_${messageId} {
              ${innerAnimation}
              }


              `;
				} else {
					style.innerHTML = `

          .box_animation_${index}_${messageId} {
            background-image: url(${url_image});
            background-repeat : no-repeat;
            background-position: -${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.x}px -${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.y}px;
            width : ${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.w}px;
            height : ${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.h}px;
            }
              `;
				}
				const div = document.getElementById(`${messageId}_animation_${index}`);
				div?.appendChild(style);
			});
		};
		fetchAnimationData();
	}, []);

	return (
		<div className={`rounded-md flex gap-2 ${vertical ? 'flex-col' : ''}`}>
			{pool?.map((poolItem, index) => <div id={`${messageId}_animation_${index}`} className={`box_animation_${index}_${messageId}`}></div>)}
		</div>
	);
};
export default EmbedAnimation;

const makeAnimation = (data: TDataAnimation, poolImages: string[]) => {
	const imageNumber = poolImages.length;
	let animate = '';
	poolImages.map((key, index) => {
		const frame = data.frames[key].frame;
		if (!index) {
			animate =
				animate +
				`
      ${index * (100 / imageNumber)}%{
        background-position : -${frame.x}px -${frame.y}px;
        }

        `;
		} else {
			animate =
				animate +
				`${100 - (imageNumber - 1 - index) * (100 / imageNumber)}%{
        background-position : -${frame.x}px -${frame.y}px;
    }
        `;
		}
	});

	return {
		animate: animate
	};
};
type TDataAnimation = {
	frames: {
		[key: string]: {
			frame: {
				x: number;
				y: number;
				w: number;
				h: number;
			};
			rotated: boolean;
			trimmed: boolean;
			spriteSourceSize: {
				x: number;
				y: number;
				w: number;
				h: number;
			};
			sourceSize: {
				w: number;
				h: number;
			};
		};
	};
	meta: {
		app: string;
		version: string;
		image: string;
		format: string;
		size: {
			w: number;
			h: number;
		};
		scale: string;
	};
};
