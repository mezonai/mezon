import { Session, SessionRefreshRequest } from 'mezon-js-protobuf';
import { socketState } from './socketState';

export type HealthyEndpointPayload = {
	api_url?: string;
	ws_url?: string;
	tcp_url?: string;
	session_id?: string;
	user_id?: string;
};

/**
 * What asking the gateway for a healthy node ended up doing.
 * `rejected` is the only answer that proves the session itself is gone — the gateway refused the
 * credential and the api refused the refresh token. `renewed` means the session id was dead but there
 * is a working credential again (a fresh session id, or at least a fresh JWT the socket can lead with):
 * retry right away. `unreachable` means we never got an answer at all, which is what "no internet"
 * looks like. Everything else means the session is fine and only the node is in trouble.
 */
export type HealthyEndpointResult = 'changed' | 'renewed' | 'same' | 'skipped' | 'failed' | 'rejected' | 'unreachable';

// Every answer mints a new session id on the gateway (10 slots per user), so asking too often
// can evict this user's other devices. Ask at most this often, and back off after a failure.
// A socket that cannot connect is often the user's own network (a slow link, a laptop waking up),
// not a bad node, and the gateway mints a session id for every answer. So the gap between asks
// doubles while an outage lasts instead of staying at a flat rate.
const MIN_INTERVAL_MS = 15000;
const MAX_INTERVAL_MS = 60000;
const FAILURE_BACKOFF_MS = 60000;
const REQUEST_TIMEOUT_MS = 8000;
// The paths that ignore the throttle (we are about to log the user out) repeat for as long as the
// outage lasts, so they get a budget instead: enough to find a live node, not enough to churn
// through the user's ten gateway session slots. Reset once a socket has stayed up.
const MAX_FORCED_ASKS_PER_OUTAGE = 3;
// Even the paths that ignore the throttle keep a floor between asks: bootstrap, the streak handler
// and the wave can all decide to ask within the same second, and each answer costs a session slot.
const MIN_GAP_BETWEEN_ASKS_MS = 5000;
// An ask chains at most a few 8s requests; one still marked in flight long after that died without
// clearing the mark, and must not shut every later ask out.
const STALE_ASK_MS = 90000;

// mezon-js watches how long its own requests take and fires this when the fast rate drops below
// 95% over a 60-request window. Desktop reacts to the same kind of signal, with two guards so a
// user's own bad link is not mistaken for a bad node: only once we have been on the node long
// enough to judge it, and at most once every couple of minutes.
export const CHECK_HEALTHY_EVENT = 'CHECK_HEALTHY';
const SETTLED_ON_NODE_MS = 120000;
const SLOW_REPORT_COOLDOWN_MS = 120000;
// The gateway's last answer is kept beside the session, so a reload or another tab opened while the node is
// still down checks the session id instead of having the gateway mint one more.
const GATEWAY_ANSWERED_KEY = 'mezon_gateway_answered_at';
const GATEWAY_ANSWER_MEMORY_MS = 5 * 60 * 1000;

let nextAllowedAt = 0;
let lastAskAt = 0;
let nextInterval = MIN_INTERVAL_MS;
let forcedAsks = 0;
let asking = false;
let gatewayAnswered = false;
let connectedSince = 0;
let slowReportsDisabled = false;
let slowSuppressedUntil = 0;

function connectionSettled(now: number): boolean {
	return connectedSince !== 0 && now - connectedSince >= SETTLED_ON_NODE_MS;
}

export function noteSocketConnected(now: number = Date.now()): void {
	connectedSince = now;
	slowReportsDisabled = false;
	slowSuppressedUntil = 0;
}

// Only a connection that held ends the outage. One that drops within moments is the same outage going on,
// or every flap of a bad link would start a fresh budget and ask the gateway — minting a session id —
// all over again.
export function noteSocketDisconnected(now: number = Date.now()): void {
	if (connectionSettled(now)) {
		resetHealthyEndpointThrottle();
	}
	connectedSince = 0;
}

/**
 * The gateway names the node from a fixed map (the user's country, and the node the client says it is on),
 * so once it has answered during an outage, asking it again names the same node and mints one more session
 * id. Until a connection settles, later asks only check that the session id still holds.
 */
export function gatewayAnsweredThisOutage(now: number = Date.now()): boolean {
	if (connectionSettled(now)) {
		return false;
	}
	return gatewayAnswered || gatewayAnsweredRecently(now);
}

export function noteGatewayAnswered(now: number = Date.now()): void {
	gatewayAnswered = true;
	try {
		localStorage.setItem(GATEWAY_ANSWERED_KEY, String(now));
	} catch {
		// Without storage a reload asks the gateway again, as it always did.
	}
}

function gatewayAnsweredRecently(now: number): boolean {
	try {
		const at = Number(localStorage.getItem(GATEWAY_ANSWERED_KEY));
		return at > 0 && at <= now && now - at < GATEWAY_ANSWER_MEMORY_MS;
	} catch {
		return false;
	}
}

function forgetGatewayAnswer(): void {
	try {
		localStorage.removeItem(GATEWAY_ANSWERED_KEY);
	} catch {
		// Nothing was stored.
	}
}

/** True at most once per cooldown, and only once this node has had time to prove itself. */
export function shouldReportSlowNode(now: number = Date.now()): boolean {
	if (slowReportsDisabled || !connectedSince) {
		return false;
	}
	if (now - connectedSince < SETTLED_ON_NODE_MS || now < slowSuppressedUntil) {
		return false;
	}
	slowSuppressedUntil = now + SLOW_REPORT_COOLDOWN_MS;
	return true;
}

/** The gateway will not move us off this node, so stop asking it about how slow the node is. */
export function disableSlowReports(): void {
	slowReportsDisabled = true;
}

export function canAskHealthyEndpoint(force = false, now: number = Date.now()): boolean {
	if ((asking && now - lastAskAt < STALE_ASK_MS) || now - lastAskAt < MIN_GAP_BETWEEN_ASKS_MS) {
		return false;
	}
	return force ? forcedAsks < MAX_FORCED_ASKS_PER_OUTAGE : now >= nextAllowedAt;
}

export function beginHealthyEndpointAsk(force: boolean, now: number = Date.now()): void {
	asking = true;
	lastAskAt = now;
	if (force) {
		forcedAsks += 1;
	}
}

export function noteHealthyEndpointAsked(failed: boolean, now: number = Date.now()): void {
	asking = false;
	if (failed) {
		nextAllowedAt = now + FAILURE_BACKOFF_MS;
		nextInterval = MAX_INTERVAL_MS;
		return;
	}
	nextAllowedAt = now + nextInterval;
	nextInterval = Math.min(nextInterval * 2, MAX_INTERVAL_MS);
}

/** A socket that stayed up ends the outage: ask freely again the next time one goes down. */
export function resetHealthyEndpointThrottle(): void {
	nextAllowedAt = 0;
	lastAskAt = 0;
	nextInterval = MIN_INTERVAL_MS;
	forcedAsks = 0;
	asking = false;
	gatewayAnswered = false;
	forgetGatewayAnswer();
}

// Keep the "how long have we been on this node" clock honest without every connect path having to
// remember to say so.
socketState.subscribe((status) => {
	if (status === 'connected') {
		noteSocketConnected();
	} else {
		noteSocketDisconnected();
	}
});

export type HealthyEndpointResponse = { status: number; payload: HealthyEndpointPayload | null };

// Every call here is on the path back from a dead socket, so none may hang it: the whole exchange,
// body included, gets the same deadline.
async function requestWithTimeout<T>(url: string, init: RequestInit, read: (response: Response) => Promise<T>): Promise<T> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		return await read(await fetch(url, { ...init, signal: controller.signal }));
	} finally {
		clearTimeout(timeout);
	}
}

export async function fetchHealthyEndpoint(basePath: string, credential: string): Promise<HealthyEndpointResponse> {
	try {
		return await requestWithTimeout(
			`${basePath}/v2/healthy/endpoint`,
			{ method: 'GET', headers: { Authorization: `Bearer ${credential}` } },
			async (response) => {
				if (!response.ok) {
					console.error('[healthyEndpoint] gateway answered', response.status);
					return { status: response.status, payload: null };
				}
				try {
					return { status: response.status, payload: (await response.json()) as HealthyEndpointPayload };
				} catch (error) {
					// The gateway (or something standing in for it) answered, it just was not JSON. That is
					// not the network being down.
					console.error('[healthyEndpoint] could not read the answer', error);
					return { status: response.status, payload: null };
				}
			}
		);
	} catch (error) {
		console.error('[healthyEndpoint] request failed', error);
		return { status: 0, payload: null };
	}
}

// The server's clock decides, so a JWT about to expire by ours is treated as already gone.
const JWT_EXPIRY_MARGIN_S = 60;
// Prod issues refresh tokens for thirty days; rotating inside the last week leaves plenty of page
// loads to catch it while costing nothing the rest of the month (desktop uses the same window).
const REFRESH_TOKEN_ROTATE_WITHIN_S = 7 * 24 * 60 * 60;

function jwtExpiresAt(token: string): number | null {
	try {
		const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
		return typeof claims.exp === 'number' ? claims.exp : null;
	} catch {
		return null;
	}
}

export function isJwtExpired(token: string, now: number = Date.now()): boolean {
	const exp = jwtExpiresAt(token);
	return exp === null || exp - JWT_EXPIRY_MARGIN_S <= now / 1000;
}

/** An unreadable refresh token rotates too: one needless call beats a session that quietly expires. */
export function refreshTokenNeedsRotation(refreshToken: string, now: number = Date.now()): boolean {
	const exp = jwtExpiresAt(refreshToken);
	return exp === null || exp - REFRESH_TOKEN_ROTATE_WITHIN_S <= now / 1000;
}

/**
 * Whether the api turned the refresh token down, as opposed to being unable to answer. It reports an
 * invalid or expired refresh token as 500 (codes.Internal), so that one counts as a refusal; a timeout,
 * 408, 429 or a 502/503/504 from the proxy says nothing about the session.
 */
export function isRefreshRefused(status: number): boolean {
	return status === 400 || status === 401 || status === 403 || status === 500;
}

export type CredentialProbe = 'alive' | 'rejected' | 'inconclusive';

// GetAccount takes a session id or a JWT as its bearer and, unlike the gateway, mints nothing in return,
// so it can tell a dead session id from a dead node without costing the user one of their ten slots.
export async function probeCredential(apiUrl: string, credential: string): Promise<CredentialProbe> {
	try {
		return await requestWithTimeout(
			`${apiUrl.replace(/\/+$/, '')}/mezon.api.Mezon/GetAccount`,
			{
				method: 'POST',
				headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/proto', Accept: 'application/proto' }
			},
			async (response) => {
				if (response.ok) {
					return 'alive';
				}
				return response.status === 401 || response.status === 403 ? 'rejected' : 'inconclusive';
			}
		);
	} catch (error) {
		console.error('[sessionProbe] request failed', error);
		return 'inconclusive';
	}
}

export type RenewedTokens = { token: string; refresh_token: string };
export type SessionRefreshResponse = { status: number; tokens: RenewedTokens | null };

// The JWT lives ten minutes and nothing renews it while the socket is up, so once the gateway retires
// the session id (every login and every healthy-endpoint answer, on any of the user's devices, mints
// one, and with all ten slots taken each mint evicts a random one) the refresh token is the only
// credential left. mezon-js only sends SessionRefresh over the socket, which is the thing that is down
// here, so this goes over plain HTTP like desktop's fallback does.
export async function fetchSessionRefresh(
	apiUrl: string,
	serverKey: string,
	refreshToken: string,
	isRemember: boolean
): Promise<SessionRefreshResponse> {
	try {
		const body = SessionRefreshRequest.encode(SessionRefreshRequest.fromPartial({ token: refreshToken, is_remember: isRemember })).finish();
		return await requestWithTimeout(
			`${apiUrl.replace(/\/+$/, '')}/mezon.api.Mezon/SessionRefresh`,
			{
				method: 'POST',
				headers: { Authorization: `Basic ${btoa(`${serverKey}:`)}`, 'Content-Type': 'application/proto', Accept: 'application/proto' },
				body
			},
			async (response) => {
				if (!response.ok) {
					console.error('[sessionRefresh] api answered', response.status);
					return { status: response.status, tokens: null };
				}
				const session = Session.decode(new Uint8Array(await response.arrayBuffer()));
				if (!session.token) {
					console.error('[sessionRefresh] api answered without a token');
					return { status: response.status, tokens: null };
				}
				return { status: response.status, tokens: { token: session.token, refresh_token: session.refresh_token || refreshToken } };
			}
		);
	} catch (error) {
		console.error('[sessionRefresh] request failed', error);
		return { status: 0, tokens: null };
	}
}
