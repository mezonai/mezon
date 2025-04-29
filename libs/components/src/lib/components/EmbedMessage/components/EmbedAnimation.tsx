import { useEffect } from 'react';

type EmbedAnimationProps = {
	url_image?: string;
	url_position?: string;
};

export const EmbedAnimation = ({ url_image, url_position }: EmbedAnimationProps) => {
	useEffect(() => {
		const fetchAnimationData = async () => {
			if (!url_position) {
				return;
			}
			const jsonPosition = await (await fetch(url_position)).json();
			const style = document.createElement('style');
			const innerAnimation = makeAnimation(jsonPosition).animate;
			style.innerHTML = `

      .box_animation {
        background-image: url(${url_image});
        animation: slot_machine 2s steps(1) fowards;
        }

        @keyframes slot_machine {
          ${innerAnimation}
          }


          `;

			const div = document.getElementById('box_animation');
			div?.appendChild(style);
		};
		fetchAnimationData();
	}, []);

	return (
		<div className="rounded-md bg-white">
			<div id="box_animation" className="w-32 h-32 box_animation"></div>
		</div>
	);
};
export default EmbedAnimation;

const makeAnimation = (data: TDataAnimation) => {
	const imageNumber = Object.keys(data.frames).length;
	let animate = '';
	Object.keys(data.frames).map((value, index) => {
		const frame = data.frames[value].frame;
		if (!index) {
			animate =
				animate +
				`
      ${index * (100 / imageNumber)}%{
        background-position : ${frame.x}px ${frame.y}px;
        }
        100%{
        background-position : ${frame.x}px ${frame.y}px;
        }
        `;
		} else {
			animate =
				animate +
				`${index * (100 / imageNumber)}%{
        background-position : ${frame.x}px ${frame.y}px;
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
