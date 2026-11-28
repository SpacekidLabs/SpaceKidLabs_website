/** The archive shows a post's tags grouped into five categories; the post files keep their own detailed tags. */
export function getConsolidatedTags(originalTags: string[]): string[] {
  const consolidated = new Set<string>();
  
  (originalTags || []).forEach(tag => {
    const t = tag.trim().toUpperCase();
    
    // Category 1: DSP & ALGORITHMS
    if (['DSP', 'ALGORITHMS', 'EFFECTS', 'SPECTRAL', 'PINGING', 'RESONANCE', 'COMPRESSION', 'BITS', 'MDCT', 'FFT', 'COSWIRL', 'NOTCH', 'FREQUENCY SHIFTERS', 'RING MODULATORS', 'CHORUS', 'FLANGERS', 'PHASERS', 'DELAYS', 'REVERBS', 'FILTERS', 'SIGNAL'].some(k => t.includes(k))) {
      consolidated.add('DSP & ALGORITHMS');
    }
    
    // Category 2: SYNTHESIS & EXPERIMENTAL
    if (['SYNTHESIS', 'SOUND DESIGN', 'PHYSICAL MODELING', 'WAVEGUIDE', 'WAVE SPLICING', 'INSTRUMENTS', 'FORMANT', 'VOICE', 'ACOUSTICS', 'EXPLORATION', 'TAPE', 'RE-PITCH', 'WARPING', 'STRETCHING', 'ABLETON', 'PRODUCTION'].some(k => t.includes(k))) {
      consolidated.add('SYNTHESIS & EXPERIMENTAL');
    }
    
    // Category 3: XENHARMONIC & THEORY
    if (['XENHARMONIC', 'MICROTONAL', 'MICROTONALITY', 'TUNING', 'THEORY', 'SHASAVISTIC', 'JUST INTERVALS', 'SCALES'].some(k => t.includes(k))) {
      consolidated.add('XENHARMONIC & THEORY');
    }
    
    // Category 4: GLITCH & DEGRADATION
    if (['GLITCH', 'DATABEND', 'DEGRADATION', 'DECAY', 'IMAGES', 'ART', 'CHAOS', 'DOUBLE PENDULUM', 'PHYSICS', 'ARTIFACTS'].some(k => t.includes(k))) {
      consolidated.add('GLITCH & DEGRADATION');
    }
    
    // Category 5: MATH & UTILITIES
    if (['TOOLS', 'CALCULATOR', 'RESOURCES', 'BOOKMARKS', 'DEFINITIONS', 'WAVELETS', 'WAVESETS', 'ASTROPHYSICS', 'MACHINE LEARNING', 'COMPUTER VISION', 'REFERENCE', 'DOWNLOADS', 'CATALOG'].some(k => t.includes(k))) {
      consolidated.add('MATH & UTILITIES');
    }
  });

  if (consolidated.size === 0) {
    consolidated.add('MATH & UTILITIES');
  }

  return Array.from(consolidated);
}
