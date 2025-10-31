import { useIsIntersecting, type ObserveFn } from '@mezon/utils';
import { useEffect, useRef } from 'react';

type EmbedAnimationProps = {
	url_image?: string;
	url_position?: string;
	pool?: Array<string[]>;
	messageId: string;
	repeat?: number;
	duration?: number;
	vertical?: boolean;
	isResult?: number;
	channelId: string;
	observeIntersectionForLoading?: ObserveFn;
};
const BREAK_POINT_RESPONSIVE = 1200;
const DEFAULT_HEIGH = 133;
const DEFAULT_WIDTH = 133;
const WIDTH_BOX_ANIMATION_SMALL = 80;
const HEIGH_BOX_ANIMATION_SMALL = 80;
export const EmbedAnimation = ({
	url_image,
	url_position,
	pool,
	messageId,
	repeat,
	duration = 2,
	vertical = false,
	isResult,
	channelId,
	observeIntersectionForLoading
}: EmbedAnimationProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const isIntersecting = useIsIntersecting(ref, observeIntersectionForLoading);

	useEffect(() => {
		const fetchAnimationData = async () => {
			if (!url_position) {
				return;
			}
			const jsonPosition = (await (await fetch(url_position)).json()) as TDataAnimation;

			pool?.map((poolItem, index) => {
				const style = document.createElement('style');
				const widthItem = jsonPosition.frames[poolItem[0]].frame.w;
				const heightItem = jsonPosition.frames[poolItem[0]].frame.h;
				const defaultSizeBig = widthItem < heightItem ? DEFAULT_WIDTH : DEFAULT_HEIGH;
				const defaultSizeSmall = widthItem < heightItem ? WIDTH_BOX_ANIMATION_SMALL : HEIGH_BOX_ANIMATION_SMALL;
				const boxSize = (ref.current?.offsetWidth || 0) > defaultSizeBig * pool.length ? defaultSizeBig : defaultSizeSmall;
				const ratioWidthBig = boxSize / (widthItem < heightItem ? widthItem : heightItem);

				const ratioWidthSmall = widthItem < heightItem ? WIDTH_BOX_ANIMATION_SMALL / widthItem : HEIGH_BOX_ANIMATION_SMALL / heightItem;

				if (!isResult) {
					const innerAnimationBig = makeAnimation(jsonPosition, poolItem, ratioWidthBig).animate;
					const innerAnimationSmall = makeAnimation(jsonPosition, poolItem, ratioWidthSmall).animate;
					style.innerHTML = `

          .box_animation_${index}_${messageId} {
            background-image: url(${url_image});
            animation: animation_embed_${index}_${messageId} ${duration}s steps(1) forwards;
            animation-iteration-count: ${repeat ? repeat : 'infinite'};
            background-repeat : no-repeat;
            width : ${DEFAULT_HEIGH * ratioWidthBig}px !important;
            height : ${DEFAULT_WIDTH * ratioWidthBig}px !important;
            background-size: ${jsonPosition.meta.size.w * ratioWidthBig}px ${jsonPosition.meta.size.h * ratioWidthBig}px;
            }

            @keyframes animation_embed_${index}_${messageId} {
              ${innerAnimationBig}
            }

            @keyframes animation_embed_${index}_${messageId}_small {
              ${innerAnimationSmall}
            }

            @media (max-width: ${BREAK_POINT_RESPONSIVE}px) {
              .box_resize_${index}_${messageId}{
                width : ${widthItem * ratioWidthSmall}px !important;
                height : ${heightItem * ratioWidthSmall}px !important;
                background-size: ${jsonPosition.meta.size.w * ratioWidthSmall}px ${jsonPosition.meta.size.h * ratioWidthSmall}px;
                }
                .box_animation_${index}_${messageId}{
                animation: animation_embed_${index}_${messageId}_small ${duration}s steps(1) forwards;
                animation-iteration-count: ${repeat ? repeat : 'infinite'};

                }
            }
              `;
				} else {
					style.innerHTML = `

          .box_animation_${index}_${messageId} {
            background-image: url(${url_image});
            background-repeat : no-repeat;
            background-position: -${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.x * ratioWidthBig}px -${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.y * ratioWidthBig}px;
            background-size: ${jsonPosition.meta.size.w * ratioWidthBig}px ${jsonPosition.meta.size.h * ratioWidthBig}px;
            width : ${DEFAULT_HEIGH * ratioWidthBig}px !important;
            height : ${DEFAULT_WIDTH * ratioWidthBig}px !important;
            }
              @media (max-width: ${BREAK_POINT_RESPONSIVE}px) {
              .box_resize_${index}_${messageId}{
                width : ${WIDTH_BOX_ANIMATION_SMALL}px !important;
                height : ${(WIDTH_BOX_ANIMATION_SMALL * heightItem) / widthItem}px !important;
                 background-size: ${(jsonPosition.meta.size.w / widthItem) * WIDTH_BOX_ANIMATION_SMALL}px ${(jsonPosition.meta.size.h * WIDTH_BOX_ANIMATION_SMALL) / widthItem}px;
                   background-position: -${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.x * ratioWidthSmall}px -${jsonPosition.frames[poolItem[poolItem.length - 1]].frame.y * ratioWidthSmall}px;
                 }
            }
              `;
				}
				const div = document.getElementById(`${messageId}_animation_${index}`);

				div?.appendChild(style);
			});
		};
		if (isIntersecting && !ref.current?.firstChild?.hasChildNodes()) {
			fetchAnimationData();
		}
	}, [isIntersecting]);

	return (
		<div ref={ref} id={`${messageId}_wrap_animation`} className={`rounded-md flex gap-2 ${vertical ? 'flex-col' : ''}`}>
			{!Array.isArray(pool) || !pool
				? null
				: pool?.map((poolItem, index) => (
						<div
							key={`${messageId}_animation_${index}`}
							id={`${messageId}_animation_${index}`}
							className={`h-[133px] w-[133px] box_animation_${index}_${messageId} box_resize_${index}_${messageId}`}
						></div>
					))}
		</div>
	);
};
export default EmbedAnimation;

const makeAnimation = (data: TDataAnimation, poolImages: string[], ratio?: number) => {
	const imageNumber = poolImages.length;
	const ratioPotion = ratio ? ratio : 1;
	let animate = '';
	poolImages.map((key, index) => {
		const frame = data.frames[key].frame;
		if (!index) {
			animate = `${animate}
      ${index * (100 / imageNumber)}%{
        background-position : -${frame.x * ratioPotion}px -${frame.y * ratioPotion}px;
        }

        `;
		} else {
			animate = `${animate}${100 - (imageNumber - 1 - index) * (100 / imageNumber)}%{
        background-position : -${frame.x * ratioPotion}px -${frame.y * ratioPotion}px;
    }
        `;
		}
	});

	return {
		animate
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
