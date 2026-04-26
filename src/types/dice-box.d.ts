declare module "@3d-dice/dice-box" {
  type Options = {
    assetPath: string
    theme?: string
    themeColor?: string
    scale?: number
    enableShadows?: boolean
    offscreen?: boolean
    delay?: number
    throwForce?: number
    lightIntensity?: number
    container?: string
  }
  export default class DiceBox {
    constructor(selector: string | HTMLElement, options: Options)
    constructor(options: Options)
    init(): Promise<void>
    roll(notation: string): Promise<unknown>
    clear(): void
    onRollComplete: (results: any) => void
  }
}
