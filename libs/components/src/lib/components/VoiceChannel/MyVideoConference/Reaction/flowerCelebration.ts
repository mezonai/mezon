const MAX_PARTICLES = 420;

const PINK = '#ff6ed4';
const BLUE = '#5cb8ec';
const GOLD = '#ffb600';
const GOLD_RIBBON = '#ffb90c';
const GOLD_DARK = '#e2a100';
const PURPLE = '#7037ff';
const CYAN = '#50deef';
const HOT_PINK = '#ff37b0';
const BOX_RED = '#d33a3a';
const LID_RED = '#ce3737';
const LID_DEPTH = '#b52525';

const FIREWORK_COLORS = ['#1fd7ff', '#ff1f90', '#ff4333', '#008545', PINK, BLUE, GOLD];
const RIBBON_COLORS = [PURPLE, CYAN, HOT_PINK, GOLD, '#1fd7ff', '#ff1f90'];

const BOX_BOUNCE_MS = 350;
const LID_START_MS = 360;
const LID_END_MS = 920;
const BURST_MS = 380;
const WAVE2_MS = 460;
const FLOWER_START_MS = 400;
const FLOWER_END_MS = 780;
const FADE_START_MS = 2000;
const FADE_END_MS = 2600;
const REDUCED_HOLD_MS = 1200;
const REDUCED_FADE_END_MS = 1600;
const LID_LIFT = 220;
const LID_TILT = -0.22;

const CANNON_COUNT = 36;
const BOX_RIBBONS = 14;
const BOX_STARS = 14;
const WAVE2_COUNT = 28;

const BOX_W = 177;
const BOX_H = 129;
const RIBBON_W = 24;
const ISO_DX = 36;
const ISO_DY = -24;
const LID_LIP = 20;

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	gravity: number;
	drag: number;
	size: number;
	color: string;
	shape: 'rect' | 'circle' | 'streamer' | 'ribbon' | 'star' | 'square';
	rotation: number;
	rotSpeed: number;
	life: number;
	decay: number;
	flutter: number;
	flutterSpeed: number;
	length: number;
	amp: number;
	opacity: number;
	pop: number;
	fallGravity: number;
};

type GiftScene = {
	t: number;
	x: number;
	y: number;
	lidLift: number;
	lidRot: number;
	flowerScale: number;
	alpha: number;
	boxScale: number;
	squash: number;
	shadowAlpha: number;
	burstFired: boolean;
	wave2Fired: boolean;
	reducedMotion: boolean;
};

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const easeOutBack = (t: number) => {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const range01 = (t: number, start: number, end: number) => clamp01((t - start) / (end - start));

const pick = <T>(items: T[]) => items[(Math.random() * items.length) | 0];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const fillRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
	ctx.beginPath();
	if (typeof ctx.roundRect === 'function') {
		ctx.roundRect(x, y, w, h, r);
	} else {
		ctx.rect(x, y, w, h);
	}
	ctx.fill();
};

const createGiftScene = (x: number, y: number, reducedMotion: boolean): GiftScene => ({
	t: 0,
	x,
	y,
	lidLift: reducedMotion ? LID_LIFT * 0.45 : 0,
	lidRot: reducedMotion ? LID_TILT * 0.5 : 0,
	flowerScale: reducedMotion ? 1 : 0,
	alpha: 1,
	boxScale: reducedMotion ? 1 : 0.7,
	squash: 1,
	shadowAlpha: reducedMotion ? 0.12 : 0.35,
	burstFired: reducedMotion,
	wave2Fired: reducedMotion,
	reducedMotion
});

const isGiftSceneAlive = (scene: GiftScene | null): scene is GiftScene => !!scene && scene.alpha > 0;

const updateGiftScene = (scene: GiftScene, dtMs: number): { burst: boolean; wave2: boolean } => {
	scene.t += dtMs;

	let burst = false;
	let wave2 = false;

	if (scene.reducedMotion) {
		scene.boxScale = 1;
		scene.squash = 1;
		scene.lidLift = LID_LIFT * 0.45;
		scene.lidRot = LID_TILT * 0.5;
		scene.flowerScale = 1;
		scene.shadowAlpha = 0.12;
		scene.alpha = scene.t < REDUCED_HOLD_MS ? 1 : 1 - range01(scene.t, REDUCED_HOLD_MS, REDUCED_FADE_END_MS);

		return { burst, wave2 };
	}

	if (scene.t < BOX_BOUNCE_MS) {
		const u = clamp01(scene.t / BOX_BOUNCE_MS);

		scene.boxScale = lerp(0.7, 1, easeOutBack(u));
		scene.squash = u < 0.45 ? lerp(0.86, 1.12, u / 0.45) : lerp(1.12, 1, (u - 0.45) / 0.55);
	} else {
		scene.boxScale = 1;
		scene.squash = 1;
	}

	const lidT = range01(scene.t, LID_START_MS, LID_END_MS);

	scene.lidLift = LID_LIFT * easeOutCubic(lidT);
	scene.lidRot = LID_TILT * easeOutCubic(lidT);
	scene.shadowAlpha = lerp(0.35, 0.08, lidT);

	const flowerT = range01(scene.t, FLOWER_START_MS, FLOWER_END_MS);

	scene.flowerScale = flowerT <= 0 ? 0 : easeOutBack(flowerT);
	scene.alpha = scene.t < FADE_START_MS ? 1 : 1 - range01(scene.t, FADE_START_MS, FADE_END_MS);

	if (!scene.burstFired && scene.t >= BURST_MS) {
		scene.burstFired = true;
		burst = true;
	}

	if (!scene.wave2Fired && scene.t >= WAVE2_MS) {
		scene.wave2Fired = true;
		wave2 = true;
	}

	return { burst, wave2 };
};

const drawBow = (ctx: CanvasRenderingContext2D) => {
	ctx.save();
	ctx.scale(1.5, 1.5);

	ctx.fillStyle = GOLD_RIBBON;
	ctx.beginPath();
	ctx.ellipse(-16, -6, 16, 9, -0.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(16, -6, 16, 9, 0.5, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = GOLD_DARK;
	ctx.beginPath();
	ctx.moveTo(-6, 2);
	ctx.quadraticCurveTo(-18, 22, -10, 34);
	ctx.quadraticCurveTo(-2, 18, 0, 8);
	ctx.closePath();
	ctx.fill();
	ctx.beginPath();
	ctx.moveTo(6, 2);
	ctx.quadraticCurveTo(18, 22, 10, 34);
	ctx.quadraticCurveTo(2, 18, 0, 8);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle = GOLD_RIBBON;
	ctx.beginPath();
	ctx.arc(0, -2, 6.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
};

const drawBloom = (
	ctx: CanvasRenderingContext2D,
	petals: { a: number; dx: number; dy: number; rx: number; ry: number; c: string }[],
	centerColor: string
) => {
	for (const petal of petals) {
		ctx.save();
		ctx.translate(petal.dx, petal.dy);
		ctx.rotate(petal.a);
		ctx.fillStyle = petal.c;
		ctx.beginPath();
		ctx.ellipse(0, 0, petal.rx, petal.ry, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	ctx.fillStyle = centerColor;
	ctx.beginPath();
	ctx.arc(0, -5, 5.5, 0, Math.PI * 2);
	ctx.fill();
};

const FACE_RADIUS = 12;

type Pt = { x: number; y: number };

const roundedPoly = (ctx: CanvasRenderingContext2D, pts: Pt[], radius: number) => {
	ctx.beginPath();

	const n = pts.length;

	for (let i = 0; i < n; i++) {
		const prev = pts[(i + n - 1) % n];
		const curr = pts[i];
		const next = pts[(i + 1) % n];
		const dx1 = curr.x - prev.x;
		const dy1 = curr.y - prev.y;
		const dx2 = next.x - curr.x;
		const dy2 = next.y - curr.y;
		const len1 = Math.hypot(dx1, dy1) || 1;
		const len2 = Math.hypot(dx2, dy2) || 1;
		const r = Math.min(radius, len1 / 2, len2 / 2);
		const p1x = curr.x - (dx1 / len1) * r;
		const p1y = curr.y - (dy1 / len1) * r;
		const p2x = curr.x + (dx2 / len2) * r;
		const p2y = curr.y + (dy2 / len2) * r;

		if (i === 0) ctx.moveTo(p1x, p1y);
		else ctx.lineTo(p1x, p1y);

		ctx.quadraticCurveTo(curr.x, curr.y, p2x, p2y);
	}

	ctx.closePath();
};

const fillClosed = (ctx: CanvasRenderingContext2D, color: string) => {
	ctx.fillStyle = color;
	ctx.fill();
};

const pathFrontFace = (ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number) => {
	roundedPoly(
		ctx,
		[
			{ x: left, y: top },
			{ x: left + w, y: top },
			{ x: left + w, y: top + h },
			{ x: left, y: top + h }
		],
		FACE_RADIUS
	);
};

const pathRightFace = (ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number) => {
	roundedPoly(
		ctx,
		[
			{ x: left + w, y: top },
			{ x: left + w + ISO_DX, y: top + ISO_DY },
			{ x: left + w + ISO_DX, y: top + h + ISO_DY },
			{ x: left + w, y: top + h }
		],
		FACE_RADIUS
	);
};

const pathTopFace = (ctx: CanvasRenderingContext2D, left: number, top: number, w: number) => {
	roundedPoly(
		ctx,
		[
			{ x: left, y: top },
			{ x: left + w, y: top },
			{ x: left + w + ISO_DX, y: top + ISO_DY },
			{ x: left + ISO_DX, y: top + ISO_DY }
		],
		FACE_RADIUS
	);
};

const fillFrontFace = (ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number, color: string) => {
	pathFrontFace(ctx, left, top, w, h);
	fillClosed(ctx, color);
};

const fillRightFace = (ctx: CanvasRenderingContext2D, left: number, top: number, w: number, h: number, color: string) => {
	pathRightFace(ctx, left, top, w, h);
	fillClosed(ctx, color);
};

const fillTopFace = (ctx: CanvasRenderingContext2D, left: number, top: number, w: number, color: string) => {
	pathTopFace(ctx, left, top, w);
	fillClosed(ctx, color);
};

const pathRightBand = (ctx: CanvasRenderingContext2D, left: number, y: number, w: number, bandH: number) => {
	ctx.beginPath();
	ctx.moveTo(left + w, y);
	ctx.lineTo(left + w + ISO_DX, y + ISO_DY);
	ctx.lineTo(left + w + ISO_DX, y + bandH + ISO_DY);
	ctx.lineTo(left + w, y + bandH);
	ctx.closePath();
};

const PINK_PALETTE = ['#ff8ad0', '#ff6ed4', '#ff4ec4', '#ff79d4', '#ffb3e4'];
const ORANGE_PALETTE = ['#ffb14a', '#ff8a1a', '#ff9f32', '#ffd18a', '#ff7a00'];
const BEIGE_PALETTE = ['#f4e2c4', '#e6d0a6', '#dcc49a', '#f8edd8', '#c9b089'];

const BLOOMS: { x: number; y: number; s: number; rot: number; palette: string[] }[] = [
	{ x: 0, y: -52, s: 1, rot: -0.04, palette: PINK_PALETTE },
	{ x: -36, y: -40, s: 0.84, rot: -0.38, palette: ORANGE_PALETTE },
	{ x: 38, y: -42, s: 0.86, rot: 0.34, palette: BEIGE_PALETTE },
	{ x: -10, y: -34, s: 0.78, rot: -0.16, palette: ORANGE_PALETTE },
	{ x: 12, y: -32, s: 0.76, rot: 0.14, palette: BEIGE_PALETTE },
	{ x: -52, y: -22, s: 0.72, rot: -0.55, palette: BEIGE_PALETTE },
	{ x: 54, y: -20, s: 0.74, rot: 0.5, palette: ORANGE_PALETTE },
	{ x: -22, y: -14, s: 0.68, rot: -0.3, palette: PINK_PALETTE },
	{ x: 24, y: -12, s: 0.7, rot: 0.32, palette: PINK_PALETTE }
];

const bloomPetals = (palette: string[]) => [
	{ a: -0.35, dx: -10, dy: -6, rx: 13, ry: 17, c: palette[0] },
	{ a: 0.4, dx: 11, dy: -4, rx: 12, ry: 16, c: palette[1] },
	{ a: -0.9, dx: -4, dy: -15, rx: 11, ry: 15, c: palette[2] },
	{ a: 0.95, dx: 5, dy: -14, rx: 11, ry: 15, c: palette[3] },
	{ a: 0.05, dx: 0, dy: -7, rx: 10, ry: 13, c: palette[4] }
];

const bloomSway = (t: number, i: number, amp: number) => {
	if (amp <= 0.01) {
		return { dx: 0, dy: 0, rot: 0 };
	}

	const slow = t * 0.0044 + i * 0.85;
	const fast = t * 0.014 + i * 1.35;

	return {
		dx: (Math.sin(slow) * 4.8 + Math.sin(fast) * 1.8) * amp,
		dy: (Math.cos(slow * 0.9) * 1.6 + Math.sin(fast * 1.1) * 0.7) * amp,
		rot: (Math.sin(slow) * 0.11 + Math.sin(fast) * 0.05) * amp
	};
};

const drawBouquet = (ctx: CanvasRenderingContext2D, scale: number, t: number, reducedMotion: boolean) => {
	if (scale <= 0.01) return;

	ctx.save();
	ctx.scale(scale * 1.5, scale * 1.5);

	const swayAmp = reducedMotion ? 0 : Math.min(1, scale);
	const sways = BLOOMS.map((_, i) => bloomSway(t, i, swayAmp));

	ctx.strokeStyle = '#2f9e4f';
	ctx.lineWidth = 3.5;
	ctx.lineCap = 'round';

	for (let i = 0; i < BLOOMS.length; i++) {
		const bloom = BLOOMS[i];
		const sway = sways[i];

		ctx.beginPath();
		ctx.moveTo(bloom.x * 0.15, 62);
		ctx.quadraticCurveTo(bloom.x * 0.55 + sway.dx * 0.45, 28, bloom.x + sway.dx, bloom.y + 12 + sway.dy);
		ctx.stroke();
	}

	const leafWave = reducedMotion ? 0 : Math.sin(t * 0.006) * 0.12;

	ctx.fillStyle = '#3cb85c';
	ctx.beginPath();
	ctx.ellipse(-18 + sways[1].dx * 0.3, 36, 16, 7, -0.75 + leafWave, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(20 + sways[2].dx * 0.3, 32, 15, 6.5, 0.7 - leafWave, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(-8, 20, 12, 5.5, -0.35 + leafWave * 0.6, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.ellipse(10, 24, 11, 5, 0.4 - leafWave * 0.5, 0, Math.PI * 2);
	ctx.fill();

	for (let i = 0; i < BLOOMS.length; i++) {
		const bloom = BLOOMS[i];
		const sway = sways[i];

		ctx.save();
		ctx.translate(bloom.x + sway.dx, bloom.y + sway.dy);
		ctx.rotate(bloom.rot + sway.rot);
		ctx.scale(bloom.s, bloom.s);
		drawBloom(ctx, bloomPetals(bloom.palette), bloom.palette[1]);
		ctx.restore();
	}

	ctx.restore();
};

const drawBodyRibbon = (ctx: CanvasRenderingContext2D, bodyLeft: number, bodyTop: number) => {
	const bandY = bodyTop + BOX_H * 0.42;
	const mouthPad = 12;

	ctx.fillStyle = GOLD_RIBBON;
	fillRoundRect(ctx, -RIBBON_W / 2, bodyTop + mouthPad, RIBBON_W, BOX_H - mouthPad, 5);
	fillRoundRect(ctx, bodyLeft, bandY, BOX_W, RIBBON_W, 5);
	pathRightBand(ctx, bodyLeft, bandY, BOX_W, RIBBON_W);
	fillClosed(ctx, GOLD_DARK);

	ctx.fillStyle = GOLD_DARK;
	fillRoundRect(ctx, -4, bodyTop + mouthPad, 8, BOX_H - mouthPad, 3);
};

const drawLid = (ctx: CanvasRenderingContext2D, bodyLeft: number, bodyTop: number, lift: number, rot: number) => {
	const lidLeft = bodyLeft - 4;
	const lidW = BOX_W + 8;

	ctx.save();
	ctx.translate(BOX_W / 2 + bodyLeft, bodyTop);
	ctx.rotate(rot);
	ctx.translate(-(BOX_W / 2 + bodyLeft), -bodyTop);
	ctx.translate(0, -lift);

	fillRightFace(ctx, lidLeft, bodyTop - LID_LIP, lidW, LID_LIP, LID_DEPTH);
	fillTopFace(ctx, lidLeft, bodyTop - LID_LIP, lidW, '#e45c5c');
	fillFrontFace(ctx, lidLeft, bodyTop - LID_LIP, lidW, LID_LIP + 3, LID_RED);

	ctx.fillStyle = GOLD_RIBBON;
	fillRoundRect(ctx, -RIBBON_W / 2, bodyTop - LID_LIP, RIBBON_W, LID_LIP + 3, 5);
	ctx.fillStyle = GOLD_DARK;
	fillRoundRect(ctx, -4, bodyTop - LID_LIP, 8, LID_LIP + 3, 3);

	ctx.translate(0, bodyTop - LID_LIP + 8);
	drawBow(ctx);
	ctx.restore();
};

const drawGiftScene = (ctx: CanvasRenderingContext2D, scene: GiftScene) => {
	const { x, y, boxScale, squash, lidLift, lidRot, flowerScale, alpha, shadowAlpha } = scene;

	ctx.save();
	ctx.globalAlpha = Math.max(alpha, 0);
	ctx.translate(x, y);
	ctx.scale(boxScale, boxScale * squash);

	const bodyTop = -BOX_H / 2;
	const bodyLeft = -BOX_W / 2;

	ctx.save();
	ctx.globalAlpha = Math.max(alpha, 0) * shadowAlpha;
	ctx.fillStyle = '#000';
	ctx.beginPath();
	ctx.ellipse(ISO_DX * 0.35, BOX_H / 2 + 16, BOX_W * 0.52, 18, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();

	fillRightFace(ctx, bodyLeft, bodyTop, BOX_W, BOX_H, '#8f1a1a');
	fillTopFace(ctx, bodyLeft, bodyTop, BOX_W, '#6e1414');

	ctx.fillStyle = '#5a1010';
	fillRoundRect(ctx, bodyLeft + 14, bodyTop - 6, BOX_W - 28, 18, 8);

	ctx.save();
	ctx.translate(ISO_DX * 0.5, bodyTop + 22 - flowerScale * 58);
	drawBouquet(ctx, flowerScale, scene.t, scene.reducedMotion);
	ctx.restore();

	fillFrontFace(ctx, bodyLeft, bodyTop, BOX_W, BOX_H, BOX_RED);
	fillFrontFace(ctx, bodyLeft + 12, bodyTop + 16, BOX_W * 0.36, 16, 'rgba(255, 255, 255, 0.14)');

	drawBodyRibbon(ctx, bodyLeft, bodyTop);
	drawLid(ctx, bodyLeft, bodyTop, lidLift, lidRot);

	ctx.restore();
};

const createArcParticle = (
	x: number,
	y: number,
	aim: number,
	shape: Particle['shape'],
	color: string,
	opts?: { opacity?: number; ribbon?: boolean }
): Particle => {
	const spread = opts?.ribbon ? Math.PI * 0.95 : 0.85;
	const dir = aim + (Math.random() - 0.5) * spread;
	const speed = (opts?.ribbon ? 9 : 11) + Math.random() * (opts?.ribbon ? 11 : 15);

	return {
		x,
		y,
		vx: Math.cos(dir) * speed,
		vy: Math.sin(dir) * speed,
		gravity: opts?.ribbon ? 0.18 + Math.random() * 0.08 : 0.36 + Math.random() * 0.1,
		fallGravity: opts?.ribbon ? 0.05 + Math.random() * 0.03 : 0.07 + Math.random() * 0.035,
		drag: opts?.ribbon ? 0.993 : 0.991,
		size: shape === 'streamer' || shape === 'ribbon' ? 4.5 + Math.random() * 2.4 : 7 + Math.random() * 7,
		color,
		shape,
		rotation: Math.random() * Math.PI * 2,
		rotSpeed: (Math.random() - 0.5) * (opts?.ribbon ? 0.12 : 0.5),
		life: 1,
		decay: opts?.ribbon ? 0.0014 + Math.random() * 0.0008 : 0.0015 + Math.random() * 0.0009,
		flutter: Math.random() * Math.PI * 2,
		flutterSpeed: 0.12 + Math.random() * 0.16,
		length: opts?.ribbon ? 72 + Math.random() * 40 : 38 + Math.random() * 22,
		amp: opts?.ribbon ? 14 + Math.random() * 10 : 8 + Math.random() * 8,
		opacity: opts?.opacity ?? (Math.random() < 0.35 ? 0.55 : 1),
		pop: 0
	};
};

const CANNON_SHAPES: Particle['shape'][] = ['circle', 'circle', 'star', 'star', 'rect', 'rect', 'square', 'square', 'streamer'];

const capParticles = (particles: Particle[]) => {
	if (particles.length > MAX_PARTICLES) {
		particles.splice(0, particles.length - MAX_PARTICLES);
	}
};

const spawnCannon = (particles: Particle[], x: number, y: number, aim: number, count: number, opacity?: number) => {
	for (let i = 0; i < count; i++) {
		particles.push(createArcParticle(x, y, aim, pick(CANNON_SHAPES), pick(FIREWORK_COLORS), { opacity }));
	}
};

const spawnAllCannons = (particles: Particle[], x: number, y: number, width: number, height: number, opacity?: number) => {
	spawnCannon(particles, width * 0.88, height * 0.78, -Math.PI / 2 - 0.55, CANNON_COUNT, opacity);
	spawnCannon(particles, width * 0.12, height * 0.78, -Math.PI / 2 + 0.55, CANNON_COUNT, opacity);
	spawnCannon(particles, width * 0.5, height * 0.5, -Math.PI / 2, WAVE2_COUNT, opacity);
	spawnCannon(particles, x, y - 16, -Math.PI / 2, 12, opacity);
};

const spawnMainBurst = (particles: Particle[], x: number, y: number, width: number, height: number) => {
	spawnAllCannons(particles, x, y, width, height);

	for (let i = 0; i < BOX_RIBBONS; i++) {
		particles.push(createArcParticle(x, y - 20, -Math.PI / 2, 'ribbon', pick(RIBBON_COLORS), { ribbon: true }));
	}

	for (let i = 0; i < BOX_STARS; i++) {
		particles.push(createArcParticle(x, y - 24, -Math.PI / 2, 'star', pick(FIREWORK_COLORS)));
	}

	capParticles(particles);
};

const spawnWave2Burst = (particles: Particle[], x: number, y: number, width: number, height: number) => {
	spawnAllCannons(particles, x, y, width, height, 0.55);

	for (let i = 0; i < 8; i++) {
		particles.push(createArcParticle(x, y - 20, -Math.PI / 2, 'ribbon', pick(RIBBON_COLORS), { ribbon: true, opacity: 0.7 }));
	}

	capParticles(particles);
};

const drawStar = (ctx: CanvasRenderingContext2D, outer: number) => {
	const inner = outer * 0.42;

	ctx.beginPath();
	for (let i = 0; i < 10; i++) {
		const r = i % 2 === 0 ? outer : inner;
		const a = (i * Math.PI) / 5 - Math.PI / 2;
		const px = Math.cos(a) * r;
		const py = Math.sin(a) * r;

		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	}
	ctx.closePath();
	ctx.fill();
};

const drawRibbonStroke = (ctx: CanvasRenderingContext2D, p: Particle) => {
	ctx.strokeStyle = p.color;
	ctx.lineWidth = p.size;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.beginPath();

	const half = p.length / 2;
	const wave = Math.sin(p.flutter) * p.amp;
	const wave2 = Math.sin(p.flutter + 1.35) * p.amp * 0.85;

	ctx.moveTo(-half, 0);
	ctx.bezierCurveTo(-half * 0.35, wave, half * 0.2, wave2, half, Math.sin(p.flutter + 2.1) * p.amp * 0.4);
	ctx.stroke();
};

const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, particles: Particle[], height: number) => {
	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i];

		p.pop = Math.min(1, p.pop + 0.08);
		p.vx *= p.drag;
		p.vy *= p.drag;

		if (p.vy < 0) {
			p.vy += p.gravity;
		} else {
			p.vy += p.fallGravity;
			p.vy *= 0.986;
		}
		p.flutter += p.flutterSpeed;

		const flutterX = Math.sin(p.flutter) * (p.shape === 'ribbon' || p.shape === 'streamer' ? 3.2 : 1.2);

		p.x += p.vx + flutterX;
		p.y += p.vy;
		p.rotation += p.rotSpeed;
		p.life -= p.decay;

		if (p.life <= 0 || p.y > height + 80) {
			particles.splice(i, 1);
			continue;
		}

		const age = 1 - p.life;
		const startScale = 0.5 + 0.5 * Math.min(age / 0.12, 1);
		const endScale = p.life < 0.28 ? lerp(0.45, 1, p.life / 0.28) : 1;
		const drawScale = startScale * endScale * p.pop;

		ctx.save();
		ctx.globalAlpha = Math.max(p.life, 0) * p.opacity;
		ctx.translate(p.x, p.y);
		ctx.rotate(p.rotation);
		ctx.scale(drawScale, drawScale);

		if (p.shape === 'ribbon' || p.shape === 'streamer') {
			drawRibbonStroke(ctx, p);
		} else {
			ctx.fillStyle = p.color;

			if (p.shape === 'star') {
				drawStar(ctx, p.size);
			} else if (p.shape === 'circle') {
				ctx.beginPath();
				ctx.arc(0, 0, p.size / 2.1, 0, Math.PI * 2);
				ctx.fill();
			} else if (p.shape === 'square') {
				ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
			} else {
				ctx.fillRect(-p.size * 0.7, -p.size / 3.2, p.size * 1.4, p.size * 0.55);
			}
		}

		ctx.restore();
	}
};

export type FlowerCelebrationPlayOptions = {
	x?: number;
	y?: number;
	reducedMotion?: boolean;
};

export type FlowerCelebrationHandle = {
	play: (options?: FlowerCelebrationPlayOptions) => void;
	stop: () => void;
	destroy: () => void;
	getStats: () => { particles: number; sceneTime: number; playing: boolean };
};

export const attachFlowerCelebration = (canvas: HTMLCanvasElement): FlowerCelebrationHandle => {
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('2d canvas context is unavailable');
	}

	const particles: Particle[] = [];
	let scene: GiftScene | null = null;
	let raf: number | null = null;
	let lastFrame = 0;
	let width = 0;
	let height = 0;
	let destroyed = false;

	const resize = () => {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);

		width = canvas.clientWidth || window.innerWidth;
		height = canvas.clientHeight || window.innerHeight;

		canvas.width = width * dpr;
		canvas.height = height * dpr;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	};

	const start = () => {
		if (raf !== null || destroyed) return;

		lastFrame = 0;
		raf = requestAnimationFrame(animate);
	};

	const animate = (now: number) => {
		if (destroyed) return;

		const dt = lastFrame ? Math.min(now - lastFrame, 32) : 16;

		lastFrame = now;

		const activeScene = scene;

		if (!isGiftSceneAlive(activeScene) && particles.length === 0) {
			raf = null;
			lastFrame = 0;
			scene = null;
			ctx.clearRect(0, 0, width, height);
			return;
		}

		ctx.clearRect(0, 0, width, height);

		if (isGiftSceneAlive(activeScene)) {
			const { burst, wave2 } = updateGiftScene(activeScene, dt);

			if (burst) {
				spawnMainBurst(particles, activeScene.x, activeScene.y, width, height);
			}

			if (wave2) {
				spawnWave2Burst(particles, activeScene.x, activeScene.y, width, height);
			}

			if (activeScene.alpha > 0) {
				drawGiftScene(ctx, activeScene);
			} else {
				scene = null;
			}
		}

		updateAndDrawParticles(ctx, particles, height);

		if (isGiftSceneAlive(scene) || particles.length > 0) {
			raf = requestAnimationFrame(animate);
		} else {
			raf = null;
			lastFrame = 0;
			scene = null;
			ctx.clearRect(0, 0, width, height);
		}
	};

	const play = (options?: FlowerCelebrationPlayOptions) => {
		if (destroyed) return;

		resize();

		const x = options?.x ?? width / 2;
		const y = options?.y ?? height / 2 + 80;

		scene = createGiftScene(x, y, options?.reducedMotion ?? prefersReducedMotion());
		start();
	};

	const stop = () => {
		if (raf !== null) {
			cancelAnimationFrame(raf);
			raf = null;
		}

		lastFrame = 0;
		scene = null;
		particles.length = 0;
		ctx.clearRect(0, 0, width, height);
	};

	const destroy = () => {
		destroyed = true;
		window.removeEventListener('resize', resize);
		stop();
	};

	window.addEventListener('resize', resize);
	resize();

	return {
		play,
		stop,
		destroy,
		getStats: () => ({
			particles: particles.length,
			sceneTime: scene?.t ?? 0,
			playing: raf !== null
		})
	};
};
