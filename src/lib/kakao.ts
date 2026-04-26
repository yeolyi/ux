declare global {
  interface Window {
    kakao: any
  }
}

export function loadKakaoSdk(
  appkey: string,
  libraries: string[] = []
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  const libsParam =
    libraries.length > 0 ? `&libraries=${libraries.join(",")}` : ""
  if (window.kakao?.maps) {
    if (libraries.includes("services") && !window.kakao.maps.services) {
      // already loaded without services; can't lazy-add — caller should ensure consistency
    }
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const id = `kakao-maps-sdk${libsParam ? "-" + libraries.join("-") : ""}`
    const existing = document.getElementById(id) as HTMLScriptElement | null
    const onReady = () => window.kakao.maps.load(() => resolve())
    if (existing) {
      if (window.kakao?.maps) onReady()
      else existing.addEventListener("load", onReady, { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = id
    script.async = true
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false${libsParam}`
    script.onload = onReady
    script.onerror = () => reject(new Error("Kakao Maps SDK 로드 실패"))
    document.head.appendChild(script)
  })
}
