const { Arch } = require("electron-builder")

const platformMapping = {
  darwin: ["x64", "arm64", "arm"],
  win32: ["x64", "arm64", "arm"],
  linux: ["x64", "arm64", "arm", "riscv64"],
  android: ["x64", "arm64", "arm"],
}
function getArchString(arch) {
  switch (arch) {
    case Arch.x64:
      return "x64"
    case Arch.arm64:
      return "arm64"
    case Arch.armv7l:
      return "armv7l"
    case Arch.ia32:
      return "ia32"
    default:
      return "unknown"
  }
}
function pickExcludeArchs(platform, arch) {
  const excludePatterns = []
  if (!platform || !arch) {
    return excludePatterns
  }
  if (!platformMapping[platform]) {
    return excludePatterns
  }
  if (!platformMapping[platform].includes(arch)) {
    return excludePatterns
  }
  Object.keys(platformMapping).forEach(otherPlatform => {
    if (otherPlatform !== platform) {
      platformMapping[otherPlatform].forEach(otherArch => {
        const normalizedArch = otherArch === "x86_64" ? "x64" : otherArch
        excludePatterns.push(`${otherPlatform}-${normalizedArch}`)
      })
    }
  })
  platformMapping[platform].forEach(otherArch => {
    if (otherArch !== arch) {
      const normalizedArch = otherArch === "x86_64" ? "x64" : otherArch
      const normalizedTargetArch = arch === "x86_64" ? "x64" : arch
      if (normalizedArch !== normalizedTargetArch) {
        excludePatterns.push(`${platform}-${normalizedArch}`)
      }
    }
  })
  return excludePatterns
}
/**
 * `@lancedb/lancedb` dependency
 */
function patch_lanceDB(context, platform, arch) {
  let fieldFiles = context.packager.config.files[0].filter
  const excludePlatforms = pickExcludeArchs(platform, arch)
  const excludeRules = excludePlatforms.map(p => {
    return `!node_modules/@lancedb/lancedb-${p}*/**`
  })
  fieldFiles.push(...excludeRules)
}
/**
 * `@napi-rs` dependency
 */
function patch_napi_rs(context, platform, arch) {
  let fieldFiles = context.packager.config.files[0].filter
  const excludePlatforms = pickExcludeArchs(platform, arch)
  const excludeRules = excludePlatforms.map(p => {
    return `!node_modules/@napi-rs/canvas-${p}*/**`
  })
  fieldFiles.push(...excludeRules)
}

exports.default = async function (context) {
  // const fieldAsarUnpack = context.packager.config.asarUnpack // asarUnpack filed in `electron-builder.yml`
  const platform = context.electronPlatformName // win32...
  const arch = getArchString(context.arch) // x64...
  console.log(`[package platform] ${platform}-${arch}`)
  patch_lanceDB(context, platform, arch)
  patch_napi_rs(context, platform, arch)
}
