import { ProviderSvgIconKey } from "@renderer/app/hooks/useSvgIcon"

export function useSvgIcon() {
  const instance = inject(ProviderSvgIconKey)
  if (!instance) {
    throw new Error("useSvgIcon() is called outside of setup()")
  }
  return {
    providerSvgIcon: instance,
  }
}
