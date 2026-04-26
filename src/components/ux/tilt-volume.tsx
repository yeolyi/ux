import { useEffect, useRef, useState } from "react"
import { Play, Pause, Smartphone, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const TRACK_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
const TRACK_TITLE = "SoundHelix Song 1"
const TRACK_AUTHOR = "T. Schürger · soundhelix.com"

const TILT_RANGE = 45 // degrees of gamma mapped to 0..100% volume

type TiltState = "unsupported" | "needs-permission" | "listening" | "no-events"

export default function TiltVolume() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastEventAtRef = useRef<number>(0)
  const [tiltState, setTiltState] = useState<TiltState>("unsupported")
  const [gamma, setGamma] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)

  // detect support on mount
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

  // sync volume to audio
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const onOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma == null) return
    lastEventAtRef.current = Date.now()
    const g = e.gamma
    setGamma(g)
    const norm = Math.max(-TILT_RANGE, Math.min(TILT_RANGE, g)) / TILT_RANGE
    const vol = (norm + 1) / 2
    setVolume(vol)
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
      if (res === "granted") {
        attachListener()
      } else {
        setTiltState("unsupported")
      }
    } catch {
      setTiltState("unsupported")
    }
  }

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    try {
      if (playing) {
        a.pause()
      } else {
        await a.play()
      }
    } catch (e) {
      setAudioError(true)
    }
  }

  const isMobileTilting = tiltState === "listening"
  const volPct = Math.round(volume * 100)

  return (
    <Card>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 border-b border-foreground/10 pb-4">
          <h2 className="font-heading text-base font-semibold">
            기울여서 볼륨 조절
          </h2>
          <p className="text-xs text-muted-foreground">
            모바일에서 기기를 좌우로 기울이면 볼륨이 조절됩니다.
          </p>
        </div>

        <audio
          ref={audioRef}
          src={TRACK_URL}
          preload="metadata"
          loop
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setAudioError(true)}
          crossOrigin="anonymous"
        />

        <div className="flex items-center gap-4 rounded-lg bg-muted/40 p-4">
          <Button
            type="button"
            size="icon"
            onClick={toggle}
            className="size-12 shrink-0 rounded-full"
            disabled={audioError}
            aria-label={playing ? "일시정지" : "재생"}
          >
            {playing ? (
              <Pause className="size-5" />
            ) : (
              <Play className="ml-0.5 size-5" />
            )}
          </Button>
          <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
            <span className="truncate text-sm font-medium">
              {TRACK_TITLE}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {TRACK_AUTHOR}
            </span>
            {audioError && (
              <span className="truncate text-xs text-destructive">
                오디오를 불러올 수 없습니다.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {volume < 0.05 ? (
                <VolumeX className="size-3.5" />
              ) : (
                <Volume2 className="size-3.5" />
              )}
              볼륨
            </span>
            <span className="font-mono tabular-nums">{volPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-[width] duration-100"
              style={{ width: `${volPct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/40 p-6">
          <Phone gamma={gamma} active={isMobileTilting} />
          <div className="font-mono text-xs text-muted-foreground tabular-nums">
            기울기 γ {gamma.toFixed(1)}°
          </div>
        </div>

        {tiltState === "needs-permission" && (
          <Notice>
            <p className="mb-3 text-sm">
              iOS에서는 모션 센서 사용 권한이 필요합니다.
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
              <p className="text-sm">
                이 데모는 자이로 센서가 있는 모바일 기기에서 동작합니다.
                휴대폰으로 이 페이지를 열면 좌우로 기울여 볼륨을 조절할 수
                있어요.
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

function Phone({ gamma, active }: { gamma: number; active: boolean }) {
  const clamped = Math.max(-TILT_RANGE, Math.min(TILT_RANGE, gamma))
  return (
    <div
      className="relative h-32 w-20 rounded-2xl border-4 border-foreground/70 bg-background transition-transform duration-100 ease-out"
      style={{
        transform: `rotate(${clamped}deg)`,
        opacity: active ? 1 : 0.4,
      }}
    >
      <div className="absolute top-1.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-foreground/40" />
      <div className="absolute inset-x-3 inset-y-5 rounded-md bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20" />
    </div>
  )
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
