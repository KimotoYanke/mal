import * as Types from './types'
export class Env {
  constructor (outer) {
    this.outer = outer || { find: () => undefined }
    this.data = {}
  }
  set (malStructure, name) {
    this.data[name || malStructure.name] = malStructure
    return malStructure
  }
  find (name) {
    return this.data[name] || this.outer.find(name)
  }
  get (name) {
    const result = this.find(name)
    if (!result) {
      throw new Error(`${name} is not found.`)
    }
    return result
  }
  getBySymbol (symbol) {
    if (!(symbol instanceof Types.Symbol)) {
      throw new Error(`${symbol.name} is not a symbol`)
    }
    return this.get(symbol.name)
  }
}
