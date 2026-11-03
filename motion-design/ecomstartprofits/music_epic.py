"""Epic / cinematic trailer music, fully synthesised (royalty-free).

D minor, 120 BPM (half-time drums).  Sections follow markers from the page:
  intro  : felt piano motif + low strings + heartbeat, riser and snare roll into drop 1
  drop 1 : BRAAM, taiko drums, string ostinato, choir, low brass
  break  : drums out, high strings + piano, tension build (snare roll, toms, riser)
  drop 2 : everything, extra percussion, second BRAAM
  outro  : big sustained chords, final hit, long tail
Optional 'hits' (seconds) add short braam + boom accents (e.g. on "Regarde ça !").
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(21)

# chords: (voicing, bass root)  — Dm, Bb, F, C
PROG = [([62, 65, 69], 38), ([58, 62, 65], 34), ([60, 65, 69], 41), ([60, 64, 67], 36)]
BREAK_PROG = [([58, 62, 65], 34), ([60, 64, 67], 36), ([62, 65, 69], 38), ([62, 67, 69], 38)]


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def sos(kind, f, order=2): return butter(order, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', min(f, SR * .45), o), x)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x)
def bp(x, f1, f2, o=2): return sosfilt(sos('band', [f1, f2], o), x)


def saw(f, n, ph=None, vib=0.0, vibf=5.0):
    t = np.arange(n) / SR
    fr = f * (1 + vib * np.sin(2 * np.pi * vibf * t + rng.random() * 6))
    p = ((rng.random() if ph is None else ph) + np.cumsum(fr) / SR) % 1.0
    return 2 * p - 1


def env(n, a, r_start, r):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    return e * np.clip(1 - (t - r_start) / r, 0, 1)


def put(buf, sig, t, g=1.0, pan=0.0):
    o = int(round(t * SR))
    if sig.ndim == 1:
        sig = np.stack([sig * (1 - pan), sig * (1 + pan)], 1)
    if o < 0: sig = sig[-o:]; o = 0
    if o >= len(buf): return
    sig = sig[:len(buf) - o]
    buf[o:o + len(sig)] += sig * g


# ---------------- instruments ----------------
def strings(notes, dur, cutoff=1800, attack=0.6):
    n = int(SR * (dur + 1.2)); out = np.zeros((n, 2))
    for m in notes:
        for k in range(4):
            v = saw(hz(m) * (1 + (k - 1.5) * 0.004), n, vib=0.003, vibf=5 + k * .4)
            pan = (k / 3 - .5) * 1.2
            out[:, 0] += v * (1 - pan); out[:, 1] += v * (1 + pan)
    e = env(n, attack, dur, 1.1)
    for c in range(2): out[:, c] = lp(out[:, c], cutoff) * e
    return out / (len(notes) * 4)


def choir(notes, dur):
    n = int(SR * (dur + 1.5)); out = np.zeros((n, 2))
    for m in notes:
        for k in range(3):
            v = saw(hz(m) * (1 + (k - 1) * .003), n, vib=.006, vibf=4.6 + k * .5)
            f = bp(v, 650, 950) * 1.0 + bp(v, 1050, 1300) * .6 + bp(v, 2500, 3100) * .25   # "ah"
            pan = (k - 1) * .6
            out[:, 0] += f * (1 - pan); out[:, 1] += f * (1 + pan)
    e = env(n, 0.9, dur, 1.4)
    return out * e[:, None] / (len(notes) * 3) * 2.2


def ost(m, dur=0.16):
    n = int(SR * dur); t = np.arange(n) / SR
    v = saw(hz(m), n) * .7 + saw(hz(m) * 1.003, n) * .5
    return lp(v, 2600) * np.exp(-t / .06) * np.minimum(1, t / .003)


def piano(m, dur=2.2):
    n = int(SR * dur); t = np.arange(n) / SR; f = hz(m)
    v = sum(a * np.sin(2 * np.pi * f * h * t) * np.exp(-t / (1.2 / h ** .7)) for h, a in ((1, 1), (2, .45), (3, .22), (4, .12), (5, .06)))
    ham = lp(rng.standard_normal(n), 2500) * np.exp(-t / .01) * .15
    return (v + ham) * np.minimum(1, t / .004)


def brass(notes, dur):
    n = int(SR * (dur + .6)); out = np.zeros(n)
    for m in notes:
        out += saw(hz(m), n, vib=.002) + saw(hz(m) * 1.004, n)
    out = lp(out, 900, 2) * env(n, .25, dur, .5)
    return np.tanh(out * .5)


def braam(dur=2.6, root=26):
    n = int(SR * dur); t = np.arange(n) / SR
    x = sum(saw(hz(root + iv) * (1 + d), n) for iv in (0, 12, 19, 24) for d in (-.006, 0, .006))
    out = np.zeros(n); ch = 40
    for i in range(ch):
        a, b = i * n // ch, (i + 1) * n // ch
        p = i / (ch - 1)
        fc = 250 + 3200 * np.exp(-((p - .12) / .18) ** 2) + 500 * (1 - p)
        out[a:b] = lp(x[max(0, a - 3000):b], fc, 2)[-(b - a):]
    out = np.tanh(out * .35) * env(n, .04, dur * .35, dur * .65)
    sub = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-t * 1.2) + 30) / SR) * np.exp(-t / 1.0) * .8
    return out + sub


def taiko(low=True):
    n = int(SR * .9); t = np.arange(n) / SR
    f0, f1 = (110, 48) if low else (220, 130)
    body = np.sin(2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t * 25)) / SR) * np.exp(-t / (.45 if low else .22))
    skin = bp(rng.standard_normal(n), 300, 1800) * np.exp(-t / .025) * .5
    return np.tanh(1.6 * (body + skin))


def snare():
    n = int(SR * .3); t = np.arange(n) / SR
    return (bp(rng.standard_normal(n), 1500, 6000) * .8 + np.sin(2 * np.pi * 190 * t) * .4) * np.exp(-t / .07)


def crash(dur=2.5):
    n = int(SR * dur); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 5000) * np.exp(-t / .8) * .5


def boom(dur=2.0):
    n = int(SR * dur); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 1.5) + 28) / SR) * np.exp(-t / .9) * np.minimum(1, t / .003)


def heartbeat():
    n = int(SR * .6); t = np.arange(n) / SR
    beat = lambda o: np.where(t >= o, np.sin(2 * np.pi * 52 * (t - o)) * np.exp(-(t - o) / .09), 0)
    return lp(beat(0) + .7 * beat(.22), 200)


def riser(dur):
    n = int(SR * dur); t = np.arange(n) / SR
    x = rng.standard_normal(n); out = np.zeros(n); ch = 30
    for i in range(ch):
        a, b = i * n // ch, (i + 1) * n // ch
        out[a:b] = bp(x[max(0, a - 2000):b], 200 + 6000 * (i / ch) ** 2, 400 + 9000 * (i / ch) ** 2)[-(b - a):]
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (3 * t / dur)) / SR) * .25
    return (out + tone) * (t / dur) ** 2.2


def ir(sec=3.2):
    n = int(SR * sec); t = np.arange(n) / SR
    r = np.stack([lp(rng.standard_normal(n), 7000), lp(rng.standard_normal(n), 7000)], 1) * np.exp(-t / .9)[:, None]
    return r / np.sqrt((r ** 2).sum(0, keepdims=True))


# ---------------- arrangement ----------------
def make_music(duration, mk):
    n = int(SR * (duration + 2.0))
    P = {k: np.zeros((n, 2)) for k in ('str', 'cho', 'ost', 'pno', 'brs', 'drm', 'fx', 'low', 'send')}
    d1, brk, d2, end = mk['drop1'], mk['brk'], mk['drop2'], mk['end']
    outro = mk.get('outro', end - 5)
    snap = lambda x: d1 + round((x - d1) / BEAT) * BEAT
    brk, d2, outro = snap(brk), snap(d2), snap(outro)

    def sec(t):
        if t < d1: return 'intro'
        if t < brk: return 'drop'
        if t < d2: return 'break'
        if t < outro: return 'drop2'
        return 'outro'

    k0 = int(np.floor(-d1 / BAR)) * 4
    k1 = int(np.ceil((end + 1 - d1) / BEAT))
    for k in range(k0, k1):
        t = d1 + k * BEAT
        if t < -BAR: continue
        s = sec(max(t, 0)); bi = k // 4; bb = k % 4
        prog = BREAK_PROG if s == 'break' else PROG
        notes, root = prog[bi % 4]

        if bb == 0:
            cut = {'intro': 900, 'drop': 2400, 'break': 3000, 'drop2': 3000, 'outro': 2200}[s]
            st = strings([x - 12 for x in notes] + ([notes[0]] if s != 'intro' else []), BAR, cut, .9 if s == 'intro' else .25)
            put(P['str'], st, t, 1.0); put(P['send'], st, t, .6)
            if s == 'break':
                hi = strings([x + 12 for x in notes], BAR, 4000, .5); put(P['str'], hi, t, .5); put(P['send'], hi, t, .5)
            if s in ('drop', 'drop2', 'outro'):
                c = choir(notes, BAR); put(P['cho'], c, t, 1.0); put(P['send'], c, t, .7)
                b = brass([root, root + 7, root + 12], BAR * .95); put(P['brs'], b, t, .55)
            put(P['low'], lp(saw(hz(root - 12 + 12), int(SR * BAR)), 180) * env(int(SR * BAR), .05, BAR - .1, .1), t, .5 if s != 'intro' else .25)

        # felt piano motif (intro + break + outro)
        if s in ('intro', 'break', 'outro'):
            motif = [notes[0] + 12, notes[2] + 12, notes[1] + 24, notes[2] + 12]
            p = piano(motif[bb]); put(P['pno'], p, t, .55 if s != 'outro' else .35, (bb - 1.5) * .25); put(P['send'], p, t, .6)

        # string ostinato (16ths) in drops
        if s in ('drop', 'drop2'):
            pat = [notes[0], notes[0] + 12, notes[2], notes[0] + 12]
            for q in range(4):
                put(P['ost'], ost(pat[q]), t + q * BEAT / 4, .55 if q % 2 == 0 else .38, -.3 if q % 2 else .3)
                put(P['send'], ost(pat[q]), t + q * BEAT / 4, .15)

        # drums (half-time epic)
        if s in ('drop', 'drop2'):
            if bb == 0: put(P['drm'], taiko(True), t, 1.0)
            if bb == 1: put(P['drm'], taiko(True), t + BEAT / 2, .8)
            if bb == 2:
                put(P['drm'], taiko(False), t, .8); put(P['drm'], snare(), t, .5); put(P['send'], snare(), t, .4)
            if bb == 3:
                put(P['drm'], taiko(False), t, .5, -.3); put(P['drm'], taiko(False), t + BEAT / 2, .6, .3)
            if s == 'drop2':
                put(P['drm'], taiko(False), t + BEAT / 4, .3, .4); put(P['drm'], taiko(False), t + 3 * BEAT / 4, .3, -.4)
        elif s == 'intro' and t >= mk.get('pulse', 3.5) and bb in (0, 2):
            put(P['drm'], heartbeat(), t, .9)
        elif s == 'break' and bb == 0:
            put(P['drm'], taiko(True), t, .45)

    # rolls + risers into the drops
    for drop, ln in ((d1, 1.6), (d2, 2.0)):
        put(P['fx'], riser(ln), drop - ln, .55)
        nr = 22
        for i in range(nr):
            tt = drop - ln + ln * (1 - (1 - i / nr) ** 1.6)
            put(P['drm'], snare(), tt, .15 + .55 * i / nr)
        put(P['fx'], braam(2.8), drop, .9); put(P['send'], braam(2.8), drop, .4)
        put(P['fx'], crash(), drop, .7); put(P['low'], boom(), drop, 1.0)
        put(P['drm'], taiko(True), drop, 1.0)
    for h in mk.get('hits', []):
        put(P['fx'], braam(1.6, 26), h, .6); put(P['low'], boom(1.6), h, .8); put(P['drm'], taiko(True), h, .8)
    # final hit
    put(P['fx'], braam(3.5), outro, .7); put(P['fx'], crash(3.0), outro, .6); put(P['low'], boom(3.0), outro, 1.0)
    put(P['drm'], taiko(True), end - 1.6, 1.0); put(P['low'], boom(2.5), end - 1.6, .9)

    wet = np.stack([fftconvolve(P['send'][:, c], ir()[:, c])[:n] for c in range(2)], 1)
    mix = (P['str'] * 1.1 + P['cho'] * .7 + P['ost'] * .7 + P['pno'] * .6 + P['brs'] * .55 +
           P['drm'] * .75 + P['fx'] * .65 + P['low'] * .7 + wet * .45)
    t = np.arange(n) / SR
    for c in range(2): mix[:, c] = hp(mix[:, c], 28)
    mix *= (np.clip(t / .6, 0, 1) * np.clip((end + 1.2 - t) / 1.6, 0, 1))[:, None]
    shape = np.where(t < d1 - 1.6, .5, np.where((t >= brk) & (t < d2 - 2.0), .7, 1.0))
    mix *= lp(shape, 3, 1)[:, None]
    # simple look-ahead limiter: tames drum peaks so the orchestra sounds big
    from scipy.ndimage import maximum_filter1d
    mix /= np.abs(mix).max() + 1e-9
    pk = maximum_filter1d(np.abs(mix).max(1), size=int(SR * .01))
    pk = lp(pk, 8, 1)
    gain = np.minimum(1.0, 0.38 / np.maximum(pk, 1e-6))
    mix *= gain[:, None]
    mix /= np.abs(mix).max() + 1e-9
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix /= np.abs(mix).max() + 1e-9
    return mix[:int(SR * (duration + .5))]
