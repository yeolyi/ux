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
]
