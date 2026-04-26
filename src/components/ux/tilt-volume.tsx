import { useEffect, useRef, useState } from "react"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Smartphone,
  Music,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const TRACK_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
const TRACK_FALLBACK_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
const TRACK_TITLE = "Sunset Drive"
const TRACK_AUTHOR = "T. Schürger"

const TILT_RANGE = 45

type TiltState = "unsupported" | "needs-permission" | "listening" | "no-events"

export default function TiltVolume() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastEventAtRef = useRef<number>(0)
  const triedFallbackRef = useRef(false)
  const [tiltState, setTiltState] = useState<TiltState>("unsupported")
  const [gamma, setGamma] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!("DeviceOrientationEvent" in window) || !isMobile) {
      setTiltState("unsupported")
      return
    }
    const needsPerm =
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    if (needsPerm) {
      setTiltState("needs-permission")
    } else {
      attachListener()
    }
    return () => {
      window.removeEventListener("deviceorientation", onOrientation)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma == null) return
    lastEventAtRef.current = Date.now()
    const g = e.gamma
    setGamma(g)
    const norm = Math.max(-TILT_RANGE, Math.min(TILT_RANGE, g)) / TILT_RANGE
    setVolume((norm + 1) / 2)
  }

  const attachListener = () => {
    window.addEventListener("deviceorientation", onOrientation)
    setTiltState("listening")
    setTimeout(() => {
      if (Date.now() - lastEventAtRef.current > 1900) {
        setTiltState("no-events")
      }
    }, 2000)
  }

  const requestPermission = async () => {
    try {
      const res = await (DeviceOrientationEvent as any).requestPermission()
      if (res === "granted") attachListener()
      else setTiltState("unsupported")
    } catch {
      setTiltState("unsupported")
    }
  }

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    try {
      if (playing) a.pause()
      else await a.play()
    } catch {
      setAudioError(true)
    }
  }

  const onAudioError = () => {
    const a = audioRef.current
    if (!a) return
    if (!triedFallbackRef.current) {
      triedFallbackRef.current = true
      a.src = TRACK_FALLBACK_URL
      a.load()
      return
    }
    setAudioError(true)
  }

  const volPct = Math.round(volume * 100)
  const VolIcon =
    volume < 0.05 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <Card className="overflow-hidden">
      <audio
        ref={audioRef}
        src={TRACK_URL}
        preload="metadata"
        loop
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={onAudioError}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) =>
          setCurrentTime(e.currentTarget.currentTime || 0)
        }
      />

      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-400">
        <div className="absolute inset-0 grid place-items-center">
          <Music className="size-20 text-white/40" strokeWidth={1.2} />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-5 pt-12 pb-4 text-white">
          <p className="text-base font-semibold">{TRACK_TITLE}</p>
          <p className="text-xs text-white/80">{TRACK_AUTHOR}</p>
        </div>
      </div>

      <CardContent className="flex flex-col gap-5 pt-5">
        <div className="flex flex-col gap-1.5">
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/70 transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground tabular-nums">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Button
            type="button"
            size="icon"
            onClick={toggle}
            className="size-14 rounded-full"
            disabled={audioError}
            aria-label={playing ? "일시정지" : "재생"}
          >
            {playing ? (
              <Pause className="size-6" />
            ) : (
              <Play className="ml-0.5 size-6" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <VolIcon className="size-4 text-muted-foreground" />
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-100"
              style={{ width: `${volPct}%` }}
            />
          </div>
          <span className="w-8 text-right font-mono text-xs text-muted-foreground tabular-nums">
            {volPct}
          </span>
        </div>

        {audioError && (
          <Notice tone="warn">
            <p className="text-sm">
              오디오를 불러올 수 없습니다. 네트워크 환경을 확인해주세요.
            </p>
          </Notice>
        )}

        {tiltState === "needs-permission" && (
          <Notice>
            <p className="mb-3 text-sm">
              모션 센서 사용 권한이 필요합니다.
            </p>
            <Button onClick={requestPermission} size="sm">
              모션 센서 사용 허용
            </Button>
          </Notice>
        )}

        {tiltState === "unsupported" && (
          <Notice tone="info">
            <div className="flex items-start gap-2">
              <Smartphone className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm leading-relaxed">
                이 데모는 자이로 센서가 있는 모바일에서 동작합니다. 휴대폰으로
                이 페이지를 열어 좌우로 기울여보세요.
              </p>
            </div>
          </Notice>
        )}

        {tiltState === "no-events" && (
          <Notice tone="info">
            <p className="text-sm">
              모션 이벤트가 들어오지 않습니다. HTTPS 환경의 모바일에서 다시
              열어주세요.
            </p>
          </Notice>
        )}
      </CardContent>
    </Card>
  )
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec <= 0) return "0:00"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function Notice({
  children,
  tone = "warn",
}: {
  children: React.ReactNode
  tone?: "warn" | "info"
}) {
  const cls =
    tone === "warn"
      ? "bg-amber-50 text-amber-900 ring-amber-200"
      : "bg-sky-50 text-sky-900 ring-sky-200"
  return (
    <div className={`rounded-md px-4 py-3 ring-1 ${cls}`}>{children}</div>
  )
}
