import { useEffect, useRef, useState } from "react"
import { ShieldCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const ASSET_PATH = "/dice-box/"
const CONTAINER_ID = "dice-captcha-stage"

const DIE_COLORS = [
  { hex: "#ef4444", soft: "rgba(239,68,68,0.10)", label: "1번" },
  { hex: "#f59e0b", soft: "rgba(245,158,11,0.12)", label: "2번" },
  { hex: "#10b981", soft: "rgba(16,185,129,0.12)", label: "3번" },
  { hex: "#3b82f6", soft: "rgba(59,130,246,0.12)", label: "4번" },
] as const

type RollGroup = {
  groupId: number
  value: number
  rolls?: { value: number }[]
}

export default function DiceCaptcha() {
  const diceRef = useRef<any>(null)
  const initStartedRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (initStartedRef.current) return
    initStartedRef.current = true
    let cancelled = false
    let dice: any
    ;(async () => {
      try {
        const mod = await import("@3d-dice/dice-box")
        const DiceBox = mod.default
        if (cancelled) return
        dice = new DiceBox({
          container: `#${CONTAINER_ID}`,
          assetPath: ASSET_PATH,
          theme: "default",
          scale: 16,
          enableShadows: true,
        })
        dice.onRollComplete = (results: RollGroup[]) => {
          const sorted = [...results].sort(
            (a, b) => (a.groupId ?? 0) - (b.groupId ?? 0)
          )
          const flat: number[] = sorted.map((g) => {
            if (g.rolls?.[0]?.value != null) return g.rolls[0].value
            return g.value
          })
          setValues(flat.slice(0, 4))
          setRolling(false)
        }
        await dice.init()
        if (cancelled) return
        diceRef.current = dice
        setReady(true)
        // ensure canvas matches the laid-out container after CSS applies
        requestAnimationFrame(() => {
          try {
            dice.resizeWorld?.()
          } catch {}
          rollAll(dice)
        })
      } catch (e: any) {
        setError(e?.message ?? String(e))
      }
    })()
    return () => {
      cancelled = true
      try {
        dice?.clear?.()
      } catch {}
    }
  }, [])

  const rollAll = (instance: any) => {
    setRolling(true)
    setValues([])
    setVerified(false)
    instance.clear()
    instance.roll(
      DIE_COLORS.map((c) => ({
        qty: 1,
        sides: 6,
        themeColor: c.hex,
      }))
    )
  }

  const reroll = () => {
    if (!diceRef.current || rolling) return
    rollAll(diceRef.current)
  }

  const verify = () => {
    if (values.length === 4) setVerified(true)
  }

  const code = values.join("")

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start gap-3 border-b border-foreground/10 pb-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
            <ShieldCheck className="size-5" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-heading text-base font-semibold">
              보안 인증
            </h2>
            <p className="text-xs text-muted-foreground">
              자동가입 방지를 위해 주사위 4개를 굴려 결과를 확인해주세요.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-zinc-900 to-zinc-800 ring-1 ring-foreground/10">
          <div
            id={CONTAINER_ID}
            className="mx-auto aspect-square w-full max-w-[520px] [&>canvas]:!block [&>canvas]:!h-full [&>canvas]:!w-full"
          />
          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
              주사위 준비 중...
            </div>
          )}
          {rolling && ready && (
            <div className="absolute top-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              굴리는 중...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              인증번호
            </label>
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
              {values.length}/4
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {DIE_COLORS.map((c, i) => {
              const v = values[i]
              return (
                <div
                  key={i}
                  className="relative flex flex-col items-center justify-center gap-1 rounded-md border-2 py-4 transition-colors"
                  style={{
                    borderColor: v != null ? c.hex : "rgba(0,0,0,0.08)",
                    backgroundColor: v != null ? c.soft : "transparent",
                    color: v != null ? c.hex : "rgba(0,0,0,0.3)",
                  }}
                >
                  <span
                    className="absolute top-1 left-1 size-2 rounded-full"
                    style={{ backgroundColor: c.hex }}
                    aria-label={c.label}
                  />
                  <span className="font-mono text-3xl font-bold tabular-nums">
                    {v ?? "·"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2 border-t border-foreground/10 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={reroll}
            disabled={!ready || rolling}
            className="flex-1"
          >
            <RefreshCw className="mr-1.5 size-4" />
            다시 굴리기
          </Button>
          <Button
            type="button"
            onClick={verify}
            disabled={!ready || rolling || values.length !== 4 || verified}
            className="flex-1"
          >
            확인
          </Button>
        </div>

        {verified && (
          <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="size-4" />
            인증 완료 · 인증번호 {code}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
