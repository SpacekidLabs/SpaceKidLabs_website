import { ComponentType, lazy, Suspense, useRef, type ReactNode } from 'react';
import { track } from './track';

/**
 * React.lazy for modules that use named exports (`export function Foo`).
 * The module's code is only downloaded the first time the component renders.
 */
export function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(() => load().then(m => ({ default: m[name] as ComponentType<any> })));
}

/** Placeholder shown while an interactive lab's code downloads. */
function LabLoading() {
  return (
    <div className="my-8 min-h-[240px] flex items-center justify-center border border-dashed border-zinc-900 rounded-sm">
      <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest animate-pulse">
        // LOADING LAB…
      </span>
    </div>
  );
}

/**
 * Counts "lab started" (#19) the first time someone presses or types inside a lab, once per page visit.
 * display: contents, so it changes nothing about the layout.
 */
export function LabUse({ name, children }: { name: string; children: ReactNode }) {
  const counted = useRef(false);
  const first = () => {
    if (counted.current) return;
    counted.current = true;
    track('lab_start', name);
  };
  return <div style={{ display: 'contents' }} onPointerDownCapture={first} onKeyDownCapture={first}>{children}</div>;
}

/** Like lazyNamed, but already wrapped in its own Suspense placeholder, for drop-in use inside posts. */
export function lazyLab<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  const Lab = lazyNamed(load, name);
  return function LazyLab(props: Record<string, unknown>) {
    return (
      <Suspense fallback={<LabLoading />}>
        <LabUse name={String(name)}>
          <Lab {...props} />
        </LabUse>
      </Suspense>
    );
  };
}
