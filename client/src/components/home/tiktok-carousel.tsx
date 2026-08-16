import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music2, ArrowUpRight, Pause, Play } from "lucide-react";
import { Section } from "@/components/ui/section";
import { DisplayHeading, IconOrb, GlassPill } from "@/components/ui/glass";
import { useMotionSafe, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

const VIDEOS = [
  { src: "/tiktok/tiktok-1.mp4", caption: "Nurse-led, natural results — the ORÁ way." },
  { src: "/tiktok/tiktok-2.mp4", caption: "Inside ORÁ at 49 Deansgate." },
  { src: "/tiktok/tiktok-3.mp4", caption: "Fresh sets from ORÁ Nails." },
  { src: "/tiktok/tiktok-4.mp4", caption: "Skin boosters, softly done." },
  { src: "/tiktok/tiktok-5.mp4", caption: "Real clients. Real glow." },
];

const HANDLE = "@ora_beauty_mcr";
const HANDLE_URL = "https://www.instagram.com/ora_beauty_mcr/";
const INTERVAL = 6000;

/* ── One phone "screen" (active video only) ── */
function TikTokFrame({ src, caption, paused }: { src: string; caption: string; paused: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) {
      v.pause();
      return;
    }
    const p = v.play();
    if (p !== undefined) p.catch(() => {});
  }, [paused, src]);

  return (
    <div className="relative h-full w-full bg-ora-void">
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        autoPlay={!paused}
        preload="metadata"
        aria-label={caption}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Overlays (no fabricated engagement metrics — handle + caption only) */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-5 left-3 right-3">
          <p className="font-sans text-[12px] font-semibold text-white">{HANDLE}</p>
          <p className="mt-0.5 font-sans text-[10.5px] leading-tight text-white/85">{caption}</p>
          <div className="mt-1.5 flex items-center gap-1">
            <Music2 size={9} className="text-white" />
            <p className="font-sans text-[9px] text-white/70">Original sound — ORÁ Suites</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * TikTok feed (v2) — compact, centred: heading + one phone + dots. Pauses on hover/focus,
 * respects reduced motion (no auto-advance, no slide-x). Only ONE dark band on the page = this.
 */
export function TikTokCarouselSection() {
  const m = useMotionSafe();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hovering, setHovering] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const paused = hovering || userPaused;

  const advance = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % VIDEOS.length);
  }, []);

  useEffect(() => {
    if (paused || m.reduced) return;
    const t = setInterval(advance, INTERVAL);
    return () => clearInterval(t);
  }, [advance, paused, m.reduced]);

  function goTo(i: number) {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }

  const enter = m.reduced ? { opacity: 0 } : { x: direction > 0 ? "-100%" : "100%", opacity: 0 };
  const exit = m.reduced ? { opacity: 0 } : { x: direction > 0 ? "100%" : "-100%", opacity: 0 };
  const current = VIDEOS[index];

  return (
    <Section id="feed" tone="dark" mesh grain className="overflow-hidden">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <DisplayHeading as="h2" size="lg" tone="cream" inherit>
          {"From our feed"}
        </DisplayHeading>
        <motion.div variants={m.fadeUp} className="mt-3">
          <a
            href={HANDLE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex rounded-full"
            data-testid="link-follow-instagram"
          >
            <GlassPill size="sm" className="!text-ora-cream" icon={<ArrowUpRight />}>
              {HANDLE}
            </GlassPill>
          </a>
        </motion.div>

        <motion.div
          variants={m.scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mt-8 flex flex-col items-center"
        >
          <div
            className="relative"
            style={{ width: "min(220px, 58vw)", height: "min(474px, 125vw)" }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onFocus={() => setHovering(true)}
            onBlur={() => setHovering(false)}
          >
            <div
              className="absolute inset-0 overflow-hidden rounded-[14%] bg-ora-void shadow-luxury"
              style={{ border: "min(7px, 2vw) solid #2a2320" }}
            >
              <div
                className="absolute left-1/2 top-0 z-30 -translate-x-1/2 bg-black"
                style={{ width: "36%", height: "5%", borderRadius: "0 0 40% 40%" }}
              />
              <div className="absolute inset-0 overflow-hidden rounded-[12%]">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={index}
                    className="absolute inset-0"
                    initial={enter}
                    animate={{ x: 0, opacity: 1 }}
                    exit={exit}
                    transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <TikTokFrame src={current.src} caption={current.caption} paused={paused} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute bottom-2 left-1/2 z-30 -translate-x-1/2 rounded-full bg-white/30" style={{ width: "30%", height: 4 }} />
            </div>
          </div>

          {/* Dots + pause */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2" role="tablist" aria-label="Feed videos">
              {VIDEOS.map((v, i) => (
                <button
                  key={v.src}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Video ${i + 1}: ${v.caption}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    "focus-ring h-2 rounded-full transition-all duration-450 ease-luxury",
                    i === index ? "w-7 bg-ora-bronze" : "w-2 bg-ora-cream/30 hover:bg-ora-cream/60",
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-pressed={userPaused}
              aria-label={userPaused ? "Play videos" : "Pause videos"}
              className="focus-ring rounded-full"
            >
              <IconOrb size="sm" tone="dark" className="hover-bronze">
                {userPaused ? <Play /> : <Pause />}
              </IconOrb>
            </button>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
