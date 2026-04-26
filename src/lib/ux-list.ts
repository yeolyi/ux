export type UxItem = {
  slug: string
  title: string
  description: string
}

export const uxList: UxItem[] = [
  {
    slug: "coord-map",
    title: "위도/경도 전용 지도",
    description:
      "지도 자체로는 조작할 수 없고, 아래의 위도·경도·줌 슬라이더로만 이동하는 카카오 지도",
  },
  {
    slug: "novel-keyboard",
    title: "소설 키보드",
    description:
      "이효석 「메밀꽃 필 무렵」 본문의 글자를 눌러 검색어를 만들고, 카카오 키워드 검색으로 지도에 표시",
  },
  {
    slug: "dice-captcha",
    title: "주사위 보안문자",
    description:
      "버튼을 누르면 4개의 주사위가 굴러 보안문자가 만들어진다. 다시 굴리거나 확인.",
  },
  {
    slug: "terms-rejection",
    title: "약관 거절 시험",
    description:
      "선택 약관에 동의하지 않으려면 분석적 사고 능력 확인을 위한 미적분 문제를 풀어야 한다.",
  },
  {
    slug: "yes-bot",
    title: "맞장구 챗봇",
    description:
      "무엇을 물어봐도 영양가 없는 추임새와 공감만 돌려주는 ChatGPT 풍 UI.",
  },
  {
    slug: "tilt-volume",
    title: "기울여서 볼륨 조절",
    description:
      "모바일 자이로로 기기를 기울여 음악 볼륨을 조절. 데스크탑에서는 안내만 표시.",
  },
  {
    slug: "calculator-paywall",
    title: "구독 계산기",
    description:
      "iOS 풍 계산기. 입력은 자유롭게 되지만 = 누르면 결제하라는 모달이 뜬다.",
  },
]
