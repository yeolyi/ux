import { useEffect, useRef, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    kakao: any
  }
}

const DEFAULT_LAT = 37.5665
const DEFAULT_LNG = 126.978
const DEFAULT_LEVEL = 3

const SEOUL = { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
const BUSAN = { lat: 35.1796, lng: 129.0756 }
const JEJU = { lat: 33.4996, lng: 126.5312 }

function loadKakaoSdk(appkey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.kakao?.maps) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(
      "kakao-maps-sdk"
    ) as HTMLScriptElement | null
    const onReady = () =>
      window.kakao.maps.load(() => resolve())
    if (existing) {
      if (window.kakao?.maps) onReady()
      else existing.addEventListener("load", onReady, { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = "kakao-maps-sdk"
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false`
    script.onload = onReady
    script.onerror = () => reject(new Error("Kakao Maps SDK 로드 실패"))
    document.head.appendChild(script)
  })
}

type Props = { appkey: string }

export default function CoordMap({ appkey }: Props) {
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lng, setLng] = useState(DEFAULT_LNG)
  const [level, setLevel] = useState(DEFAULT_LEVEL)

  useEffect(() => {
    if (!appkey) {
      setError("PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다")
      return
    }
    let cancelled = false
    loadKakaoSdk(appkey)
      .then(() => {
        if (cancelled || !mapElRef.current) return
        const { kakao } = window
        const center = new kakao.maps.LatLng(lat, lng)
        const map = new kakao.maps.Map(mapElRef.current, {
          center,
          level,
          draggable: false,
          scrollwheel: false,
          disableDoubleClick: true,
          disableDoubleClickZoom: true,
          keyboardShortcuts: false,
        })
        map.setZoomable(false)
        const marker = new kakao.maps.Marker({ position: center, map })
        mapRef.current = map
        markerRef.current = marker
        setReady(true)
      })
      .catch((e) => setError(e?.message ?? String(e)))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appkey])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    const { kakao } = window
    const pos = new kakao.maps.LatLng(lat, lng)
    mapRef.current.setCenter(pos)
    markerRef.current?.setPosition(pos)
  }, [lat, lng, ready])

  useEffect(() => {
    if (!ready || !mapRef.current) return
    mapRef.current.setLevel(level)
  }, [level, ready])

  const apply = (next: { lat?: number; lng?: number; level?: number }) => {
    if (next.lat !== undefined) setLat(clamp(next.lat, -90, 90))
    if (next.lng !== undefined) setLng(clamp(next.lng, -180, 180))
    if (next.level !== undefined) setLevel(clamp(next.level, 1, 14))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <div
          ref={mapElRef}
          className="h-[420px] w-full cursor-not-allowed bg-muted [&_*]:pointer-events-none"
        />
        {!ready && !error && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            지도 로딩 중...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-destructive">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <CoordRow
          label="위도 (lat)"
          value={lat}
          min={-90}
          max={90}
          step={0.0001}
          onChange={(v) => apply({ lat: v })}
          format={(v) => v.toFixed(4)}
        />
        <CoordRow
          label="경도 (lng)"
          value={lng}
          min={-180}
          max={180}
          step={0.0001}
          onChange={(v) => apply({ lng: v })}
          format={(v) => v.toFixed(4)}
        />
        <CoordRow
          label="줌 레벨"
          value={level}
          min={1}
          max={14}
          step={1}
          onChange={(v) => apply({ level: Math.round(v) })}
          format={(v) => String(Math.round(v))}
        />

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="self-center text-xs text-muted-foreground">
            프리셋:
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => apply({ ...SEOUL, level: 3 })}
          >
            서울
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => apply({ ...BUSAN, level: 4 })}
          >
            부산
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => apply({ ...JEJU, level: 5 })}
          >
            제주
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              apply({ ...SEOUL, level: DEFAULT_LEVEL })
            }
          >
            초기화
          </Button>
        </div>
      </div>
    </div>
  )
}

function CoordRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        <input
          type="number"
          value={format(value)}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (!Number.isNaN(v)) onChange(v)
          }}
          className="w-32 rounded-md bg-background px-2 py-1 text-right font-mono text-sm tabular-nums ring-1 ring-foreground/10 focus:ring-2 focus:ring-foreground/30 focus:outline-none"
        />
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0]! : v)}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}
