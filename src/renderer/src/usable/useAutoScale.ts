export type AutoScaleType = "fit" | "scrollX" | "scrollY" | "full"
export interface AutoConfig {
  baseWidth?: number
  baseHeight?: number
  outerWidth?: number
  outerHeight?: number
  type?: AutoScaleType
  callback?: (scale: { width: number; height: number }) => void
}
export default (initConf?: AutoConfig) => {
  const conf: Required<AutoConfig> = {
    callback: initConf?.callback ?? (() => {}),
    // 画布尺寸
    baseWidth: initConf?.baseWidth ?? 1920,
    baseHeight: initConf?.baseHeight ?? 1080,
    // 外容器尺寸
    outerWidth: initConf?.outerWidth ?? 1920,
    outerHeight: initConf?.outerHeight ?? 1080,
    type: initConf?.type ?? "fit",
  }
  //   默认缩放值
  const scale = {
    width: 1,
    height: 1,
  }
  const baseProportion = parseFloat((conf.baseWidth / conf.baseHeight).toFixed(5)) // 需保持的比例
  let calcFunc: () => void = () => {}
  // 自适应
  const calcRateFit = () => {
    // 当前屏幕宽高比
    const currentRate = parseFloat((conf.outerWidth / conf.outerHeight).toFixed(5))
    if (currentRate > baseProportion) {
      // 表示更宽
      scale.width = parseFloat(((conf.outerHeight * baseProportion) / conf.baseWidth).toFixed(5))
      scale.height = parseFloat((conf.outerHeight / conf.baseHeight).toFixed(5))
    } else {
      // 表示更高
      scale.height = parseFloat((conf.outerWidth / baseProportion / conf.baseHeight).toFixed(5))
      scale.width = parseFloat((conf.outerWidth / conf.baseWidth).toFixed(5))
    }
    conf.callback(scale)
  }
  // Y轴撑满，X轴滚动条
  const calcRateScrollX = () => {
    scale.width = parseFloat(((conf.outerHeight * baseProportion) / conf.baseWidth).toFixed(5))
    scale.height = parseFloat((conf.outerHeight / conf.baseHeight).toFixed(5))
    conf.callback(scale)
  }
  // X轴撑满，Y轴滚动条
  const calcRateScrollY = () => {
    scale.height = parseFloat((conf.outerWidth / baseProportion / conf.baseHeight).toFixed(5))
    scale.width = parseFloat((conf.outerWidth / conf.baseWidth).toFixed(5))
    conf.callback(scale)
  }
  // 宽高铺满
  const calcRateFull = () => {
    scale.width = parseFloat((conf.outerWidth / conf.baseWidth).toFixed(5))
    scale.height = parseFloat((conf.outerHeight / conf.baseHeight).toFixed(5))
    conf.callback(scale)
  }
  /**
   * 更新监听类型
   */
  function update(_conf?: AutoConfig) {
    Object.assign(conf, _conf)
    switch (conf.type) {
      case "full":
        calcFunc = calcRateFull
        break
      case "scrollX":
        calcFunc = calcRateScrollX
        break
      case "scrollY":
        calcFunc = calcRateScrollY
        break
      case "fit":
      default:
        calcFunc = calcRateFit
        break
    }
  }
  function rescale() {
    calcFunc()
  }
  return {
    update,
    rescale,
  }
}
