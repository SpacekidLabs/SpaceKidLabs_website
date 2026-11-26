/**
 * Stops a lab's sound without a click: ramps the master gain to silence over a few milliseconds, then closes
 * the AudioContext (which also stops and frees every node in it). Without the ramp, cutting a sustained tone
 * mid-cycle makes an audible pop.
 */
export function fadeOutAndClose(ctx: AudioContext | null, master: GainNode | null, fadeMs = 30) {
  if (!ctx || ctx.state === 'closed') return;
  if (master && ctx.state === 'running') {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + fadeMs / 1000);
    setTimeout(() => ctx.close().catch(() => {}), fadeMs + 20);
  } else {
    ctx.close().catch(() => {});
  }
}
