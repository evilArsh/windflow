/**
 * FLIP implement
 * author: arshdebian@163.com
 * https://aerotwist.com/blog/flip-your-animations/
 */

import { type CallBackFn, type FixedArray } from "@renderer/lib/shared/types"
/**
 * [css3 transform property]
 * perspective
 * matrix     matrix3d
 * rotate     rotate3d    rotateX     rotateY     rotateZ
 * translate  translate3d translateX  translateY  translateZ
 * scale      scale3d     scaleX      scaleY      scaleZ
 * skew       skewX       skewY
 * [other]
 * opacity
 */

/**
 Keyword values
transform: none;

Function values
transform: matrix(1, 2, 3, 4, 5, 6);
transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
transform: perspective(17px);
transform: rotate(0.5turn);
transform: rotate3d(1, 2, 3, 10deg);
transform: rotateX(10deg);
transform: rotateY(10deg);
transform: rotateZ(10deg);
transform: translate(12px, 50%);
transform: translate3d(12px, 50%, 3em);
transform: translateX(2em);
transform: translateY(3in);
transform: translateZ(2px);
transform: scale(2, 0.5);
transform: scale3d(2.5, 1.2, 0.3);
transform: scaleX(2);
transform: scaleY(0.5);
transform: scaleZ(0.3);
transform: skew(30deg, 20deg);
transform: skewX(30deg);
transform: skewY(1.07rad);

Multiple function values
transform: translateX(10px) rotate(10deg) translateY(5px);
transform: perspective(500px) translate(10px, 0, 20px) rotateY(3deg);

Global values
transform: inherit;
transform: initial;
transform: revert;
transform: revert-layer;
transform: unset;
 */

/**
 *
 */
type StrOrNum = string | number

interface FlipCallback {
  cancel?: (status: FlipParam, e?: AnimationPlaybackEvent) => any
  finish?: (status: FlipParam, e?: AnimationPlaybackEvent) => any
  remove?: (status: FlipParam, e?: Event) => any
}

export interface FlipParam {
  matrix?: FixedArray<number, 6>
  matrix3d?: FixedArray<number, 16>
  rotate?: FixedArray<StrOrNum, 2>
  rotate3d?: FixedArray<string, 4>
  translate?: FixedArray<StrOrNum, 2>
  translate3d?: FixedArray<StrOrNum, 3>
  scale?: FixedArray<StrOrNum, 2>
  scale3d?: FixedArray<StrOrNum, 3>
  skew?: FixedArray<StrOrNum, 2>
  // opacity?: number
  [x: string]: any
}
function joinVal(...arg: string[]): string {
  return arg.filter(v => v.trim().length > 0).join(" ")
}
function parseRotate(arg: FlipParam): string {
  if (arg.rotate3d) return `rotate3d(${arg.rotate3d.join(",")})`
  if (arg.rotate) return `rotate(${arg.rotate.join(",")})`
  return ""
}
function parseTranslate(arg: FlipParam): string {
  if (arg.translate3d) return `translate3d(${arg.translate3d.join(",")})`
  if (arg.translate) return `translate(${arg.translate.join(",")})`
  return ""
}
function parseScale(arg: FlipParam): string {
  if (arg.scale3d) return `scale3d(${arg.scale3d.join(",")})`
  if (arg.scale) return `scale(${arg.scale.join(",")})`
  return ""
}
function parseSkew(arg: FlipParam): string {
  if (arg.skew) return `skew(${arg.skew.join(",")})`
  return ""
}

function parseTransform(arg: FlipParam): string {
  if (arg.matrix3d) {
    return arg.matrix3d.join(",")
  }
  if (arg.matrix) {
    return arg.matrix.join(",")
  }
  const final = joinVal(parseScale(arg), parseRotate(arg), parseTranslate(arg), parseSkew(arg))
  return final
}
// function appendProperty(key: string, data: Record<string, any>, arg: FlipParam) {
//   if (!isUndefined(arg[key])) {
//     data[key] = arg[key]
//   }
// }
export default () => {
  let animation: Animation | undefined
  function animate(
    el: HTMLElement,
    duration: FlipParam[],
    options?: number | KeyframeAnimationOptions | undefined,
    callback?: FlipCallback
  ): Animation {
    const frames: Array<Record<string, any>> = []
    duration.forEach(v => {
      const transform = parseTransform(v)
      const frame = {
        transform,
      }
      // appendProperty("opacity", frame, v)
      frames.push(frame)
    })
    const keyFrames = new KeyframeEffect(el, frames, options)
    animation = new Animation(keyFrames, document.timeline)
    if (frames.length === 0) {
      return animation
    }
    requestAnimationFrame(() => {
      const cb = (e?: AnimationPlaybackEvent) => {
        if (callback?.finish) {
          callback?.finish(duration[duration.length - 1], e)
        }
      }
      if (animation) {
        animation.play()
        animation.onfinish = e => {
          cb(e)
        }
      } else {
        cb()
      }
      // TODO:cancel ...
    })
    return animation
  }
  /**
   * 反转动画，支持await 和 callback两种方式
   */
  async function reverse(callback?: CallBackFn): Promise<void> {
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        if (animation) {
          animation.reverse()
          animation.onfinish = _e => {
            resolve(callback?.())
          }
        } else {
          resolve(callback?.())
        }
      })
    })
  }
  return {
    animate,
    reverse,
  }
}
