let ctx: AudioContext | null = null
let cleanBus: GainNode
let driveBus: GainNode
let master: GainNode
const bufferCache = new Map<string, AudioBuffer>()

export function getAudio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext({ latencyHint: 'interactive' })
    master = ctx.createGain()
    master.gain.value = 0.9
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -14
    comp.ratio.value = 4
    master.connect(comp).connect(ctx.destination)

    cleanBus = ctx.createGain()
    const cleanTone = ctx.createBiquadFilter()
    cleanTone.type = 'lowpass'
    cleanTone.frequency.value = 6500
    cleanBus.connect(cleanTone).connect(master)

    driveBus = ctx.createGain()
    driveBus.gain.value = 0.9
    const shaper = ctx.createWaveShaper()
    const curve = new Float32Array(1024)
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1
      curve[i] = Math.tanh(x * 9) * 0.6
    }
    shaper.curve = curve
    shaper.oversample = '2x'
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 90
    const cab = ctx.createBiquadFilter()
    cab.type = 'lowpass'
    cab.frequency.value = 4200
    cab.Q.value = 0.9
    const mid = ctx.createBiquadFilter()
    mid.type = 'peaking'
    mid.frequency.value = 900
    mid.gain.value = 4
    driveBus.connect(hp).connect(shaper).connect(mid).connect(cab).connect(master)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

type Variant = 'normal' | 'soft' | 'muted' | 'harmonic'

/** Karplus–Strong plucked string, rendered once per pitch/variant and cached. */
function pluckBuffer(ac: AudioContext, midi: number, variant: Variant): AudioBuffer {
  const key = `${midi}|${variant}`
  const cached = bufferCache.get(key)
  if (cached) return cached
  const sr = ac.sampleRate
  const freq = midiToFreq(midi)
  const seconds = variant === 'muted' ? 0.6 : 3.2
  const t60 = variant === 'muted' ? 0.18 : variant === 'harmonic' ? 2.2 : 2.8
  const bright = variant === 'muted' ? 0.25 : variant === 'soft' ? 0.45 : 0.85
  const len = Math.floor(sr * seconds)
  const buf = ac.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)
  // The two-point average adds half a sample of delay, so the loop delay is period - 0.5.
  const delay = sr / freq - 0.5
  const N = Math.max(2, Math.floor(delay))
  const frac = delay - N
  const loss = 0.001 ** (1 / (freq * t60))
  const seed = N + 2
  let lp = 0
  for (let i = 0; i < seed; i++) {
    lp += bright * (Math.random() * 2 - 1 - lp)
    d[i] = lp
  }
  let mean = 0
  for (let i = 0; i < seed; i++) mean += d[i]
  mean /= seed
  for (let i = 0; i < seed; i++) d[i] -= mean
  for (let i = seed; i < len; i++) {
    const a = (1 - frac) * d[i - N] + frac * d[i - N - 1]
    const b = (1 - frac) * d[i - N - 1] + frac * d[i - N - 2]
    d[i] = loss * 0.5 * (a + b)
  }
  let peak = 0
  for (let i = 0; i < Math.min(len, N * 4); i++) peak = Math.max(peak, Math.abs(d[i]))
  if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak
  bufferCache.set(key, buf)
  return buf
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  const key = 'noise'
  const cached = bufferCache.get(key)
  if (cached) return cached
  const len = Math.floor(ac.sampleRate * 0.05)
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  bufferCache.set(key, buf)
  return buf
}

export interface NoteOpts {
  time: number
  midi: number
  dur: number
  gain?: number
  drive?: boolean
  soft?: boolean
  pm?: boolean
  dead?: boolean
  harmonic?: boolean
  /** cents at note start → cents at end of bend time */
  bendFrom?: number
  bendTo?: number
  vibrato?: boolean
}

export function playNote(o: NoteOpts) {
  const ac = getAudio()
  const out = ac.createGain()
  out.connect(o.drive ? driveBus : cleanBus)
  const base = (o.gain ?? 1) * (o.drive ? 0.55 : 0.35)
  const end = o.time + o.dur

  if (o.dead) {
    const src = ac.createBufferSource()
    src.buffer = noiseBuffer(ac)
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = midiToFreq(o.midi) * 2
    out.gain.value = base * 0.9
    src.connect(bp).connect(out)
    src.start(o.time)
    return
  }

  const variant: Variant = o.pm ? 'muted' : o.harmonic ? 'harmonic' : o.soft ? 'soft' : 'normal'
  const src = ac.createBufferSource()
  src.buffer = pluckBuffer(ac, o.harmonic ? o.midi + 19 : o.midi, variant)
  let node: AudioNode = src
  if (o.pm) {
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 1400
    node = src.connect(lp)
  }
  node.connect(out)

  if (o.bendFrom !== undefined || o.bendTo !== undefined) {
    const from = o.bendFrom ?? 0
    const to = o.bendTo ?? 0
    const bendTime = Math.min(0.28, o.dur * 0.55)
    src.detune.setValueAtTime(from, o.time)
    src.detune.setValueAtTime(from, o.time + 0.02)
    src.detune.linearRampToValueAtTime(to, o.time + bendTime)
  }
  if (o.vibrato && o.dur > 0.15) {
    const lfo = ac.createOscillator()
    lfo.frequency.value = 5.6
    const depth = ac.createGain()
    depth.gain.setValueAtTime(0, o.time)
    depth.gain.linearRampToValueAtTime(38, o.time + Math.min(0.35, o.dur * 0.5))
    lfo.connect(depth).connect(src.detune)
    lfo.start(o.time)
    lfo.stop(end + 0.1)
  }

  out.gain.setValueAtTime(base, o.time)
  out.gain.setValueAtTime(base, end)
  out.gain.linearRampToValueAtTime(0.0001, end + 0.05)
  src.start(o.time)
  src.stop(end + 0.08)
}

export function playClick(time: number, accent: boolean) {
  const ac = getAudio()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.frequency.value = accent ? 1760 : 1180
  g.gain.setValueAtTime(accent ? 0.5 : 0.3, time)
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
  osc.connect(g).connect(master)
  osc.start(time)
  osc.stop(time + 0.06)
}

/** Sustained root + fifth pad for improvising over. Returns a stop function. */
export function startDrone(rootMidi: number, drive: boolean): () => void {
  const ac = getAudio()
  const out = ac.createGain()
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = drive ? 700 : 900
  out.gain.setValueAtTime(0, ac.currentTime)
  out.gain.linearRampToValueAtTime(0.09, ac.currentTime + 1.2)
  lp.connect(out).connect(master)
  const oscs = [rootMidi - 12, rootMidi, rootMidi + 7].flatMap((m) =>
    [-6, 6].map((cents) => {
      const o = ac.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = midiToFreq(m)
      o.detune.value = cents
      o.connect(lp)
      o.start()
      return o
    }),
  )
  return () => {
    const t = ac.currentTime
    out.gain.cancelScheduledValues(t)
    out.gain.setValueAtTime(out.gain.value, t)
    out.gain.linearRampToValueAtTime(0, t + 0.4)
    oscs.forEach((o) => o.stop(t + 0.45))
  }
}
