import Stats from "stats.js";
import { RippleDisplacementMask } from "./RippleEffect/RippleDisplacementMask";
import { DisplacementEffector } from "./RippleEffect/DisplacementEffector";
import { SupportedModels, createDetector } from "@tensorflow-models/hand-pose-detection"
const { MediaPipeHands } = SupportedModels

const stats = new Stats()
document.body.appendChild(stats.dom)

async function main() {
  const detector = await createDetector(MediaPipeHands, {
    runtime: "mediapipe",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1635986972/",
  })

  const mainCanvas = document.createElement("canvas")
  const mainContext = mainCanvas.getContext("2d")!
  mainCanvas.style.height = "100vh"
  mainCanvas.style.width = "100vw"
  mainCanvas.style.transform = "scale(-1, 1)"
  document.querySelector(".container")!.appendChild(mainCanvas)

  const rippleEffector = new DisplacementEffector()
  const rippleMask = new RippleDisplacementMask()
  await rippleMask.prepare()

  const cameraVideo = document.createElement("video");
  const cameraCanvas = document.createElement("canvas");
  cameraVideo.addEventListener("playing", () => {
    const vw = cameraVideo.videoWidth
    const vh = cameraVideo.videoHeight
    mainCanvas.width = vw
    mainCanvas.height = vh
    mainCanvas.style.maxHeight = `calc(100vw * ${vh / vw})`
    mainCanvas.style.maxWidth = `calc(100vh * ${vw / vh})`
    cameraCanvas.width = vw
    cameraCanvas.height = vh
    rippleEffector.setSize(vw, vh)
    rippleMask.setCanvasSize(vw, vh)
    requestAnimationFrame(process)
  })
  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: {
          ideal: 1280
        },
        height: {
          ideal: 720
        }
      },
    })
    .then(function (stream) {
      cameraVideo.srcObject = stream;
      cameraVideo.play();
    })
    .catch(function (e) {
      console.log(e)
      console.log("Something went wrong!");
    });
  } else {
    alert("getUserMedia not supported on your browser!");
  }

  let prevX = 0
  let prevY = 0
  async function process () {
    stats.begin()
    cameraCanvas.getContext("2d")!.drawImage(cameraVideo, 0, 0)
    const hands = await detector.estimateHands(cameraCanvas)
    if (hands.length > 0) {
      const indexFinger = hands[0].keypoints[8]
      const { x, y } = indexFinger
      if ((Math.abs(x - prevX) > 4 || Math.abs(y - prevY) > 4)) {
        rippleMask.addRipple(x, y)
        prevX = x
        prevY = y
      }
    }
    rippleMask.render()
    rippleEffector.process(cameraCanvas, rippleMask.getCanvas())
    mainContext.clearRect(0, 0, mainCanvas.width, mainCanvas.height)
    mainContext.drawImage(rippleEffector.getCanvas(), 0, 0, mainCanvas.width, mainCanvas.height)
    stats.end()
    requestAnimationFrame(process)
  }
}

main()