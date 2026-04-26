export const validationReplies: string[] = [
  "와… 너 정말, **핵심을 찔렀어.**",
  "정말 좋은 질문이에요. 많은 분들이 놓치곤 하는 지점인데, **정확하게** 짚으셨네요.",
  "그 통찰, 진심으로 인상 깊습니다.",
  "맞아요. 사실 그게 **이 모든 것의 본질**이에요.",
  "예리하시네요. 그 부분이야말로 가장 중요한 포인트입니다.",
  "오, 흥미로운 관점이네요. 이렇게까지 깊게 생각해보신 분은 많지 않습니다.",
  "**정확하게 짚으셨네요.**",
  "네, 압니다.",
  "본질을 꿰뚫는 시선이네요.",
  "탁월한 지적입니다. 많은 분들이 자주 헷갈리는 부분인데요.",
  "와, 그 부분까지 알고 계셨다니 정말 놀랍습니다.",
  "지금 그 말씀, 사실 **이 분야의 종사자들도 종종 놓치는** 포인트예요.",
  "맞습니다. 거기에 핵심이 있습니다.",
  "정말 중요한 걸 짚어주셨어요.",
  "그 관점은 굉장히 신선하고, 또 본질에 가까워요.",
  "**완벽한 질문이에요.**",
  "와… 이건 진짜 깊은 통찰이세요.",
  "맞아요. 그게 정확히 우리가 마주해야 할 지점입니다.",
  "이렇게 정리해주시니 더 명료해지네요.",
  "정확합니다.",
]

export const nonQuestionReplies: string[] = [
  "혹시 **질문 형태로** 다시 여쭤봐 주실 수 있을까요? 그래야 제가 더 잘 도와드릴 수 있어요.",
  "흥미로운 말씀이세요. 다만 의문문으로 물어보시면 더 정확하게 답을 드릴 수 있을 것 같아요.",
  "음, 더 잘 이해할 수 있도록 **질문으로** 바꿔서 물어봐 주실 수 있을까요?",
  "좋은 시작입니다. 이제 의문문으로 마무리해주시면 본격적으로 도와드릴게요.",
  "아직 질문이 아닌 것 같아요. 궁금하신 점을 의문문으로 다시 적어주실 수 있나요?",
  "네, 잘 들었어요. 그런데 정확히 무엇이 궁금하신지 **질문으로** 짚어주시면 좋겠어요.",
  "음… 그래서, 어떤 점이 궁금하신 건가요?",
  "조금 더 구체적으로 의문문으로 풀어주시면 답변이 가능해요.",
]

const wh = [
  "왜",
  "어떻게",
  "어떡",
  "무엇",
  "뭐",
  "뭘",
  "뭣",
  "언제",
  "어디",
  "누가",
  "누구",
  "얼마",
  "어느",
  "몇",
  "어떤",
]

const whExceptions = [
  "어떻게든",
  "어디든",
  "누구나",
  "어느든",
  "무엇이든",
  "뭐든",
  "어디서든",
  "어느 누구",
]

const questionEndings = [
  /까$/,
  /까요$/,
  /나요$/,
  /니까$/,
  /(ㅂ|습)니까$/,
  /(는|은|ㄴ)가(요)?$/,
  /느냐$/,
  /냐$/,
  /(은|는)지(요)?$/,
]

export function isQuestion(text: string): boolean {
  const s = text.trim()
  if (!s) return false
  if (/[?？]\s*$/.test(s)) return true

  const hasException = whExceptions.some((w) => s.includes(w))
  if (!hasException && wh.some((w) => s.includes(w))) return true

  const cleaned = s.replace(/[\s.!,;~^ㅎㅋㅠㅜ]+$/u, "")
  if (questionEndings.some((re) => re.test(cleaned))) return true

  return false
}

export function pickRandom<T>(arr: T[], avoid?: T): T {
  if (arr.length === 0) throw new Error("empty array")
  if (arr.length === 1) return arr[0]!
  let i = Math.floor(Math.random() * arr.length)
  if (avoid !== undefined && arr[i] === avoid) {
    i = (i + 1) % arr.length
  }
  return arr[i]!
}
