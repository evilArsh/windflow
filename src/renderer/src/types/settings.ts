import { Primitive } from "type-fest"

export type SettingsValue = Primitive | Array<Primitive> | { [key: string]: SettingsValue }
export type Settings<T extends SettingsValue> = {
  id: string // unique id
  desc?: string // setting description
  value: T
}
