import { useEffect, useRef, useState } from "react"
import { Sparkles, ArrowUp, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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

const MODEL_LABEL = "GPT-맞장구"

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

    const delay = 500 + Math.random() * 700
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ])
      setPending(false)
    }, delay)
  }

  const newChat = () => {
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
    <div className="flex h-[640px] flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <header className="flex items-center justify-between border-b border-foreground/10 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4" />
          {MODEL_LABEL}
        </div>
        <Button size="sm" variant="ghost" onClick={newChat}>
          <Plus className="mr-1 size-4" /> 새 대화
        </Button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <h2 className="font-heading text-xl font-medium">
              무엇이든 물어보세요
            </h2>
            <p className="text-sm text-muted-foreground">
              {MODEL_LABEL} 가 곁에서 도와드릴게요.
            </p>
          </div>
        ) : (
          <ul className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6">
            {messages.map((m) =>
              m.role === "user" ? (
                <li key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm whitespace-pre-wrap text-primary-foreground">
                    {m.content}
                  </div>
                </li>
              ) : (
                <li key={m.id} className="flex gap-3">
                  <Avatar />
                  <div className="flex-1 pt-0.5 text-sm leading-relaxed whitespace-pre-wrap">
                    <RichText text={m.content} />
                  </div>
                </li>
              )
            )}
            {pending && (
              <li className="flex gap-3">
                <Avatar />
                <div className="flex items-center gap-1 pt-2">
                  <Dot delay={0} />
                  <Dot delay={150} />
                  <Dot delay={300} />
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="border-t border-foreground/10 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl bg-background p-2 ring-1 ring-foreground/15 focus-within:ring-foreground/30">
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="메시지 보내기..."
            rows={1}
            className="max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none ring-0 focus-visible:ring-0"
          />
          <Button
            size="icon-sm"
            onClick={send}
            disabled={!input.trim() || pending}
            className="rounded-full"
            aria-label="보내기"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {MODEL_LABEL} 는 실수를 할 수 있습니다. 중요한 정보는 직접
          확인하세요.
        </p>
      </div>
    </div>
  )
}

function Avatar() {
  return (
    <div className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">
      <Sparkles className="size-4" />
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="size-1.5 animate-pulse rounded-full bg-foreground/40"
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
