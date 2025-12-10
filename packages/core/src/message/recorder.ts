export interface RecorderRules{

}
export class Recorder<K, V> {
  #record: Map<K, V>
  constructor() {
    this.#record = new Map()
  }
}
