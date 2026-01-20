const { notarize } = require("@electron/notarize")

exports.default = async function notarizing(context) {
  if (context.electronPlatformName !== "darwin") {
    return
  }
  // TODO: Notarize
  // await notarize({
  //   appPath,
  //   appBundleId: "com.arch.windflow",
  //   appleId: process.env.APPLE_ID,
  //   appleIdPassword: process.env.APPLE_SPECIFIC_PASSWORD,
  //   teamId: process.env.APPLE_TEAM_ID,
  // })
}
