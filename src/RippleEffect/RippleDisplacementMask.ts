import BrushImageUrl from "./brush.png"

type Ripple = {
  x: number;
  y: number;
  t: number;
  r: number;
}

export class RippleDisplacementMask {

  #canvas: HTMLCanvasElement
  #canvasContext: CanvasRenderingContext2D
  #ripples: Ripple[] = []
  #brushImage: HTMLImageElement | null = null
  #rotationSpeed = 2 * Math.PI * 0.0003
  #initialRippleSize = 50

  constructor() {
    this.#canvas = document.createElement("canvas")
    const ctx = this.#canvas.getContext("2d")
    if (ctx === null) {
      throw new Error("Could not create canvas context")
    }
    this.#canvasContext = ctx
  }

  ready() {
    return this.#brushImage !== null
  }

  setRippleSize(size: number) {
    this.#initialRippleSize = size
  }

  setCanvasSize(width: number, height: number) {
    this.#canvas.width = width
    this.#canvas.height = height
  }

  getCanvas() {
    return this.#canvas
  }

  async prepare(): Promise<void> {
    return new Promise((resolve, reject) => {
      const brushImage = new Image()
      brushImage.src = BrushImageUrl
      brushImage.onload = () => {
        this.#brushImage = brushImage
        resolve()
      }
      brushImage.onerror = (e) => {
        reject(e)
      }
    })
  }

  addRipple(x: number, y: number) {
    this.#ripples.push({
      x,
      y,
      t: performance.now(),
      r: Math.random() * 2 * Math.PI,
    })
  }

  private getBrushImage() {
    if (this.#brushImage === null) {
      throw new Error("Brush image not loaded")
    }
    return this.#brushImage
  }

  /**
   * Calculates the attenuation of the ripple based on how long it has been around.
   */
  private calculateAttenuation(dt: number) {
    return Math.pow(Math.E, -dt / 500)
  }

  /**
   * Calculates the size of the ripple based on how long it has been around.
   */
  private calculateSize(dt: number) {
    return this.#initialRippleSize / this.calculateAttenuation(dt)
  }

  /**
   * Removes ripples that have been around for too long.
   */
  private cleanRippleList() {
    const t = performance.now()
    this.#ripples = this.#ripples.filter(
      (ripple) => {
        const atten = this.calculateAttenuation(t - ripple.t)
        return atten > 0.1
      }
    )
  }

  render() {
    const t = performance.now()
    const brushImage = this.getBrushImage()
    this.cleanRippleList()
    this.#canvasContext.clearRect(0, 0, this.#canvas.width, this.#canvas.height)
    this.#ripples.forEach((ripple) => {
      const dt = t - ripple.t
      const rotation = this.#rotationSpeed * dt + ripple.r
      const size = this.calculateSize(dt)
      this.#canvasContext.globalAlpha = this.calculateAttenuation(dt)
      this.#canvasContext.translate(ripple.x, ripple.y)
      this.#canvasContext.rotate(rotation)
      this.#canvasContext.drawImage(
        brushImage,
        - size / 2,
        - size / 2,
        size,
        size
      )
      this.#canvasContext.resetTransform()
    })
  }
}