import { Layout } from '../components/Layout';
import { usePageTitle } from '../lib/usePageTitle';
import { Terminal, Copy, AlertOctagon, Download, CheckCircle, Apple, ExternalLink, HardDrive, ListChecks } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { ScrollReveal } from '../components/ScrollReveal';
import { track } from '../lib/track';
import {
  ARCH_LABEL,
  DATABEND_RELEASE as RELEASE,
  DATABEND_RELEASES_URL,
  DATABEND_REPO_URL,
  DATABEND_WEB_URL,
  MIN_MACOS,
  formatDate,
  formatSize,
  noteLines,
  type ReleaseAsset,
} from '../data/databend';

const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-brand-orange/40 transition-colors group-hover:border-brand-orange z-20" />
  </>
);

/** Apple Silicon first, then universal, then Intel; .dmg before .zip for the same Mac. */
const ARCH_ORDER: ReleaseAsset['arch'][] = ['arm64', 'universal', 'x64', 'unknown'];
const sortedAssets = [...RELEASE.assets].sort(
  (a, b) => ARCH_ORDER.indexOf(a.arch) - ARCH_ORDER.indexOf(b.arch) || Number(b.name.endsWith('.dmg')) - Number(a.name.endsWith('.dmg')),
);
// One button per Mac type; prefer the .dmg when a release has both.
const buttons = sortedAssets.filter((a, i) => sortedAssets.findIndex((b) => b.arch === a.arch) === i);
const fromGitHub = RELEASE.source === 'github';
const releaseDate = formatDate(RELEASE.date);
const notes = noteLines(RELEASE.notes);

const archs = new Set(buttons.map((b) => b.arch));
/** Which Macs it runs on, worded from the files that exist. */
const macTypes =
  archs.has('arm64') && archs.has('x64')
    ? 'Apple Silicon or Intel Mac: pick the download that matches yours (Apple menu → About This Mac → Chip or Processor)'
    : archs.has('universal')
      ? 'Apple Silicon or Intel Mac (one download works on both)'
      : archs.has('arm64')
        ? 'Apple Silicon Mac (M1 and later)'
        : archs.has('x64')
          ? 'Intel Mac, or Apple Silicon through Rosetta 2'
          : 'Apple Silicon or Intel Mac';

function Checksum({ asset }: { asset: ReleaseAsset }) {
  const [copied, setCopied] = useState(false);
  if (!asset.sha256) return null;
  const copy = () => {
    navigator.clipboard.writeText(asset.sha256!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="font-mono text-[11px] text-zinc-500 flex items-center gap-2 min-w-0">
      <span className="shrink-0">SHA-256</span>
      <span className="truncate">{asset.sha256}</span>
      <button onClick={copy} className="shrink-0 hover:text-white transition-colors" aria-label={`Copy SHA-256 checksum of ${asset.name}`}>
        {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

const SectionTitle = ({ icon: Icon, children }: { icon: typeof Terminal; children: ReactNode }) => (
  <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
    <Icon className="w-5 h-5 text-brand-orange" />
    <h2 className="text-xl font-display font-bold text-white uppercase tracking-widest">{children}</h2>
  </div>
);

export function DownloadPage() {
  usePageTitle('Download');

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-6 py-24 w-full">

        {/* Header */}
        <div className="mb-16 border-b border-white/10 pb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tighter mb-4 glitch-wrapper">
            <span className="glitch-text text-glow" data-text="ACQUIRE DATABEND">
              ACQUIRE DATABEND
            </span>
          </h1>
          <p className="font-mono text-zinc-400">
            Latest version: <span className="text-brand-gold">v{RELEASE.version}</span>
            {releaseDate && <span className="text-zinc-500"> · released {releaseDate}</span>}
          </p>
        </div>

        {/* Description Section */}
        <div className="mb-16 border-l-2 border-brand-orange pl-6 py-2">
          <p className="text-xl md:text-2xl font-display font-medium text-white mb-6 leading-relaxed">
            DATABEND is a gloriously unhinged, offline experimental audio destroyer.
          </p>
          <div className="space-y-4 text-zinc-400 font-sans leading-relaxed">
            <p>
              Born at the intersection of a weird DAW and a digital glitch laboratory, DATABEND lets you carve up audio, brutalize it with extreme effects, and permanently commit the chaos. Select any region, dive into a rich arsenal of degradation, modulation, spectral, and wavelet-based processors — from BitCrush and Granular Freeze to Chaos Engine and Entropy Injector — audition the madness on a live loop, then Commit to bake the destruction directly into the waveform.
            </p>
            <p>
              No undo culture here. Every Commit is a deliberate step deeper into the glitch. With powerful slicing tools, real-time waveform mangling, and a ruthless “mutate and commit” philosophy, DATABEND is built for sound designers, noise artists, glitch musicians, and anyone who believes audio sounds best when it’s broken in interesting ways.
            </p>
            <p>
              <strong className="text-zinc-200">Bend the data. Keep what’s interesting. Delete the rest.</strong>
            </p>
            <p className="text-sm font-mono text-brand-orange pt-4 uppercase tracking-widest">
              Perfect for dark electronic music, IDM, vaporwave, sound design terror, or just making your samples scream in new and beautiful ways.
            </p>
          </div>
        </div>

        {/* Warning Toast / Banner */}
        <div
          className="enter-up p-6 border-2 border-red-500/50 bg-red-500/10 rounded-sm flex items-start gap-4 mb-16 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <AlertOctagon className="w-8 h-8 text-red-500 shrink-0 mt-1" />
          <div>
            <h2 className="font-display font-bold text-red-500 text-lg uppercase tracking-widest mb-2">Notice of Volatility</h2>
            <p className="text-red-200/80 font-sans leading-relaxed text-sm md:text-base">
              DATABEND is designed for experimental use. The Commit workflow is strictly destructive, permanently writing over the designated audio file region.
              Always work on duplicated audio stems. The developers hold zero responsibility for irrecoverably mangled project files or blasted studio monitors.
              Proceed with extreme caution.
            </p>
          </div>
        </div>

        {/* Download Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16 max-w-4xl mx-auto">

          {/* macOS */}
          <div className="border border-brand-orange bg-brand-orange/5 p-8 relative flex flex-col h-full box-glow group">
            <CornerAccents />
            <div className="absolute top-0 right-0 bg-brand-orange text-black px-3 py-1 font-mono text-[10px] font-bold uppercase z-20">
              Recommended
            </div>
            <div className="flex gap-3 items-center mb-2">
              <Apple className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-display font-bold text-white">macOS app</h2>
            </div>
            <p className="font-mono text-zinc-400 text-sm mb-8">Works offline · {MIN_MACOS.replace(' or later', '+')}</p>
            <div className="mt-auto space-y-4">
              {buttons.map((asset, i) => {
                const size = formatSize(asset.size);
                const label = buttons.length === 1 && asset.arch === 'unknown' ? `Download v${RELEASE.version}` : ARCH_LABEL[asset.arch];
                return (
                  <div key={asset.name} className="space-y-1.5">
                    <a
                      href={asset.url}
                      onClick={() => track('databend_download', asset.name)}
                      rel="noreferrer"
                      className={
                        i === 0
                          ? 'w-full flex items-center justify-between gap-3 px-4 py-3 bg-brand-orange text-black font-bold uppercase tracking-wider text-sm hover:bg-white transition-colors'
                          : 'w-full flex items-center justify-between gap-3 px-4 py-3 border border-brand-orange/30 text-brand-orange font-bold uppercase tracking-wider text-sm hover:bg-brand-orange/10 transition-colors'
                      }
                    >
                      <span>{label}</span>
                      <span className="flex items-center gap-2 font-mono text-xs normal-case tracking-normal opacity-80">
                        {asset.name.split('.').pop()}
                        {size && ` · ${size}`}
                        <Download className="w-4 h-4" />
                      </span>
                    </a>
                    <Checksum asset={asset} />
                  </div>
                );
              })}
              <p className="font-mono text-xs text-zinc-500">
                {fromGitHub ? (
                  <a href={RELEASE.pageUrl ?? DATABEND_RELEASES_URL} target="_blank" rel="noreferrer" className="hover:text-brand-orange underline underline-offset-2">
                    All files and older versions on GitHub
                  </a>
                ) : (
                  <>Downloads from Google Drive, which may show a “can’t scan for viruses” page first: click <em>Download anyway</em>.</>
                )}
              </p>
            </div>
          </div>

          {/* Web Version */}
          <div className="border border-zinc-800 bg-zinc-950 p-8 relative flex flex-col h-full hover:border-brand-orange/50 transition-colors group">
            <CornerAccents />
            <h2 className="text-2xl font-display font-bold text-white mb-2">Web app</h2>
            <p className="font-mono text-zinc-400 text-sm mb-8">Nothing to install · Chrome, Edge, Firefox or Safari · any OS</p>
            <div className="mt-auto space-y-3">
              <a href={DATABEND_WEB_URL} target="_blank" rel="noreferrer" className="w-full flex items-center justify-between px-4 py-3 border border-brand-orange/30 text-brand-orange font-bold uppercase tracking-wider text-sm hover:bg-brand-orange/10 transition-colors">
                <span>Open in browser</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <p className="font-mono text-xs text-zinc-500">Use this on Windows or Linux, or to try it before installing.</p>
            </div>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* System requirements */}
          <ScrollReveal className="border border-zinc-800 bg-zinc-950 p-8 rounded-sm">
            <SectionTitle icon={HardDrive}>System requirements</SectionTitle>
            <ul className="space-y-3 font-sans text-sm text-zinc-300 leading-relaxed list-disc pl-5 marker:text-brand-orange">
              <li>{MIN_MACOS}</li>
              <li>{macTypes}</li>
              <li>Opens WAV, MP3, FLAC, OGG, AAC and M4A; saves WAV</li>
              <li>No Windows or Linux app yet; use the web app instead</li>
            </ul>
          </ScrollReveal>

          {/* Install */}
          <ScrollReveal className="border border-zinc-800 bg-zinc-950 p-8 rounded-sm">
            <SectionTitle icon={ListChecks}>Install</SectionTitle>
            <ol className="space-y-3 font-sans text-sm text-zinc-300 leading-relaxed list-decimal pl-5 marker:text-brand-orange marker:font-mono">
              <li>Open the downloaded file and drag <strong className="text-white">DATABEND</strong> into <strong className="text-white">Applications</strong>. (For a .zip, double-click it first, then move the app.)</li>
              <li>
                DATABEND isn’t signed with an Apple developer certificate yet, so the first launch is blocked with a message that Apple “could not verify” it.
                Click <strong className="text-white">Done</strong>, then open <strong className="text-white">System Settings → Privacy &amp; Security</strong>, scroll down and click <strong className="text-white">Open Anyway</strong> next to DATABEND.
              </li>
              <li>On macOS 14 or earlier you can instead right-click (Control-click) the app and choose <strong className="text-white">Open</strong>.</li>
              <li>
                If macOS says the app “is damaged”, run this in Terminal, then open it again:
                <code className="block mt-2 px-3 py-2 bg-black border border-zinc-800 font-mono text-xs text-brand-gold break-all">xattr -dr com.apple.quarantine /Applications/DATABEND.app</code>
              </li>
            </ol>
          </ScrollReveal>
        </div>

        {/* Release notes */}
        <ScrollReveal className="border border-zinc-800 bg-zinc-950 p-8 rounded-sm">
          <SectionTitle icon={Terminal}>What’s new in v{RELEASE.version}</SectionTitle>
          {notes.length > 0 ? (
            <ul className="space-y-3 font-mono text-sm text-zinc-300 list-disc pl-5 marker:text-brand-orange">
              {notes.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          ) : (
            <p className="font-sans text-sm text-zinc-400">No release notes for this version yet.</p>
          )}
          <p className="mt-6 font-mono text-xs text-zinc-500">
            <a href={fromGitHub ? DATABEND_RELEASES_URL : DATABEND_REPO_URL} target="_blank" rel="noreferrer" className="hover:text-brand-orange underline underline-offset-2">
              {fromGitHub ? 'Full changelog on GitHub' : 'Source code and history on GitHub'}
            </a>
          </p>
        </ScrollReveal>

      </div>
    </Layout>
  );
}