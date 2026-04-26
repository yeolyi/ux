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
]
