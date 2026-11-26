import { ArrowRight, ExternalLink, Cpu, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AudioComparison } from './AudioComparison';
import { SpectralRotatorPreview } from './SpectralRotatorPreview';
import { NoiseForgePreview } from './NoiseForgePreview';
import { WavesetPreview } from './WavesetPreview';
import { DataPaintPreview } from './DataPaintPreview';
import { LasySynthPreview } from './LasySynthPreview';
import { PeopleVstPreview } from './PeopleVstPreview';
import { DataMosPreview } from './DataMosPreview';
import { GendyPreview } from './GendyPreview';

const PROJECTS_DATA = [
  {
    id: 'gendy',
    title: 'GENDY',
    subterm: 'DYNAMIC STOCHASTIC SYNTHESIS INSTRUMENT',
    color: '#7fd6f6',
    type: 'GENDY',
    previewId: 'gendy',
    tags: ['VST3', 'CLAP', 'STOCHASTIC'],
    status: 'ACTIVE BUILD v0.5.1',
    hook: 'A waveform you can watch becoming something else.',
    description: 'A VST3 / CLAP synthesizer after Iannis Xenakis\'s dynamic stochastic synthesis. The waveform is a chain of breakpoints on a random walk: drag the mutation field to let amplitude and time drift, freeze a shape you like, or couple two oscillators through FM, PM and phase distortion.',
    features: ['Random-walk breakpoint oscillator', 'Dual oscillators with FM / PM / PD', 'MTS-ESP microtuning, mono & glide', 'Optional acoustic body layer'],
    primaryLink: 'https://github.com/SpacekidLabs/gendy',
    primaryLinkText: 'VIEW SOURCE ON GITHUB'
  },
  {
    id: 'spectral',
    title: 'SPECTRAL ROTATOR FX',
    subterm: 'TIME-FREQUENCY COORDINATE SWAP',
    color: '#1db954',
    type: 'SPECTRAL',
    previewId: 'spectral',
    tags: ['WEB APP', 'DSP', 'MATH'],
    status: 'ACTIVE BUILD v1.2',
    hook: 'Turn sound sideways.',
    description: 'A spectral processor that swaps time and frequency axes before reshaping the result, producing impossible timbres conventional DSP chains can\'t reach.',
    features: ['Lossless coordinate-axis rotation', 'Rotated state DSP wave-shaping', 'Bypasses standard phase limitations'],
    primaryLink: 'https://spectralrotatorfx.netlify.app',
    primaryLinkText: 'TRANSMIT TO WEB SYSTEM',
    secondaryLink: '/archive',
    secondaryLinkText: 'READ THEORY MANUAL'
  },
  {
    id: 'noiseforge',
    title: 'NOISE FORGE',
    subterm: 'DIGITAL DEGRADATION LABORATORY',
    color: '#ff5555',
    type: 'NOISEFORGE',
    previewId: 'noiseforge',
    tags: ['WEB APP', 'BITCRUSH', 'LO-FI'],
    status: 'ACTIVE BUILD v1.0',
    hook: 'Fracture the digital stream.',
    description: 'An extreme browser-based sandbox dedicated entirely to digital signal disintegration. Crush any audio file through unconventional degradation state machines, custom buffer truncation, and bit-leak algorithms.',
    features: ['Real-time buffer decimation', 'Multi-stage digital signal clipping', 'Organic lo-fi texture forging'],
    primaryLink: 'https://noiseforge.netlify.app',
    primaryLinkText: 'INITIALIZE DEGRADATION RUN'
  },
  {
    id: 'waveset',
    title: 'WAVESET K-MEANS QUANTIZER',
    subterm: 'ZERO-CROSSING CLUSTERING SYNTH',
    color: '#00ffcc',
    type: 'WAVESET',
    previewId: 'waveset',
    tags: ['WEB APP', 'ML DSP', 'EXPERIMENTAL'],
    status: 'ACTIVE BUILD v1.0',
    hook: 'Teach waveforms new categories.',
    description: 'Audio cycles are clustered using K-Means and rebuilt from their centroids, creating metallic hybrid timbres that blur synthesis and machine learning.',
    features: ['Dilation & erosion of audio cycles', 'Adaptive K-Means clustering algorithm', 'Complex, metallic resynthesis timbres'],
    primaryLink: '/waveset-quantizer',
    primaryLinkText: 'LAUNCH INTRA-SYSTEM PROCESSING'
  },
  {
    id: 'datapaint',
    title: 'DATAPAINT',
    subterm: 'CANVAS FREQUENCY RECONSTRUCTOR',
    color: '#ff69b4',
    type: 'DATAPAINT',
    previewId: 'datapaint',
    tags: ['WEB APP', 'INTERACTIVE', 'FM SYNTH'],
    status: 'ACTIVE BUILD v1.1',
    hook: 'Draw sounds into existence.',
    description: 'Vector strokes become FM synthesis structures, transforming sketches into unstable instruments.',
    features: ['Dynamic canvas-to-audio engine', 'Visual trace path parameters', 'FM synthesis collision grids'],
    primaryLink: 'https://datapaint.netlify.app',
    primaryLinkText: 'LAUNCH CANVAS INTERFACE'
  },
  {
    id: 'lasy',
    title: 'LASy-X //',
    subterm: 'CELLULAR AUTOMATA SYNTHESIS',
    color: '#ff8c00',
    type: 'LASY',
    previewId: 'lasy',
    tags: ['WEB SYNTH', 'CELLULAR AUTOMATA'],
    status: 'IN DEVELOPMENT [CADS]',
    hook: 'Breed patterns on a grid.',
    description: 'Linear Automata Synthesizer using discrete rule grids (Conway/Wolfram variants) to generate evolving wavetable vectors. Watch waveforms mutate on every generation tick, outputting hyper-structured complex micro-rhythms.',
    features: ['1D Cellular Automata waveform core', 'Interactive mutation rule-sets', 'Hardware-style sequencer matrix'],
    isConcept: true,
    statusText: 'IN ASSEMBLY'
  },
  {
    id: 'people',
    title: 'PEOPLE VST',
    subterm: 'CORRUPTIVE WAVESET DISTORTION VST',
    color: '#e4c590',
    type: 'PEOPLE',
    previewId: 'people',
    tags: ['VST3', 'AU', 'DISTORTION'],
    status: 'COMING SOON [R&D]',
    hook: 'Surgically weaponize wave transients.',
    description: 'A heavyweight digital/analog cabinet and waveset clamping custom plugin built for extreme transient compression and high-gain tube cabinet model saturation.',
    features: ['Multi-algorithm waveset erosion', 'Analog hardware simulation filters', 'Dynamic wave-scope tracking'],
    isConcept: true,
    statusText: 'BETA ASSEMBLY IN ARCHIVE'
  },
  {
    id: 'datamos',
    title: 'DATAMOS',
    subterm: 'CONCATENATIVE MOSAIC ENGINE',
    color: '#00e5ff',
    type: 'DATAMOS',
    previewId: 'datamos',
    tags: ['VST3', 'WEB APP', 'CONCATENATIVE'],
    status: 'COMING SOON [CONCEPT]',
    hook: 'Shapeshift with micro-mosaics.',
    description: 'An experimental concatenative engine that reconstructs acoustic signals solely through micro-segments of a loaded background target file.',
    features: ['Surgical concatenative synthesis', 'Spectral matching distance algorithm', 'Unpredictable artifact layering'],
    isConcept: true,
    statusText: 'THEORETICAL MODELING'
  }
];

export function ProjectList() {
  const renderPreview = (id: string) => {
    switch (id) {
      case 'gendy': return <GendyPreview />;
      case 'spectral': return <SpectralRotatorPreview />;
      case 'noiseforge': return <NoiseForgePreview />;
      case 'waveset': return <WavesetPreview />;
      case 'datapaint': return <DataPaintPreview />;
      case 'lasy': return <LasySynthPreview />;
      case 'people': return <PeopleVstPreview />;
      case 'datamos': return <DataMosPreview />;
      default: return null;
    }
  };

  return (
    <div className="space-y-36 relative z-10">
      {PROJECTS_DATA.map((proj, idx) => {
        const isAlternate = idx % 2 === 1;
        return (
          <div key={proj.id} className="relative group">
            {/* Ambient Background Glow matching the active project's color */}
            <div 
              className="absolute -inset-10 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-1000 blur-3xl rounded-full pointer-events-none"
              style={{ backgroundColor: proj.color }}
            />

            <div className={`flex flex-col xl:flex-row gap-12 xl:gap-16 items-center ${isAlternate ? 'xl:flex-row-reverse' : ''}`}>
              {/* Text specifications / details column */}
              <div className="flex-1 space-y-6 w-full">
                {/* Status Bezel */}
                <div className="flex flex-wrap items-center gap-3">
                  <span 
                    className="inline-block px-3 py-1 font-mono text-[9px] uppercase tracking-widest border"
                    style={{ 
                      borderColor: `${proj.color}30`, 
                      backgroundColor: `${proj.color}10`,
                      color: proj.color 
                    }}
                  >
                    {proj.status}
                  </span>
                  <div className="h-[1px] flex-1 bg-zinc-900" />
                  <span className="font-mono text-[10px] text-zinc-600">NODE_{(idx + 1).toString().padStart(2, '0')} // {proj.id.toUpperCase()}</span>
                </div>

                {/* Subtitle & Title */}
                <div>
                  <h3 
                    className="text-3xl md:text-4xl font-display font-black tracking-wider uppercase mb-1"
                    style={{ color: proj.color }}
                  >
                    {proj.title}
                  </h3>
                  <p className="font-mono text-zinc-500 text-xs tracking-widest uppercase">
                    {proj.subterm}
                  </p>
                </div>

                {/* Core Hook & Description */}
                <div className="space-y-3">
                  {proj.hook && (
                    <p className="text-xl text-zinc-100 font-sans font-light italic tracking-tight leading-normal">
                      &ldquo;{proj.hook}&rdquo;
                    </p>
                  )}
                  <p className="text-zinc-400 font-sans font-light text-sm md:text-base leading-relaxed">
                    {proj.description}
                  </p>
                </div>

                {/* Technical Tags / Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {proj.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2">
                      <span className="font-mono text-sm leading-none mt-0.5" style={{ color: proj.color }}>+</span>
                      <span className="font-mono text-xs text-zinc-500 uppercase tracking-wide">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Audio Comparison (Simulation probe) */}
                <div className={`pt-4 border-t border-zinc-900 ${proj.isConcept ? 'opacity-30 pointer-events-none select-none grayscale' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Live Acoustic Signal Audition</span>
                    </div>
                    {proj.isConcept && (
                      <span className="font-mono text-[8px] text-amber-500/80 font-bold uppercase tracking-wider bg-amber-500/5 px-2 py-0.5 border border-amber-500/15 rounded-sm">
                        OFFLINE
                      </span>
                    )}
                  </div>
                  <AudioComparison type={proj.type} color={proj.color} />
                </div>

                {/* Actions Bezel */}
                <div className="flex flex-wrap gap-4 pt-2">
                  {proj.isConcept ? (
                    <div className="w-full border border-zinc-900 bg-[#080808]/90 p-5 flex items-center justify-between rounded-sm">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <div>
                          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">CONCEPT LABS RESTRICTED</p>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase mt-0.5">Stage: {proj.statusText}</p>
                        </div>
                      </div>
                      <Link
                        to="/archive"
                        className="inline-flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-500 px-3.5 py-2 transition-colors uppercase"
                      >
                        Read Research Logs <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ) : (
                    <>
                      {proj.primaryLink.startsWith('http') ? (
                        <a
                          href={proj.primaryLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            borderColor: proj.color,
                            color: proj.color,
                          }}
                          className="px-6 py-3.5 font-mono text-xs font-black tracking-widest uppercase border bg-transparent hover:bg-white hover:text-black hover:border-white transition-all duration-300 flex items-center gap-2"
                        >
                          {proj.primaryLinkText} <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <Link
                          to={proj.primaryLink}
                          style={{
                            borderColor: proj.color,
                            color: proj.color,
                          }}
                          className="px-6 py-3.5 font-mono text-xs font-black tracking-widest uppercase border bg-transparent hover:bg-white hover:text-black hover:border-white transition-all duration-300 flex items-center gap-2"
                        >
                          {proj.primaryLinkText} <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}

                      {proj.secondaryLink && (
                        proj.secondaryLink.startsWith('http') ? (
                          <a
                            href={proj.secondaryLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-6 py-3.5 font-mono text-xs tracking-widest uppercase text-zinc-500 hover:text-zinc-300 border border-zinc-900 hover:border-zinc-700 bg-transparent transition-colors flex items-center gap-2"
                          >
                            {proj.secondaryLinkText}
                          </a>
                        ) : (
                          <Link
                            to={proj.secondaryLink}
                            className="px-6 py-3.5 font-mono text-xs tracking-widest uppercase text-zinc-500 hover:text-zinc-300 border border-zinc-900 hover:border-zinc-700 bg-transparent transition-colors flex items-center gap-2"
                          >
                            {proj.secondaryLinkText}
                          </Link>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Graphics Visualizer / Canvas block column */}
              <div className="w-full xl:w-[500px] shrink-0 relative">
                {/* Floating telemetry lines inside the preview framework to level up its visual craft */}
                <div className="absolute top-3 left-3 flex gap-2 font-mono text-[8px] uppercase tracking-widest text-zinc-600 z-30 select-none bg-black/40 px-2 py-0.5 rounded-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  FEED // {proj.id.toUpperCase()}_SPECTROGRAM
                </div>

                <div 
                  className={`w-full relative shadow-3xl rounded-sm overflow-hidden border border-zinc-950 transition-all duration-500 group-hover:border-white/10 ${proj.isConcept ? 'grayscale opacity-35 brightness-75 contrast-75 pointer-events-none' : ''}`}
                  style={{
                    backgroundColor: '#050505',
                    boxShadow: `0 10px 40px -15px rgba(0,0,0,0.8), 0 0 40px -10px ${proj.color}05`
                  }}
                  aria-hidden="true"
                >
                  {renderPreview(proj.id)}
                </div>

                {proj.isConcept && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-[2px] border border-dashed border-zinc-800/60 rounded-sm pointer-events-none p-6 text-center select-none">
                    <div className="mb-3 p-2 bg-zinc-900/90 border border-zinc-800 rounded-full">
                      <Cpu className="w-5 h-5 text-zinc-500 animate-pulse" />
                    </div>
                    <span className="font-mono text-[10px] tracking-[0.3em] text-[#e4c590] uppercase font-bold animate-pulse">
                      COMING SOON
                    </span>
                    <span className="font-mono text-[8px] tracking-widest text-zinc-500 uppercase mt-1">
                      {proj.statusText || 'DEVELOPMENT IN PROGRESS'}
                    </span>
                    <p className="font-sans text-[11px] text-zinc-400 font-light mt-2 max-w-[240px] leading-relaxed">
                      Interactive simulator offline. Active desktop app development in progress.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subtly separating line */}
            {idx < PROJECTS_DATA.length - 1 && (
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-900 to-transparent my-24" />
            )}
          </div>
        );
      })}
    </div>
  );
}
