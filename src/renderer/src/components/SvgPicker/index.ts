import openmoji from "@iconify/json/json/openmoji.json"
import fluentEmojiFlat from "@iconify/json/json/fluent-emoji-flat.json"
import emojione from "@iconify/json/json/emojione.json"
import streamline from "@iconify/json/json/streamline-emojis.json"
import flag from "@iconify/json/json/circle-flags.json"
import type { IconifyJSON } from "@iconify/types"
import openmojiDefault from "~icons/openmoji/1st-place-medal"
import fluentEmojiFlatDefault from "~icons/fluent-emoji-flat/basketball"
import emojioneDefault from "~icons/emojione/flushed-face"
import streamlineDefault from "~icons/streamline-emojis/boar-1"
import flagDefault from "~icons/circle-flags/cn"
import type { Component } from "vue"
import { getIcons, getIconData, iconToSVG, iconToHTML } from "@iconify/utils"
import { sample } from "lodash-es"

export const getSubIconSet = (iconMap: IconifyJSON, allIconKeys: string[], from: number, length: number) => {
  return getIcons(iconMap as IconifyJSON, allIconKeys.slice(from, from + length))
}

export const getIconHTML = (json: IconifyJSON, iconKey: string) => {
  const icon = getIconData(json, iconKey)
  if (!icon) return ""
  const svg = iconToSVG(icon)
  return iconToHTML(svg.body, svg.attributes)
}

export const getDefaultIcon = (): string => {
  return getIconHTML(iconMap.fluentEmojiFlat.icons, sample(iconMap.fluentEmojiFlat.iconsKeys) ?? "plus")
}

export const iconMap: Record<string, { title: Component; icons: IconifyJSON; iconsKeys: string[] }> = {
  fluentEmojiFlat: {
    title: fluentEmojiFlatDefault,
    icons: fluentEmojiFlat as IconifyJSON,
    iconsKeys: Object.keys((fluentEmojiFlat as IconifyJSON).icons),
  },
  emojione: {
    title: emojioneDefault,
    icons: emojione as IconifyJSON,
    iconsKeys: Object.keys((emojione as IconifyJSON).icons),
  },
  streamline: {
    title: streamlineDefault,
    icons: streamline as IconifyJSON,
    iconsKeys: Object.keys((streamline as IconifyJSON).icons),
  },
  openmoji: {
    title: openmojiDefault,
    icons: openmoji as IconifyJSON,
    iconsKeys: Object.keys((openmoji as IconifyJSON).icons),
  },
  flag: {
    title: flagDefault,
    icons: flag as IconifyJSON,
    iconsKeys: Object.keys((flag as IconifyJSON).icons),
  },
}
