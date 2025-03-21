/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/**
 * Skipped minification because the original files appears to be already minified.
 * Original file: /npm/blurhash@2.0.5/dist/index.js
 *
 * Do NOT use SRI with dynamically generated files! More information: https://www.jsdelivr.com/using-sri-with-dynamic-files
 */
var q = Object.defineProperty;
var U = Object.getOwnPropertyDescriptor;
var j = Object.getOwnPropertyNames;
var D = Object.prototype.hasOwnProperty;
var $ = (t, e) => {
		for (var r in e) q(t, r, { get: e[r], enumerable: !0 });
	},
	H = (t, e, r, n) => {
		if ((e && typeof e == 'object') || typeof e == 'function')
			for (let s of j(e)) !D.call(t, s) && s !== r && q(t, s, { get: () => e[s], enumerable: !(n = U(e, s)) || n.enumerable });
		return t;
	};
var O = (t) => H(q({}, '__esModule', { value: !0 }), t);
var _ = {};
$(_, { ValidationError: () => b, decode: () => I, encode: () => F, isBlurhashValid: () => V });
module.exports = O(_);
var C = [
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'Q',
		'R',
		'S',
		'T',
		'U',
		'V',
		'W',
		'X',
		'Y',
		'Z',
		'a',
		'b',
		'c',
		'd',
		'e',
		'f',
		'g',
		'h',
		'i',
		'j',
		'k',
		'l',
		'm',
		'n',
		'o',
		'p',
		'q',
		'r',
		's',
		't',
		'u',
		'v',
		'w',
		'x',
		'y',
		'z',
		'#',
		'$',
		'%',
		'*',
		'+',
		',',
		'-',
		'.',
		':',
		';',
		'=',
		'?',
		'@',
		'[',
		']',
		'^',
		'_',
		'{',
		'|',
		'}',
		'~'
	],
	x = (t) => {
		let e = 0;
		for (let r = 0; r < t.length; r++) {
			let n = t[r],
				s = C.indexOf(n);
			e = e * 83 + s;
		}
		return e;
	},
	p = (t, e) => {
		var r = '';
		for (let n = 1; n <= e; n++) {
			let s = (Math.floor(t) / Math.pow(83, e - n)) % 83;
			r += C[Math.floor(s)];
		}
		return r;
	};
var h = (t) => {
		let e = t / 255;
		return e <= 0.04045 ? e / 12.92 : Math.pow((e + 0.055) / 1.055, 2.4);
	},
	M = (t) => {
		let e = Math.max(0, Math.min(1, t));
		return e <= 0.0031308 ? Math.trunc(e * 12.92 * 255 + 0.5) : Math.trunc((1.055 * Math.pow(e, 0.4166666666666667) - 0.055) * 255 + 0.5);
	},
	S = (t) => (t < 0 ? -1 : 1),
	d = (t, e) => S(t) * Math.pow(Math.abs(t), e);
var b = class extends Error {
	constructor(e) {
		super(e), (this.name = 'ValidationError'), (this.message = e);
	}
};
var A = (t) => {
		if (!t || t.length < 6) throw new b('The blurhash string must be at least 6 characters');
		let e = x(t[0]),
			r = Math.floor(e / 9) + 1,
			n = (e % 9) + 1;
		if (t.length !== 4 + 2 * n * r) throw new b(`blurhash length mismatch: length is ${t.length} but it should be ${4 + 2 * n * r}`);
	},
	V = (t) => {
		try {
			A(t);
		} catch (e) {
			return { result: !1, errorReason: e.message };
		}
		return { result: !0 };
	},
	W = (t) => {
		let e = t >> 16,
			r = (t >> 8) & 255,
			n = t & 255;
		return [h(e), h(r), h(n)];
	},
	k = (t, e) => {
		let r = Math.floor(t / 361),
			n = Math.floor(t / 19) % 19,
			s = t % 19;
		return [d((r - 9) / 9, 2) * e, d((n - 9) / 9, 2) * e, d((s - 9) / 9, 2) * e];
	},
	J = (t, e, r, n) => {
		A(t), (n = n | 1);
		let s = x(t[0]),
			m = Math.floor(s / 9) + 1,
			f = (s % 9) + 1,
			i = (x(t[1]) + 1) / 166,
			u = new Array(f * m);
		for (let o = 0; o < u.length; o++)
			if (o === 0) {
				let l = x(t.substring(2, 6));
				u[o] = W(l);
			} else {
				let l = x(t.substring(4 + o * 2, 6 + o * 2));
				u[o] = k(l, i * n);
			}
		let c = e * 4,
			a = new Uint8ClampedArray(c * r);
		for (let o = 0; o < r; o++)
			for (let l = 0; l < e; l++) {
				let y = 0,
					B = 0,
					R = 0;
				for (let w = 0; w < m; w++)
					for (let P = 0; P < f; P++) {
						let G = Math.cos((Math.PI * l * P) / e) * Math.cos((Math.PI * o * w) / r),
							T = u[P + w * f];
						(y += T[0] * G), (B += T[1] * G), (R += T[2] * G);
					}
				let N = M(y),
					z = M(B),
					L = M(R);
				(a[4 * l + 0 + o * c] = N), (a[4 * l + 1 + o * c] = z), (a[4 * l + 2 + o * c] = L), (a[4 * l + 3 + o * c] = 255);
			}
		return a;
	},
	I = J;
var E = 4,
	K = (t, e, r, n) => {
		let s = 0,
			m = 0,
			f = 0,
			g = e * E;
		for (let u = 0; u < e; u++) {
			let c = E * u;
			for (let a = 0; a < r; a++) {
				let o = c + a * g,
					l = n(u, a);
				(s += l * h(t[o])), (m += l * h(t[o + 1])), (f += l * h(t[o + 2]));
			}
		}
		let i = 1 / (e * r);
		return [s * i, m * i, f * i];
	},
	Q = (t) => {
		let e = M(t[0]),
			r = M(t[1]),
			n = M(t[2]);
		return (e << 16) + (r << 8) + n;
	},
	X = (t, e) => {
		let r = Math.floor(Math.max(0, Math.min(18, Math.floor(d(t[0] / e, 0.5) * 9 + 9.5)))),
			n = Math.floor(Math.max(0, Math.min(18, Math.floor(d(t[1] / e, 0.5) * 9 + 9.5)))),
			s = Math.floor(Math.max(0, Math.min(18, Math.floor(d(t[2] / e, 0.5) * 9 + 9.5))));
		return r * 19 * 19 + n * 19 + s;
	},
	Z = (t, e, r, n, s) => {
		if (n < 1 || n > 9 || s < 1 || s > 9) throw new b('BlurHash must have between 1 and 9 components');
		if (e * r * 4 !== t.length) throw new b('Width and height must match the pixels array');
		let m = [];
		for (let a = 0; a < s; a++)
			for (let o = 0; o < n; o++) {
				let l = o == 0 && a == 0 ? 1 : 2,
					y = K(t, e, r, (B, R) => l * Math.cos((Math.PI * o * B) / e) * Math.cos((Math.PI * a * R) / r));
				m.push(y);
			}
		let f = m[0],
			g = m.slice(1),
			i = '',
			u = n - 1 + (s - 1) * 9;
		i += p(u, 1);
		let c;
		if (g.length > 0) {
			let a = Math.max(...g.map((l) => Math.max(...l))),
				o = Math.floor(Math.max(0, Math.min(82, Math.floor(a * 166 - 0.5))));
			(c = (o + 1) / 166), (i += p(o, 1));
		} else (c = 1), (i += p(0, 1));
		return (
			(i += p(Q(f), 4)),
			g.forEach((a) => {
				i += p(X(a, c), 2);
			}),
			i
		);
	},
	F = Z;
0 && (module.exports = { ValidationError, decode, encode, isBlurhashValid });
//# sourceMappingURL=index.js.map
