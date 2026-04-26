import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { loadKakaoSdk } from "@/lib/kakao"
import { memilText } from "@/lib/novel-text"

type Props = { appkey: string }

type PlaceResult = {
  id: string
  place_name: string
  road_address_name?: string
  address_name?: string
  x: string
  y: string
}

export default function NovelKeyboard({ appkey }: Props) {
  const mapElRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<PlaceResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!appkey) {
      setError("PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다")
      return
    }
    let cancelled = false
    loadKakaoSdk(appkey, ["services"])
      .then(() => {
        if (cancelled || !mapElRef.current) return
        const { kakao } = window
        const map = new kakao.maps.Map(mapElRef.current, {
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 8,
        })
        mapRef.current = map
        setReady(true)
      })
      .catch((e) => setError(e?.message ?? String(e)))
    return () => {
      cancelled = true
    }
  }, [appkey])

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
  }

  const search = () => {
    if (!ready || !query.trim()) return
    const { kakao } = window
    const ps = new kakao.maps.services.Places()
    setSearching(true)
    setSearchError(null)
    ps.keywordSearch(query, (data: PlaceResult[], status: string) => {
      setSearching(false)
      clearMarkers()
      if (status === kakao.maps.services.Status.ZERO_RESULT) {
        setResults([])
        return
      }
      if (status !== kakao.maps.services.Status.OK) {
        setResults([])
        setSearchError("검색 실패")
        return
      }
      setResults(data)
      const bounds = new kakao.maps.LatLngBounds()
      data.forEach((d) => {
        const pos = new kakao.maps.LatLng(Number(d.y), Number(d.x))
        bounds.extend(pos)
        const marker = new kakao.maps.Marker({
          position: pos,
          map: mapRef.current,
        })
        markersRef.current.push(marker)
      })
      mapRef.current.setBounds(bounds)
    })
  }

  const append = (ch: string) => setQuery((q) => q + ch)
  const backspace = () => setQuery((q) => q.slice(0, -1))
  const space = () => setQuery((q) => q + " ")
  const clear = () => {
    setQuery("")
    setResults(null)
    setSearchError(null)
    clearMarkers()
  }

  const tokens = useMemo(() => Array.from(memilText), [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-2">
          <div
            className="min-h-9 flex-1 rounded-md bg-background px-3 py-2 font-mono text-sm tracking-wide ring-1 ring-foreground/10"
            aria-label="검색어"
          >
            {query ? (
              <span>{query}</span>
            ) : (
              <span className="text-muted-foreground">
                본문에서 글자를 눌러 검색어를 만들어보세요
              </span>
            )}
            <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-foreground align-middle" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={space}>
            공백
          </Button>
          <Button size="sm" variant="outline" onClick={backspace}>
            ⌫
          </Button>
          <Button size="sm" variant="ghost" onClick={clear}>
            지우기
          </Button>
          <Button
            size="sm"
            onClick={search}
            disabled={!ready || !query.trim() || searching}
          >
            {searching ? "검색 중..." : "검색"}
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <div ref={mapElRef} className="h-[360px] w-full bg-muted" />
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

      {results !== null && (
        <div className="rounded-xl bg-card p-4 text-sm ring-1 ring-foreground/10">
          {searchError ? (
            <p className="text-destructive">{searchError}</p>
          ) : results.length === 0 ? (
            <p className="text-muted-foreground">
              "{query}" 에 대한 결과가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.slice(0, 5).map((r) => (
                <li key={r.id} className="flex flex-col">
                  <span className="font-medium">{r.place_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.road_address_name || r.address_name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <p className="mb-3 text-xs text-muted-foreground">
          이효석 「메밀꽃 필 무렵」 — 글자를 눌러 입력
        </p>
        <div className="text-base leading-loose break-keep whitespace-pre-wrap">
          {tokens.map((ch, i) => {
            if (ch === "\n") return <br key={i} />
            if (/\s/.test(ch)) return <span key={i}>{ch}</span>
            return (
              <button
                key={i}
                type="button"
                onClick={() => append(ch)}
                className="rounded-sm transition-colors hover:bg-primary/20 active:bg-primary/40"
              >
                {ch}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
