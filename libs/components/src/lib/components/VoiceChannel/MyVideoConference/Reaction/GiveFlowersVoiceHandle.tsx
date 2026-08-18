import { EVoiceInteractEvent, selectCurrentUserId, selectMemberClanByUserId, selectVoiceInfo, useAppSelector } from '@mezon/store';
import { useMezon } from '@mezon/transport';
import type { VoiceInteractiveEvent } from 'mezon-js';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

const MAX_PARTICLES = 150;

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	gravity: number;
	drag: number;
	size: number;
	color: string;
	shape: 'rect' | 'circle' | 'streamer';
	rotation: number;
	rotSpeed: number;
	life: number;
	decay: number;
	flutter: number;
	flutterSpeed: number;
};

const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff9e00', '#f72585', '#4cc9f0'];
const SENDER_DISPLAY_MS = 1500;
export const GiveFlowersVoiceHandle = memo(() => {
	const [currentSender, setCurrentSender] = useState<VoiceInteractiveEvent | null>(null);

	const senderQueueRef = useRef<VoiceInteractiveEvent[]>([]);
	const senderTimeoutRef = useRef<number | null>(null);
	const isShowingSenderRef = useRef(false);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const particlesRef = useRef<Particle[]>([]);
	const animationRef = useRef<number | null>(null);

	const { clientRef } = useMezon();
	const voiceInfo = useSelector(selectVoiceInfo);
	const channelId = voiceInfo?.channelId;

	const showNextSender = useCallback(() => {
		if (isShowingSenderRef.current) return;

		const event = senderQueueRef.current.shift();

		if (!event) {
			setCurrentSender(null);
			return;
		}

		isShowingSenderRef.current = true;
		setCurrentSender(event);

		senderTimeoutRef.current = window.setTimeout(() => {
			senderTimeoutRef.current = null;
			isShowingSenderRef.current = false;
			setCurrentSender(null);

			showNextSender();
		}, 2000);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) return;

		const ctx = canvas.getContext('2d');

		if (!ctx) return;

		let width = 0;
		let height = 0;

		const resize = () => {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);

			width = window.innerWidth;
			height = window.innerHeight;

			canvas.width = width * dpr;
			canvas.height = height * dpr;

			canvas.style.width = `${width}px`;
			canvas.style.height = `${height}px`;

			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};

		resize();

		window.addEventListener('resize', resize);

		const createParticle = (x: number, y: number, big = false): Particle => {
			const angle = -Math.PI / 2;
			const spread = Math.PI * 0.9;

			const dir = angle + (Math.random() - 0.5) * spread;

			const speed = (big ? 10 : 6) + Math.random() * (big ? 20 : 14);

			return {
				x,
				y,

				vx: Math.cos(dir) * speed,

				vy: Math.sin(dir) * speed - (big ? 8 : 5),

				gravity: 0.28 + Math.random() * 0.1,

				drag: 0.985,

				size: 5 + Math.random() * 6,

				color: COLORS[(Math.random() * COLORS.length) | 0],

				shape: ['rect', 'circle', 'streamer'][(Math.random() * 3) | 0] as Particle['shape'],

				rotation: Math.random() * Math.PI * 2,

				rotSpeed: (Math.random() - 0.5) * 0.3,

				life: 1,

				decay: 0.004 + Math.random() * 0.006,

				flutter: Math.random() * Math.PI * 2,

				flutterSpeed: 0.1 + Math.random() * 0.15
			};
		};

		const pop = (x: number, y: number, count = 60, big = false) => {
			const n = big ? count * 2 : count;

			const particles = particlesRef.current;

			for (let i = 0; i < n; i++) {
				particles.push(createParticle(x, y, big));
			}

			if (particles.length > MAX_PARTICLES) {
				particles.splice(0, particles.length - MAX_PARTICLES);
			}

			startAnimation();
		};

		const startAnimation = () => {
			if (animationRef.current !== null) return;

			animationRef.current = requestAnimationFrame(animate);
		};

		const animate = () => {
			const particles = particlesRef.current;

			if (particles.length === 0) {
				animationRef.current = null;
				ctx.clearRect(0, 0, width, height);
				return;
			}

			ctx.clearRect(0, 0, width, height);

			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i];

				p.vx *= p.drag;
				p.vy *= p.drag;

				p.vy += p.gravity;

				p.flutter += p.flutterSpeed;

				const flutterX = Math.sin(p.flutter) * 1.5;

				p.x += p.vx + flutterX;
				p.y += p.vy;

				p.rotation += p.rotSpeed;
				p.life -= p.decay;

				if (p.life <= 0 || p.y > height + 50) {
					particles.splice(i, 1);
					continue;
				}

				ctx.save();

				ctx.globalAlpha = Math.max(p.life, 0);

				ctx.translate(p.x, p.y);
				ctx.rotate(p.rotation);

				ctx.fillStyle = p.color;

				if (p.shape === 'rect') {
					ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
				} else if (p.shape === 'circle') {
					ctx.beginPath();
					ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
					ctx.fill();
				} else {
					ctx.fillRect(-p.size * 1.4, -1.5, p.size * 2.8, 3);
				}

				ctx.restore();
			}

			if (particles.length > 0) {
				animationRef.current = requestAnimationFrame(animate);
			} else {
				animationRef.current = null;
			}
		};

		const currentSocket = clientRef.current;

		if (!currentSocket || !channelId) {
			return () => {
				window.removeEventListener('resize', resize);

				if (animationRef.current) {
					cancelAnimationFrame(animationRef.current);
				}
			};
		}

		currentSocket.onvoiceinteractiveevent = (event: VoiceInteractiveEvent) => {
			if (event.voice_channel_id !== channelId && event.event_type !== EVoiceInteractEvent.SENT_FLOWERS) {
				return;
			}

			const x = window.innerWidth / 2;
			const y = window.innerHeight / 2 + 160;

			pop(x, y, 60, true);
			senderQueueRef.current.push(event);
			showNextSender();
		};

		return () => {
			window.removeEventListener('resize', resize);

			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
				animationRef.current = null;
			}

			if (senderTimeoutRef.current !== null) {
				clearTimeout(senderTimeoutRef.current);
				senderTimeoutRef.current = null;
			}

			senderQueueRef.current = [];
			isShowingSenderRef.current = false;

			if (currentSocket?.onvoiceinteractiveevent) {
				currentSocket.onvoiceinteractiveevent = () => {};
			}

			particlesRef.current = [];
		};
	}, [clientRef, channelId, showNextSender]);

	return (
		<div className="pointer-events-none fixed inset-0 z-[999999]">
			<canvas ref={canvasRef} />

			{currentSender && (
				<div
					className="
					pointer-events-none
					fixed
					left-1/2
					bottom-[70px]
					z-[1000000]"
				>
					<div
						className="
						rounded-full
						bg-black
						px-3
						py-2
						text-sm
						text-white
						shadow-[0_4px_12px_rgba(255,255,255,0.3)]
						w-full
					"
					>
						<FlowerDetail event={currentSender} />
					</div>
				</div>
			)}
		</div>
	);
});

const FlowerDetail = ({ event }: { event: VoiceInteractiveEvent }) => {
	const { t } = useTranslation('token');
	const currentUserId = useAppSelector((state) => selectCurrentUserId(state));

	const sender = useAppSelector((state) => selectMemberClanByUserId(state, event.sender_id));
	const receiver = useAppSelector((state) => selectMemberClanByUserId(state, event.receiver_id));

	if (currentUserId === receiver?.id) {
		return (
			<div className="flex gap-1">
				<p>{t('flowers.received')}</p>
				{sender?.clan_nick || sender?.prioritizeName || sender?.user?.display_name || sender?.user?.username}
			</div>
		);
	}

	return (
		<div className="flex gap-1">
			{sender?.clan_nick || sender?.prioritizeName || sender?.user?.display_name || sender?.user?.username}
			<p>{t('flowers.someoneReceived')}</p>
			{receiver?.clan_nick || receiver?.prioritizeName || receiver?.user?.display_name || receiver?.user?.username}
		</div>
	);
};
