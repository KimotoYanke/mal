import * as Types from './types'
export class Env {
  constructor (outer, binds, exprs) {
    this.outer = outer || { find: () => undefined }
    this.data = {}

    if (binds && exprs) {
      for (let i = 0; i < binds.length; i++) {
        if (binds[i].name === '&') {
          this.data[binds[i + 1].name] = new Types.List(exprs.slice(i))
          break
        }
        this.data[binds[i]] = exprs[i]
      }
    }
  }
  set (name, malStructure) {
    this.data[name] = malStructure
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
