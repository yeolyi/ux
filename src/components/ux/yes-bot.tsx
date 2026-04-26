import { useEffect, useRef, useState } from "react"
import { Sparkles, ArrowUp, RotateCcw, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  isQuestion,
  pickRandom,
  validationReplies,
  nonQuestionReplies,
} from "@/lib/yes-bot"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const MODEL_LABEL = "Aurora"
const MODEL_VERSION = "1.2"

export default function YesBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [pending, setPending] = useState(false)
  const lastReplyRef = useRef<string | undefined>(undefined)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, pending])

  const send = () => {
    const text = input.trim()
    if (!text || pending) return
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setPending(true)

    const pool = isQuestion(text) ? validationReplies : nonQuestionReplies
    const reply = pickRandom(pool, lastReplyRef.current)
    lastReplyRef.current = reply

    const delay = 600 + Math.random() * 700
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ])
      setPending(false)
    }, delay)
  }

  const reset = () => {
    setMessages([])
    setInput("")
    setPending(false)
    lastReplyRef.current = undefined
    setTimeout(() => taRef.current?.focus(), 0)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const empty = messages.length === 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-foreground/10 pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
              <Sparkles className="size-3.5" />
            </span>
            <span className="flex items-baseline gap-1.5">
              {MODEL_LABEL}
              <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                {MODEL_VERSION}
              </span>
            </span>
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={reset}
            disabled={empty && !input}
          >
            <RotateCcw className="mr-1 size-3.5" />
            새 대화
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-0">
        <div
          ref={scrollRef}
          className="flex h-[480px] flex-col gap-5 overflow-y-auto px-6 py-6"
        >
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                <Sparkles className="size-5" />
              </span>
              <h3 className="font-heading text-lg font-medium">
                안녕하세요, 저는 {MODEL_LABEL} 입니다.
              </h3>
              <p className="text-sm text-muted-foreground">
                무엇이든 편하게 물어봐 주세요.
              </p>
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end gap-3">
                  <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
                    {m.content}
                  </div>
                  <Avatar size="sm">
                    <AvatarFallback>
                      <User className="size-3.5" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                      <Sparkles className="size-3.5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                    <RichText text={m.content} />
                  </div>
                </div>
              )
            )
          )}
          {pending && (
            <div className="flex gap-3">
              <Avatar size="sm">
                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                  <Sparkles className="size-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                <Dot delay={0} />
                <Dot delay={150} />
                <Dot delay={300} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-foreground/10 bg-muted/30 p-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="메시지 보내기"
              rows={1}
              className="max-h-40 min-h-9 flex-1 resize-none bg-background py-2"
            />
            <Button
              size="icon"
              onClick={send}
              disabled={!input.trim() || pending}
              aria-label="보내기"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {MODEL_LABEL} 는 부정확한 답을 할 수 있습니다. 중요한 정보는
            반드시 다시 확인해주세요.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block size-1.5 animate-pulse rounded-full bg-foreground/40"
      style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
    />
  )
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        /^\*\*[^*]+\*\*$/.test(p) ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}
