import { useEffect, useRef, useState } from "react"
import katex from "katex"
import "katex/dist/katex.min.css"
import confetti from "canvas-confetti"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Term = {
  id: string
  label: string
  required: boolean
}

const TERMS: Term[] = [
  { id: "tos", label: "이용약관 동의", required: true },
  { id: "privacy", label: "개인정보 처리방침 동의", required: true },
  { id: "marketing", label: "마케팅 정보 수신 동의", required: false },
  { id: "third-party", label: "제3자 정보 제공 동의", required: false },
]

const PROBLEM_LATEX =
  "a_{n+1} = \\begin{cases} a_n / 2 & a_n \\text{ 가 짝수} \\\\ 3a_n + 1 & a_n \\text{ 가 홀수} \\end{cases}"

function Tex({
  expr,
  display = false,
}: {
  expr: string
  display?: boolean
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    if (ref.current) {
      katex.render(expr, ref.current, {
        throwOnError: false,
        displayMode: display,
      })
    }
  }, [expr, display])
  return <span ref={ref} />
}

export default function TermsRejection() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [examOpen, setExamOpen] = useState(false)
  const [answer, setAnswer] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [rejected, setRejected] = useState(false)
  const [done, setDone] = useState(false)
  const examInputRef = useRef<HTMLInputElement | null>(null)

  const requiredOk = TERMS.every((t) => !t.required || checked[t.id])
  const optionalRejectedCount = TERMS.filter(
    (t) => !t.required && !checked[t.id]
  ).length

  const allChecked = TERMS.every((t) => checked[t.id])

  const submit = () => {
    if (!requiredOk) return
    if (optionalRejectedCount > 0) {
      setRejected(false)
      setVerifying(false)
      setAnswer("")
      setExamOpen(true)
      setTimeout(() => examInputRef.current?.focus(), 50)
      return
    }
    completeSignup()
  }

  const completeSignup = () => {
    setDone(true)
    setExamOpen(false)
    fireConfetti()
  }

  const submitAnswer = () => {
    if (!answer.trim() || verifying) return
    setRejected(false)
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setRejected(true)
    }, 1600)
  }

  const acceptAll = () => {
    setChecked(Object.fromEntries(TERMS.map((t) => [t.id, true])))
    setExamOpen(false)
  }

  if (done) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">🎉</span>
          <h2 className="font-heading text-lg font-semibold">가입 완료</h2>
          <p className="text-sm text-muted-foreground">
            환영합니다. 분석적 사고력이 입증되었습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDone(false)
              setChecked({})
              setAnswer("")
            }}
          >
            처음부터
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1 border-b border-foreground/10 pb-4">
            <h2 className="font-heading text-base font-semibold">회원가입</h2>
            <p className="text-xs text-muted-foreground">
              아래 약관을 확인하고 동의해주세요.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            <li>
              <button
                type="button"
                onClick={() =>
                  setChecked(
                    allChecked
                      ? {}
                      : Object.fromEntries(TERMS.map((t) => [t.id, true]))
                  )
                }
                className="flex w-full items-center gap-3 rounded-md bg-muted/40 px-3 py-2.5 text-left transition-colors hover:bg-muted/70"
              >
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={() => {}}
                  className="pointer-events-none"
                />
                <span className="text-sm font-medium">전체 동의</span>
              </button>
            </li>
            {TERMS.map((t) => (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/40">
                  <Checkbox
                    checked={!!checked[t.id]}
                    onCheckedChange={(v) =>
                      setChecked((s) => ({ ...s, [t.id]: !!v }))
                    }
                  />
                  <span className="flex-1 text-sm">
                    <span
                      className={
                        t.required
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      [{t.required ? "필수" : "선택"}]
                    </span>{" "}
                    {t.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <Button onClick={submit} disabled={!requiredOk} className="w-full">
            가입하기
          </Button>
        </CardContent>
      </Card>

      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>거절 의사 확인 절차</DialogTitle>
            <DialogDescription>
              본 거부는 분석적 사고를 갖춘 회원에 한해 가능합니다. 아래 문제를
              풀어 의사를 확인해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-md bg-muted/50 px-4 py-5">
            <p className="text-xs text-muted-foreground">
              자연수 a₀ 에서 출발해 다음과 같이 정의된 수열에서
            </p>
            <Tex expr={PROBLEM_LATEX} display />
            <p className="text-sm font-medium">
              수열이 1에 도달하지 <span className="underline">않는</span>{" "}
              a₀ 의 개수는?
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              답안 (정수)
            </label>
            <Input
              ref={examInputRef}
              inputMode="numeric"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                setRejected(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAnswer()
              }}
              disabled={verifying}
              className="font-mono text-lg"
            />
            {verifying && (
              <p className="text-xs text-muted-foreground">
                답안 검증 중...
              </p>
            )}
            {rejected && !verifying && (
              <p className="text-xs text-destructive">
                본 문제는 현재 수학계 미해결 추측이므로 제출하신 답안의
                정합성을 검증할 수 없습니다. 추후 증명이 완료되는 대로 재
                검토 예정입니다.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={acceptAll}
              className="w-full sm:w-auto"
            >
              그냥 전체 동의할게요
            </Button>
            <Button
              type="button"
              onClick={submitAnswer}
              disabled={!answer.trim() || verifying}
              className="w-full sm:w-auto"
            >
              {verifying ? "검증 중..." : "제출"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function fireConfetti() {
  const duration = 1500
  const end = Date.now() + duration
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7"]
  ;(function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
