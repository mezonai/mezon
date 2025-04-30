import { useEffect } from 'react';

type EmbedAnimationProps = {
	url_image?: string;
	url_position?: string;
	pool?: Array<string[]>;
	messageId: string;
	repeat?: number;
	duration?: number;
};

export const EmbedAnimation = ({ url_image, url_position, pool, messageId, repeat, duration = 2 }: EmbedAnimationProps) => {
	useEffect(() => {
		const fetchAnimationData = async () => {
			if (!url_position) {
				return;
			}
			const jsonPosition = await (await fetch(url_position)).json();

			pool?.map((poolItem, index) => {
				const style = document.createElement('style');
				const innerAnimation = makeAnimation(jsonPosition, poolItem).animate;
				style.innerHTML = `

        .box_animation_${index} {
          background-image: url(${url_image});
          animation: animation_embed_${index} ${duration}s steps(1) forwards;
          animation-iteration-count: ${repeat ? repeat : 'infinite'};
          background-repeat : no-repeat;
          }

          @keyframes animation_embed_${index} {
            ${innerAnimation}
            }


            `;
				const div = document.getElementById(`${messageId}_animation_${index}`);
				div?.appendChild(style);
			});
		};
		fetchAnimationData();
	}, []);

	return (
		<div className="rounded-md bg-white">
			{pool?.map((poolItem, index) => (
				<div id={`${messageId}_animation_${index}`} className={`w-[230px] h-[160px] box_animation_${index}`}></div>
			))}
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
