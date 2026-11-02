"""Procedural background music (royalty-free: everything is synthesised here).

Upbeat house / pop groove, 120 BPM, A minor (Am - F - C - G).
The arrangement follows the video:
  intro (chat + search)  -> soft pads, plucks, light hats, riser
  drop 1 (site appears)  -> full beat
  breakdown ("48 heures plus tard")  -> pads only + riser
  drop 2 ("Commence à vendre")       -> full beat with extra hats
  outro (end card)       -> fades out
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(11)

CHORDS = [  # (pad notes, bass root) as MIDI numbers
    ([57, 60, 64], 45),  # Am
    ([53, 57, 60], 41),  # F
    ([55, 60, 64], 48),  # C
    ([55, 59, 62], 43),  # G
]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1, f2], 'band', fs=SR, output='sos'), x)


def saw(f, n, phase=0.0):
    ph = (phase + f * np.arange(n) / SR) % 1.0
    return 2 * ph - 1


def adsr(n, a, d, s, r, hold):
    """hold = seconds before release starts."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-3)))
    rel = np.clip((t - hold) / r, 0, 1)
    return e * (1 - rel)


def add(buf, sig, t, gain=1.0, pan=0.0):
    o = int(round(t * SR))
    if o >= len(buf) or o + len(sig) <= 0:
        return
    if o < 0:
        sig = sig[-o:]; o = 0
    sig = sig[:len(buf) - o]
    buf[o:o + len(sig), 0] += sig * gain * (1 - pan)
    buf[o:o + len(sig), 1] += sig * gain * (1 + pan)


def add2(buf, st, t, gain=1.0):
    o = int(round(t * SR))
    if o >= len(buf) or o + len(st) <= 0:
        return
    if o < 0:
        st = st[-o:]; o = 0
    st = st[:len(buf) - o]
    buf[o:o + len(st)] += st * gain


# ---------------- instruments ----------------
def pad_chord(notes, dur, cutoff):
    n = int(SR * (dur + 0.6))
    out = np.zeros((n, 2))
    for m in notes:
        for k, det in enumerate((-0.09, 0.0, 0.09)):  # detune in semitones
            v = saw(hz(m + det), n, rng.random())
            pan = (-0.5, 0.0, 0.5)[k]
            out[:, 0] += v * (1 - pan); out[:, 1] += v * (1 + pan)
    env = adsr(n, 0.08, 0.6, 0.8, 0.5, dur)
    for c in range(2):
        out[:, c] = lp(out[:, c], cutoff) * env
    return out / (len(notes) * 3)


def pluck(m, dur=0.35):
    n = int(SR * dur); t = np.arange(n) / SR; f = hz(m)
    v = sum(np.sin(2 * np.pi * f * h * t) / h for h in (1, 3, 5, 7))
    v += 0.3 * np.sin(2 * np.pi * f * 2 * t)
    return lp(v, 3800) * np.exp(-t / 0.11) * np.minimum(1, t / 0.002)


def bass(m, dur):
    n = int(SR * dur); t = np.arange(n) / SR; f = hz(m)
    body = lp(saw(f, n), 520, 4) * 0.7 + np.sin(2 * np.pi * f / 2 * t) * 0.6
    return np.tanh(1.6 * body) * np.exp(-t / 0.16) * np.minimum(1, t / 0.004)


def kick():
    n = int(SR * 0.4); t = np.arange(n) / SR
    f = 48 + 120 * np.exp(-t * 30)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    click = hp(rng.standard_normal(n), 2000) * np.exp(-t / 0.004) * 0.35
    return np.tanh(1.8 * (body + click))


def clap():
    n = int(SR * 0.35); t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 900, 3000)
    env = np.zeros(n)
    for o in (0, 0.011, 0.022):
        env += np.where(t >= o, np.exp(-(t - o) / 0.006), 0)
    env += np.where(t >= 0.03, 0.5 * np.exp(-(t - 0.03) / 0.09), 0)
    return noise * env * 0.9


def hat(decay=0.035):
    n = int(SR * 0.2); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7500, 4) * np.exp(-t / decay)


def crash():
    n = int(SR * 1.8); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 4500) * np.exp(-t / 0.55) * 0.5


def riser(dur):
    n = int(SR * dur); t = np.arange(n) / SR
    noise = rng.standard_normal(n)
    out = np.zeros(n); chunks = 24
    for i in range(chunks):
        a, b = i * n // chunks, (i + 1) * n // chunks
        fc = 400 * (12000 / 400) ** (i / (chunks - 1))
        out[a:b] = lp(noise[max(0, a - 2000):b], fc)[-(b - a):]
    sweep = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (3 * t / dur)) / SR) * 0.15
    return (out * 0.6 + sweep) * (t / dur) ** 2


def reverb_ir(seconds=1.8):
    n = int(SR * seconds); t = np.arange(n) / SR
    ir = np.stack([lp(rng.standard_normal(n), 6000), lp(rng.standard_normal(n), 6000)], 1)
    ir = ir * np.exp(-t / 0.45)[:, None]
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True))   # unit energy


# ---------------- arrangement ----------------
def make_music(duration, markers):
    n = int(SR * (duration + 1.0))
    pads = np.zeros((n, 2)); keys = np.zeros((n, 2)); low = np.zeros((n, 2))
    drums = np.zeros((n, 2)); fx = np.zeros((n, 2)); send = np.zeros((n, 2))

    d1 = markers['drop1']
    snap = lambda t: d1 + round((t - d1) / BEAT) * BEAT          # snap to beat grid anchored at drop 1
    brk = snap(markers['brk']); d2 = snap(markers['drop2']); end = markers['end']
    outro = end - 1.6

    def section(t):
        if t < d1: return 'intro'
        if t < brk: return 'main'
        if t < d2: return 'break'
        if t < outro: return 'main2'
        return 'outro'

    # beats from the first bar before t=0 until the end
    k0 = int(np.floor((0 - d1) / BAR)) * 4
    k1 = int(np.ceil((end + 1 - d1) / BEAT))
    for k in range(k0, k1):
        t = d1 + k * BEAT
        sec = section(max(t, 0))
        bar_i = k // 4; beat_in_bar = k % 4
        notes, root = CHORDS[bar_i % 4]

        if beat_in_bar == 0:  # pads, once per bar
            cutoff = {'intro': 900 + 1400 * np.clip((t + BAR) / max(d1, 1), 0, 1), 'main': 2400,
                      'break': 1300, 'main2': 2800, 'outro': 1600}[sec]
            pc = pad_chord(notes, BAR, cutoff)
            add2(pads, pc, t)
            add2(send, pc * 0.5, t)

        # plucky arpeggio in eighths
        arp = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[1] + 12]
        for e in range(2):
            te = t + e * BEAT / 2
            idx = (beat_in_bar * 2 + e) % 4
            vol = {'intro': 0.22, 'main': 0.3, 'break': 0.2, 'main2': 0.32, 'outro': 0.15}[sec]
            if sec == 'intro' and te < d1 - 2 * BAR: vol *= 0.7
            p = pluck(arp[idx] + (12 if (sec == 'main2' and e == 1 and beat_in_bar == 3) else 0))
            add(keys, p, te, vol, -0.35 if idx % 2 else 0.35)
            add(keys, p, te + 0.75 * BEAT, vol * 0.35, 0.5 if idx % 2 else -0.5)  # dotted delay
            add(send, p * vol, te)

        full = sec in ('main', 'main2')
        if full:
            add(drums, kick(), t, 0.95)
            add(low, bass(root, BEAT / 2 * 0.95), t + BEAT / 2, 0.55)          # offbeat bass
            if beat_in_bar in (1, 3):
                c = clap(); add(drums, c, t, 0.55); add(send, c * 0.5, t)
            add(drums, hat(), t + BEAT / 2, 0.22, 0.2)
            if sec == 'main2':
                add(drums, hat(0.02), t + BEAT / 4, 0.1, -0.2); add(drums, hat(0.02), t + 3 * BEAT / 4, 0.1, -0.2)
        elif sec == 'intro' and t >= d1 - 2 * BAR:
            add(drums, hat(), t + BEAT / 2, 0.14, 0.2)
        elif sec == 'break':
            if beat_in_bar == 0:
                add(low, bass(root, BEAT * 1.6), t, 0.35)

    # transitions
    for drop, rdur in ((d1, BAR), (d2, min(BAR, d2 - brk - 0.2))):
        add(fx, riser(rdur), drop - rdur, 0.55)
        add(fx, crash(), drop, 0.6); add(send, crash() * 0.4, drop)
        add(drums, kick(), drop, 1.0)

    # sidechain pump on pads + keys during full sections
    t = np.arange(n) / SR
    rel = ((t - d1) % BEAT)
    pump = 1 - 0.5 * np.exp(-rel / 0.11)
    full_mask = ((t >= d1) & (t < brk)) | ((t >= d2) & (t < outro))
    sc = np.where(full_mask, pump, 1.0)[:, None]

    wet = np.stack([fftconvolve(send[:, c], reverb_ir()[:, c])[:n] for c in range(2)], 1)
    mix = pads * 0.55 * sc + keys * 0.8 * sc + low * 0.9 + drums * 0.8 + fx * 0.5 + wet * 0.35
    mix[:, :] = mix * np.where((t < d1) | ((t >= brk) & (t < d2)), 1.7, 1.0)[:, None]
    for c in range(2):
        mix[:, c] = hp(mix[:, c], 30)

    # fade in very short, fade out at the end
    fade = np.clip(t / 0.4, 0, 1) * np.clip((end + 0.4 - t) / 2.0, 0, 1)
    mix *= fade[:, None]
    mix /= np.percentile(np.abs(mix), 99.9) + 1e-9      # loud parts near 1.0
    mix = np.tanh(mix * 0.9) / np.tanh(0.9)
    mix /= np.abs(mix).max() + 1e-9
    return mix[:int(SR * (duration + 0.5))]
