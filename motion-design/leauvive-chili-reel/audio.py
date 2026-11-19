"""Nouvelle bande-son 100 % générée par code pour le reel (la musique d'origine est remplacée) :
whooshs sur les coupes, pops des sous-titres, bruits de cuisson + musique lo-fi groovy.
Usage : python3 audio.py out/sfx.json out/sfx.wav"""
import json, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(7)
cfg = json.load(open(sys.argv[1]))
DUR = cfg['duration'] + 0.6
N = int(DUR * SR)
sfx = np.zeros((N, 2)); mus = np.zeros((N, 2))


def filt(x, kind, f, order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x)


def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR))


def add(buf, t, x, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N or len(x) == 0:
        return
    x = x[:N - i]
    buf[i:i + len(x), 0] += x * g * np.sqrt(0.5 * (1 - pan))
    buf[i:i + len(x), 1] += x * g * np.sqrt(0.5 * (1 + pan))


def env(d, a=0.005, r=None):
    t = tt(d); e = np.minimum(1, t / max(a, 1e-4))
    if r: e *= np.exp(-t / r)
    return e

# ---------------------------------------------------------------- SFX
def thud(f=150, d=.12, w=1.0):
    t = tt(d); fr = f * (1 + 1.5 * np.exp(-t * 60))
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 35)
    c = filt(noise(d), 'highpass', 2500) * np.exp(-t * 300) * .4
    return (s + c) * w


def splash(d=.25, amt=1.0):
    t = tt(d); return filt(noise(d), 'bandpass', [2500, 9000]) * np.exp(-t * 14) * amt


def drops(c, kind):
    n, dd = c.get('n', 20), c.get('dur', .5)
    for k in range(min(n, 40)):
        t = c['t'] + rng.uniform(0, dd + .05)
        heavy = kind == 'meat'
        add(sfx, t, thud(rng.uniform(110, 200) * (.75 if heavy else 1.2), .1, 1), (.20 if heavy else .12), rng.uniform(-.6, .6))
        add(sfx, t, splash(.3, 1), (.10 if heavy else .06), rng.uniform(-.6, .6))


def plop(f=1.0):
    t = tt(.12); fr = (520 * np.exp(-t * 18) + 170) * f
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(.12, .002, .035)


def blub(f=1.0):
    t = tt(.09); fr = (280 + 900 * t / .09) * f
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(.09, .004, .03)


def oil(t0):
    d = 1.3; t = tt(d)
    x = filt(noise(d), 'bandpass', [900, 4000]) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) * env(d, .1) * np.exp(-t * 1.6)
    add(sfx, t0, x, .10)
    for k in range(6): add(sfx, t0 + rng.uniform(0, .8), plop(rng.uniform(1.3, 1.9)), .05)
    add(sfx, t0 + .25, splash(1.2, 1) * np.exp(-tt(1.2) * 2), .12)


def powder(t0):
    d = .6; t = tt(d)
    x = filt(noise(d), 'bandpass', [1800, 7000]) * np.sin(np.pi * t / d) ** 2
    add(sfx, t0, x, .12, rng.uniform(-.3, .3))
    add(sfx, t0 + .05, splash(.5, 1), .06)


def sauce(t0):
    d = 1.6; t = tt(d)
    x = filt(noise(d), 'bandpass', [180, 900]) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 3.3 * t))) * env(d, .08) * np.exp(-t * 1.2)
    add(sfx, t0, x, .35)
    for k in range(9): add(sfx, t0 + rng.uniform(0, 1.2), plop(rng.uniform(.5, .8)), .10, rng.uniform(-.4, .4))
    add(sfx, t0 + .2, splash(1.0, 1), .08)


def scrape(t0, d):
    t = tt(d)
    x = filt(noise(d), 'bandpass', [600, 2600]) * np.abs(np.sin(2 * np.pi * 1.6 * t)) ** 1.5 * np.sin(np.pi * t / d)
    x += filt(noise(d), 'lowpass', 300) * .5 * np.sin(np.pi * t / d)
    add(sfx, t0, x, .16)


def metal(d, parts, base, dec):
    t = tt(d); s = sum(a * np.sin(2 * np.pi * base * r * t + p) * np.exp(-t / (dec * a)) for r, a, p in parts)
    return s * env(d, .001)


LID = [(1, 1, 0), (2.32, .7, 1), (3.41, .5, 2), (4.97, .35, .5), (6.6, .25, 1.2)]


def tick():
    return filt(noise(.03), 'highpass', 3000) * np.exp(-tt(.03) * 250) + np.sin(2 * np.pi * 2100 * tt(.03)) * np.exp(-tt(.03) * 180) * .5


def whoosh(t0, v=1.0):
    d = .55; t = tt(d); x = np.zeros(len(t)); n = noise(d)
    for k, (lo, hi) in enumerate([(200, 500), (400, 1000), (800, 2000), (1500, 3500), (3000, 7000)]):
        x += filt(n, 'bandpass', [lo, hi]) * np.exp(-((t - .12 - k * .06) / .09) ** 2)
    add(sfx, t0, x, .12 * v)


def simmer(t0, d):
    t = tt(d)
    x = filt(noise(d), 'lowpass', 500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 2.1 * t))) * np.sin(np.pi * t / d) ** .5
    add(sfx, t0, x, .25)
    for k in range(int(d * 7)): add(sfx, t0 + rng.uniform(0, d - .1), filt(blub(rng.uniform(.5, .8)), 'lowpass', 900), .06, rng.uniform(-.5, .5))


def steam(t0):
    d = 1.4; t = tt(d); add(sfx, t0, filt(noise(d), 'highpass', 3500) * env(d, .05) * np.exp(-t * 2.2), .10)


def pop(n):
    t = tt(.07); fr = 900 * np.exp(-t * 25) + 380
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(.07, .002, .025)


for c in cfg['cues']:
    ty, t0 = c['type'], c['t']
    if ty == 'drops': drops(c, 'veg')
    elif ty == 'meat': drops(c, 'meat')
    elif ty == 'plop':
        for k in range(min(c['n'], 30)): add(sfx, t0 + rng.uniform(0, c['dur'] + .05), plop(rng.uniform(.8, 1.2)), .09, rng.uniform(-.5, .5))
        drops(dict(c, n=8), 'veg')
    elif ty == 'beans':
        for k in range(26): add(sfx, t0 + rng.uniform(0, c['dur']), plop(rng.uniform(.8, 1.3)), .08, rng.uniform(-.5, .5))
    elif ty == 'rice':
        d = c['dur']; add(sfx, t0, filt(noise(d), 'bandpass', [2500, 8000]) * np.sin(np.pi * tt(d) / d) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 11 * tt(d)))), .12)
    elif ty == 'oil': oil(t0)
    elif ty == 'powder': powder(t0)
    elif ty == 'sauce': sauce(t0)
    elif ty == 'scrape': scrape(t0, c['dur'])
    elif ty == 'whoosh': whoosh(t0, c.get('v', 1))
    elif ty == 'potdown':
        add(sfx, t0, thud(70, .4), .45); add(sfx, t0, metal(1.2, LID, 330, .25), .05)
    elif ty == 'lid':
        add(sfx, t0, metal(1.6, LID, 420, .35), .16); add(sfx, t0, thud(90, .3), .3)
    elif ty == 'lidup':
        add(sfx, t0, metal(1.0, LID, 520, .2), .08)
    elif ty == 'tick': add(sfx, t0, tick(), .10, .3)
    elif ty == 'ding': add(sfx, t0, metal(2.5, [(1, 1, 0), (2.0, .5, 0), (2.76, .35, 0), (5.4, .2, 0)], 1568, .9), .16, .3)
    elif ty == 'simmer': simmer(t0, c['dur'])
    elif ty == 'blub': add(sfx, t0, blub(c.get('f', 1)), .07, rng.uniform(-.5, .5))
    elif ty == 'steam': steam(t0)
    elif ty == 'plate': add(sfx, t0, metal(.8, [(1, 1, 0), (2.7, .5, 0), (5.1, .3, 0)], 900, .12), .06); add(sfx, t0, thud(120, .15), .2)
    elif ty == 'leaves':
        for k in range(10): add(sfx, t0 + rng.uniform(0, c['dur']), filt(noise(.06), 'bandpass', [2000, 6000]) * env(.06, .005, .02), .05, rng.uniform(-.5, .5))
    elif ty == 'pop':
        for k in range(c['n']): add(sfx, t0 + k * .07, pop(1), .07)
    elif ty == 'shine':
        for k, f in enumerate([1047, 1319, 1568, 2093]): add(sfx, t0 + k * .07, np.sin(2 * np.pi * f * tt(1.2)) * env(1.2, .004, .3), .045, -.3 + k * .2)

# grésillement continu, intensité selon les étapes
cu = cfg['cuts']; kt, kv = zip(*[(0, 0), (cu[1], 0), (cu[1] + .6, .35), (cu[8], .45), (cu[8] + .3, .15), (cu[10], .25), (cu[11], .1), (cu[12], 0), (cfg['duration'], 0)])
lvl = np.interp(np.arange(N) / SR, kt, kv)
hiss = filt(rng.standard_normal(N), 'bandpass', [3000, 10000]) * (0.35 + 0.65 * filt(np.abs(rng.standard_normal(N)), 'lowpass', 30))
cr = np.zeros(N); idx = np.where(rng.random(N) < (lvl * 90 / SR))[0]
cr[idx] = rng.uniform(.3, 1, len(idx)) * rng.choice([-1, 1], len(idx))
cr = filt(fftconvolve(cr, np.exp(-tt(.006) * 900) * rng.standard_normal(len(tt(.006))))[:N], 'highpass', 1800)
siz = (hiss * .5 + cr * 1.6) * lvl
sfx[:, 0] += siz * .09; sfx[:, 1] += np.roll(siz, 120) * .09

# ---------------------------------------------------------------- MUSIQUE
BPM = 92; B = 60 / BPM
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [([53, 57, 60, 64, 67], 41), ([52, 55, 59, 62, 66], 40), ([50, 53, 57, 60, 64], 38), ([48, 52, 55, 59, 62], 36)]


def rhodes(f, d, v):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t + .6 * np.sin(2 * np.pi * f * t) * np.exp(-t * 6))
    s += .25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3)
    s += .08 * np.sin(2 * np.pi * 7 * f * t) * np.exp(-t * 30)
    return s * env(d, .006) * np.exp(-t * 1.4) * np.minimum(1, (d - t) / .15) * v


def bass(f, d):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + .2 * np.sin(4 * np.pi * f * t)) * env(d, .01) * np.exp(-t * 1.2) * np.minimum(1, (d - t) / .05)


kick = lambda: np.sin(2 * np.pi * np.cumsum(50 + 90 * np.exp(-tt(.35) * 30)) / SR) * np.exp(-tt(.35) * 9)
snare = lambda: filt(noise(.25), 'bandpass', [900, 4500]) * np.exp(-tt(.25) * 18) + .4 * np.sin(2 * np.pi * 190 * tt(.25)) * np.exp(-tt(.25) * 25)
hat = lambda: filt(noise(.05), 'highpass', 7000) * np.exp(-tt(.05) * 90)

PENTA = [72, 74, 76, 79, 81, 84]
nbar = int(DUR / (4 * B)) + 1
keys = np.zeros((N, 2)); drum = np.zeros((N, 2))
for b in range(nbar):
    t0 = b * 4 * B; ch, bs = CH[b % 4]
    for hit, ln, v in [(0, 2.4, .5), (2.5, 1.4, .32)]:
        for k, m in enumerate(ch):
            add(keys, t0 + hit * B + k * .018, rhodes(m2f(m), ln * B, v), .2, -.35 + k * .17)
    add(keys, t0, bass(m2f(bs), 1.9 * B), .55); add(keys, t0 + 2.5 * B, bass(m2f(bs + 7), 1.3 * B), .4)
    if b % 2 == 1:
        for k in range(3):
            add(keys, t0 + (1 + k * .75) * B + .5 * B, rhodes(m2f(rng.choice(PENTA)), 1.0 * B, .3), .16, .25)
    if t0 >= 1.9 - 4 * B and t0 < cfg['duration'] - 1.5:
        for beat in [0, 2.5]: add(drum, t0 + beat * B, kick(), .5)
        for beat in [1, 3]: add(drum, t0 + beat * B, snare(), .16)
        for e8 in range(8): add(drum, t0 + (e8 // 2 + (.6 if e8 % 2 else 0)) * B, hat(), .07 if e8 % 2 else .1, .3)

mus = keys + drum
# vinyle : craquements + souffle
vin = np.zeros(N); idx = np.where(rng.random(N) < 6 / SR)[0]; vin[idx] = rng.uniform(.2, 1, len(idx))
vin = filt(vin, 'highpass', 1500) * .5 + filt(rng.standard_normal(N), 'bandpass', [600, 5000]) * .008
mus[:, 0] += vin; mus[:, 1] += np.roll(vin, 37)
mus = np.stack([filt(mus[:, i], 'lowpass', 5200) for i in range(2)], 1)
ir = rng.standard_normal(int(1.6 * SR)) * np.exp(-tt(1.6) * 3.5); ir = filt(ir, 'lowpass', 3500) * .05
mus += np.stack([fftconvolve(mus[:, i], ir)[:N] for i in range(2)], 1) * .6
mus = np.tanh(mus * 1.3) / 1.3
fade = np.clip(np.arange(N) / SR / 1.2, 0, 1) * np.clip((DUR - np.arange(N) / SR) / 2.0, 0, 1)
mus *= fade[:, None]

mix = sfx * .8 + mus * .6 / max(1e-6, np.abs(mus).max())
mix /= np.abs(mix).max() / .6
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
wavfile.write(sys.argv[2], SR, (mix * 32767 * .95).astype(np.int16))
print('audio ok', sys.argv[2], f'{DUR:.1f}s')
