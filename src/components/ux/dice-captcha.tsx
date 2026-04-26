import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const ASSET_PATH = "/dice-box/"
const CONTAINER_ID = "dice-captcha-stage"

type RollItem = { value: number; rolls?: { value: number }[] }

export default function DiceCaptcha() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const diceRef = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [values, setValues] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
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
          themeColor: "#7c3aed",
          scale: 7,
          enableShadows: true,
        })
        dice.onRollComplete = (results: RollItem[]) => {
          const flat: number[] = []
          for (const r of results) {
            if (r.rolls && Array.isArray(r.rolls)) {
              for (const x of r.rolls) flat.push(x.value)
            } else if (typeof r.value === "number") {
              flat.push(r.value)
            }
          }
          setValues(flat)
          setRolling(false)
        }
        await dice.init()
        if (cancelled) return
        diceRef.current = dice
        setReady(true)
        setRolling(true)
        dice.roll("4d6")
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

  const reroll = () => {
    if (!diceRef.current || rolling) return
    setVerified(false)
    setValues([])
    setRolling(true)
    diceRef.current.clear()
    diceRef.current.roll("4d6")
  }

  const verify = () => {
    if (values.length === 4) setVerified(true)
  }

  const code = values.join("")

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-xl bg-neutral-900 ring-1 ring-foreground/10">
          <div
            id={CONTAINER_ID}
            ref={stageRef}
            className="h-[420px] w-full"
          />
          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
              주사위 준비 중...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted-foreground">보안문자</label>
          <Input
            readOnly
            value={code}
            placeholder="굴리는 중..."
            className="text-center font-mono text-2xl tracking-[0.5em] tabular-nums"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={reroll}
            disabled={!ready || rolling}
            className="flex-1"
          >
            다시 굴리기
          </Button>
          <Button
            onClick={verify}
            disabled={!ready || rolling || values.length !== 4 || verified}
            className="flex-1"
          >
            확인
          </Button>
        </div>

        {verified && (
          <p className="text-center text-sm font-medium text-emerald-600">
            통과! 보안문자: {code}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
