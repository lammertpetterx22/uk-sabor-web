import { useEffect, useState } from "react";

interface CountdownTimerProps {
  /** Target ISO date/time string or Date. */
  target: string | Date;
  /** Compact layout for small spaces (card badges). Default false. */
  compact?: boolean;
  /** Label shown above the digits. */
  label?: string;
  /** Optional className on the wrapper. */
  className?: string;
  /** Hide the component once the countdown reaches zero (default true). */
  hideOnEnd?: boolean;
}

interface Parts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function diff(target: Date): Parts {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  };
}

/**
 * Live countdown timer. Ticks every second, cleans itself up, and
 * collapses to zero when the target has passed.
 */
export default function CountdownTimer({
  target,
  compact = false,
  label,
  className = "",
  hideOnEnd = true,
}: CountdownTimerProps) {
  const date = target instanceof Date ? target : new Date(target);
  const [parts, setParts] = useState<Parts>(() => diff(date));

  useEffect(() => {
    setParts(diff(date));
    const id = setInterval(() => setParts(diff(date)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (parts.done && hideOnEnd) return null;

  if (compact) {
    // Inline badge: "2d 14h 23m" — used on event cards etc.
    const pieces: string[] = [];
    if (parts.days > 0) pieces.push(`${parts.days}d`);
    if (parts.days < 7) pieces.push(`${String(parts.hours).padStart(2, "0")}h`);
    if (parts.days === 0) pieces.push(`${String(parts.minutes).padStart(2, "0")}m`);
    if (parts.days === 0 && parts.hours === 0) pieces.push(`${String(parts.seconds).padStart(2, "0")}s`);

    return (
      <span className={`inline-flex items-baseline gap-1 font-mono tabular-nums font-bold ${className}`}>
        {pieces.join(" ")}
      </span>
    );
  }

  // Expanded: four boxed digits with labels — used in the event hero.
  const box = (v: number, l: string) => (
    <div className="flex flex-col items-center">
      <div className="min-w-[3.5rem] md:min-w-[4.5rem] px-3 py-2 md:py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 shadow-lg">
        <p className="text-3xl md:text-5xl font-black text-white tabular-nums leading-none text-center">
          {String(v).padStart(2, "0")}
        </p>
      </div>
      <p className="text-[10px] md:text-xs uppercase tracking-widest text-white/60 font-semibold mt-1.5">
        {l}
      </p>
    </div>
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <p className="text-xs md:text-sm uppercase tracking-widest text-white/70 font-semibold text-center">
          {label}
        </p>
      )}
      <div className="flex items-center gap-2 md:gap-3 justify-center">
        {box(parts.days, "days")}
        {box(parts.hours, "hours")}
        {box(parts.minutes, "mins")}
        {box(parts.seconds, "secs")}
      </div>
    </div>
  );
}
