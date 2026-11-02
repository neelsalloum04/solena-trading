"""Synthesises the sound-effect track from the cue list exported by the page.
Usage: python3 sfx.py out/sfx.json out/sfx.wav
All sounds are generated procedurally (no third-party audio), so the track is royalty-free.
"""
import json, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(3)


def t_(d):
    return np.arange(int(SR * d)) / SR


def env(n, a=0.002, r=0.1):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e


def lowpass(x, k):
    # simple one-pole lowpass, k in (0,1]: smaller = darker
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += k * (v - acc); y[i] = acc
    return y


def bell(f, d, decay, partials=((1, 1), (2.0, .35), (3.01, .15), (4.2, .08))):
    t = t_(d)
    s = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (decay / m ** .5)) for m, a in partials)
    return s * np.minimum(1, t / 0.002)


def receive():   # bubble "blip" rising
    t = t_(0.16); f = 700 + 900 * (t / t[-1]) ** .6
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .003, .05)
    return .55 * s


def send():      # soft swoosh + blip
    n = int(SR * .22); noise = rng.standard_normal(n)
    sw = lowpass(noise, .08) * np.sin(np.linspace(0, np.pi, n)) ** 2 * .9
    t = t_(.12); f = 1100 - 400 * t / t[-1]
    bl = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .04)
    out = sw; out[:len(bl)] += .5 * bl
    return .5 * out


def tap():
    t = t_(.05)
    s = (np.sin(2 * np.pi * 2400 * t) * .4 + rng.standard_normal(len(t)) * .5) * env(len(t), .0005, .008)
    return .55 * s


def key():
    t = t_(.04); f = rng.uniform(1800, 3200)
    s = (np.sin(2 * np.pi * f * t) * .3 + rng.standard_normal(len(t)) * .6) * env(len(t), .0004, .006)
    return .32 * s


def whoosh(d=.45, k=.05):
    n = int(SR * d); noise = rng.standard_normal(n)
    x = lowpass(noise, k)
    e = np.sin(np.linspace(0, np.pi, n)) ** 3
    return 1.6 * x * e


def swoosh():
    return .6 * whoosh(.35, .09)


def impact():
    t = t_(.6); f = 90 * np.exp(-t * 6) + 42
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .18)
    hit = rng.standard_normal(len(t)) * env(len(t), .0005, .02) * .4
    return .8 * (boom + hit)


def pop():
    t = t_(.09); f = 500 + 1300 * (t / t[-1])
    return .35 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .002, .03)


def success():   # two-note bright chime
    a = bell(1318.5, 1.4, .45); b = bell(1975.5, 1.4, .5)
    out = np.zeros(int(SR * 1.6)); out[:len(a)] += a; o = int(SR * .11); out[o:o + len(b)] += b
    sp = whoosh(.5, .2) * .25; out[:len(sp)] += sp
    return .4 * out


def ticks():
    out = np.zeros(int(SR * 1.5))
    for i in range(10):
        t = t_(.03); s = np.sin(2 * np.pi * 3200 * t) * env(len(t), .0003, .005)
        o = int(SR * i * .14); out[o:o + len(s)] += s * (.5 + .5 * (i % 2))
    return .35 * out


def open_():
    return .45 * whoosh(.4, .12)


def cash():      # bright "ka-ching" notification
    out = np.zeros(int(SR * 1.2))
    coin = rng.standard_normal(int(SR * .06)) * env(int(SR * .06), .0005, .012)
    coin = coin - lowpass(coin, .3)
    out[:len(coin)] += coin * .5
    a = bell(2093, .9, .25); b = bell(2637, .9, .3)
    o1 = int(SR * .05); o2 = int(SR * .13)
    out[o1:o1 + len(a)] += a * .6; out[o2:o2 + len(b)] += b * .7
    return .45 * out


GEN = dict(receive=receive, send=send, tap=tap, key=key, whoosh=whoosh, swoosh=swoosh, impact=impact,
           pop=pop, success=success, ticks=ticks, open=open_, cash=cash)


def main(src, dst):
    data = json.load(open(src))
    dur = data['duration'] + 0.5
    mix = np.zeros((int(SR * dur), 2))
    for c in data['cues']:
        s = GEN[c['type']]() * c.get('vol', 1)
        o = int(SR * c['t']); s = s[:len(mix) - o]
        pan = {'key': rng.uniform(-.15, .15), 'tap': 0}.get(c['type'], 0)
        mix[o:o + len(s), 0] += s * (1 - pan)
        mix[o:o + len(s), 1] += s * (1 + pan)
    peak = np.abs(mix).max()
    if peak > 0: mix *= 0.89 / peak
    pcm = (mix * 32767).astype('<i2')
    with wave.open(dst, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('sfx:', len(data['cues']), 'cues ->', dst)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
