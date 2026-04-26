import { useState } from "react"
import { Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Op = "add" | "subtract" | "multiply" | "divide"

const OP_SYM: Record<Op, string> = {
  add: "+",
  subtract: "−",
  multiply: "×",
  divide: "÷",
}

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "₩4,900",
    period: "/월",
    features: ["사칙연산 결과 보기", "광고 표시"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₩9,900",
    period: "/월",
    features: [
      "사칙연산 결과 무제한",
      "소수점 · 백분율 · 부호 변경",
      "광고 제거",
    ],
    highlight: true,
  },
  {
    id: "team",
    name: "Team",
    price: "₩29,900",
    period: "/월",
    features: [
      "Pro의 모든 기능",
      "메모리 기능 (M+, M−, MR, MC)",
      "최대 5명 공유",
    ],
    highlight: false,
  },
] as const

export default function CalculatorPaywall() {
  const [display, setDisplay] = useState("0")
  const [calc, setCalc] = useState("0")
  const [previous, setPrevious] = useState<number | null>(null)
  const [operation, setOperation] = useState<Op | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [activeOp, setActiveOp] = useState<Op | null>(null)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const inputNumber = (n: string) => {
    if (waiting) {
      setDisplay(n)
      setWaiting(false)
    } else {
      setDisplay(display === "0" ? n : display + n)
    }
    setActiveOp(null)
  }

  const inputDecimal = () => {
    if (waiting) {
      setDisplay("0.")
      setWaiting(false)
      return
    }
    if (!display.includes(".")) setDisplay(display + ".")
  }

  const clear = () => {
    setDisplay("0")
    setCalc("0")
    setPrevious(null)
    setOperation(null)
    setWaiting(false)
    setActiveOp(null)
  }

  const backspace = () => {
    if (waiting) return
    if (display.length > 1) setDisplay(display.slice(0, -1))
    else setDisplay("0")
  }

  const percent = () => {
    setDisplay(String(parseFloat(display) / 100))
  }

  const toggleSign = () => {
    setDisplay(String(parseFloat(display) * -1))
  }

  const setOp = (op: Op) => {
    const current = parseFloat(display)
    if (previous === null) {
      setPrevious(current)
    } else if (operation && !waiting) {
      // chain
      const result = compute(previous, current, operation)
      setPrevious(result)
      setDisplay(formatResult(result))
      setCalc(`${formatResult(result)} ${OP_SYM[op]}`)
      setOperation(op)
      setWaiting(true)
      setActiveOp(op)
      return
    }
    setOperation(op)
    setWaiting(true)
    setActiveOp(op)
    setCalc(`${display} ${OP_SYM[op]}`)
  }

  const equals = () => {
    if (operation == null || previous == null) return
    if (!subscribed) {
      setPaywallOpen(true)
      return
    }
    const current = parseFloat(display)
    const result = compute(previous, current, operation)
    setCalc(`${formatResult(previous)} ${OP_SYM[operation]} ${formatResult(current)} =`)
    setDisplay(formatResult(result))
    setPrevious(null)
    setOperation(null)
    setWaiting(true)
    setActiveOp(null)
  }

  const compute = (a: number, b: number, op: Op): number => {
    switch (op) {
      case "add":
        return a + b
      case "subtract":
        return a - b
      case "multiply":
        return a * b
      case "divide":
        return b === 0 ? NaN : a / b
    }
  }

  const subscribe = () => {
    setSubscribed(true)
    setPaywallOpen(false)
    setTimeout(() => equals(), 0)
  }

  const displayText = display.length > 11 ? formatResult(parseFloat(display)) : display

  return (
    <>
      <div className="mx-auto w-full max-w-[360px] rounded-[28px] bg-black p-5 text-white ring-1 ring-white/10">
        <div className="mb-6 flex flex-col items-end gap-1.5 px-2 pt-2">
          <div className="min-h-[24px] text-base text-zinc-400 tabular-nums">
            {calc}
          </div>
          <div className="text-6xl font-light leading-none tabular-nums break-all">
            {displayText}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <Btn variant="fn" onClick={backspace}>⌫</Btn>
          <Btn variant="fn" onClick={clear}>AC</Btn>
          <Btn variant="fn" onClick={percent}>%</Btn>
          <Btn
            variant="op"
            active={activeOp === "divide"}
            onClick={() => setOp("divide")}
          >
            ÷
          </Btn>

          <Btn variant="num" onClick={() => inputNumber("7")}>7</Btn>
          <Btn variant="num" onClick={() => inputNumber("8")}>8</Btn>
          <Btn variant="num" onClick={() => inputNumber("9")}>9</Btn>
          <Btn
            variant="op"
            active={activeOp === "multiply"}
            onClick={() => setOp("multiply")}
          >
            ×
          </Btn>

          <Btn variant="num" onClick={() => inputNumber("4")}>4</Btn>
          <Btn variant="num" onClick={() => inputNumber("5")}>5</Btn>
          <Btn variant="num" onClick={() => inputNumber("6")}>6</Btn>
          <Btn
            variant="op"
            active={activeOp === "subtract"}
            onClick={() => setOp("subtract")}
          >
            −
          </Btn>

          <Btn variant="num" onClick={() => inputNumber("1")}>1</Btn>
          <Btn variant="num" onClick={() => inputNumber("2")}>2</Btn>
          <Btn variant="num" onClick={() => inputNumber("3")}>3</Btn>
          <Btn
            variant="op"
            active={activeOp === "add"}
            onClick={() => setOp("add")}
          >
            +
          </Btn>

          <Btn variant="fn" onClick={toggleSign}>+/−</Btn>
          <Btn variant="num" onClick={() => inputNumber("0")}>0</Btn>
          <Btn variant="num" onClick={inputDecimal}>.</Btn>
          <Btn variant="op" onClick={equals}>=</Btn>
        </div>

        {subscribed && (
          <p className="mt-4 text-center text-[11px] text-emerald-400">
            ✓ Pro 구독 활성화됨
          </p>
        )}
      </div>

      <Dialog open={paywallOpen} onOpenChange={setPaywallOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              결과를 확인하려면 구독이 필요해요
            </DialogTitle>
            <DialogDescription>
              계산기 입력은 무료로 이용하실 수 있지만, 사칙연산 결과를
              확인하시려면 유료 플랜으로 업그레이드해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className={
                  "relative flex flex-col gap-2 rounded-lg p-4 ring-1 " +
                  (p.highlight
                    ? "bg-primary/5 ring-primary"
                    : "ring-foreground/10")
                }
              >
                {p.highlight && (
                  <span className="absolute -top-2 right-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    추천
                  </span>
                )}
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="flex items-baseline gap-1">
                  <span className="text-xl font-bold tabular-nums">
                    {p.price}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {p.period}
                  </span>
                </p>
                <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1">
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-foreground/10 pt-4">
            <Button onClick={subscribe} className="w-full">
              30일 무료 체험 시작 · Pro
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPaywallOpen(false)}
              className="w-full text-xs text-muted-foreground"
            >
              나중에 결정할게요
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              체험 종료 시 ₩9,900/월 자동 결제됩니다. 언제든 해지 가능.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function formatResult(n: number): string {
  if (!isFinite(n)) return "오류"
  const s = Number.isInteger(n) ? n.toString() : n.toPrecision(10)
  return parseFloat(s).toString()
}

function Btn({
  variant,
  active,
  onClick,
  children,
}: {
  variant: "num" | "fn" | "op"
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const base =
    "h-[68px] w-full rounded-full text-[28px] font-light transition-all active:scale-95 select-none"
  const styles =
    variant === "num"
      ? "bg-zinc-700/90 text-white hover:bg-zinc-600/90"
      : variant === "fn"
        ? "bg-zinc-300 text-black hover:bg-zinc-200 text-2xl"
        : active
          ? "bg-white text-orange-500 hover:bg-white"
          : "bg-orange-500 text-white hover:bg-orange-400"
  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  )
}
