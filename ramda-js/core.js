import * as Types from './types'
import { readline } from './node_readline'
import {
  __,
  add,
  apply,
  concat,
  divide,
  map,
  mapObjIndexed,
  merge,
  mergeAll,
  multiply,
  subtract,
  unnest
} from 'ramda'
import fs from 'fs'
import path from 'path'
import { printStr } from './printer'
import { readStr } from './reader'

const equals = (ast1, ast2) => {
  // console.log(ast1, ast2)
  const astAnd = f => f(ast1) && f(ast2)
  if (astAnd(a => a instanceof Types.MalBoolean)) {
    return ast1.booleanValue === ast2.booleanValue
  }
  if (astAnd(a => a instanceof Types.Nil)) {
    return true
  }
  if (astAnd(a => a instanceof Types.Float || a instanceof Types.Int)) {
    return ast1.number === ast2.number
  }
  if (astAnd(a => a instanceof Types.Keyword)) {
    return ast1.name === ast2.name
  }
  if (astAnd(a => a instanceof Types.Symbol)) {
    return ast1.name === ast2.name
  }
  if (astAnd(a => a instanceof Types.MalString)) {
    return ast1.str === ast2.str
  }
  if (
    astAnd(a => a instanceof Types.Vector || a instanceof Types.List) &&
    ast1.contents.length === ast2.contents.length &&
    ast1.contents.length > 0
  ) {
    for (let i in ast1.contents) {
      if (!equals(ast1.contents[i], ast2.contents[i])) {
        return false
      }
    }
    return true
  }
  if (
    astAnd(a => a instanceof Types.Vector || a instanceof Types.List) &&
    ast1.contents.length === ast2.contents.length
  ) {
    return true
  }
  if (astAnd(a => a instanceof Types.HashMap)) {
    if (ast1.contents.size !== ast2.contents.size) {
      return false
    }
    for (let k1 of ast1.contents.keys()) {
      for (let k2 of ast2.contents.keys()) {
        if (equals(k1, k2)) {
          if (!equals(ast1.contents.get(k1), ast2.contents.get(k2))) {
            return false
          }
        }
      }
    }
    return true
  }
  return false
}
const getFromMap = (map, key) => {
  if (!(map instanceof Types.HashMap)) {
    return Types.nil
  }
  for (let k of map.contents.keys()) {
    if (equals(k, key)) {
      return map.contents.get(k)
    }
  }
  return Types.nil
}

const nsApplizedFunction = mapObjIndexed(__, {
  '+': add,
  '-': subtract,
  '*': multiply,
  '/': divide,
  'list?': ast => ast instanceof Types.List,
  'vector?': ast => ast instanceof Types.Vector,
  'map?': ast => ast instanceof Types.HashMap,
  'sequential?': ast =>
    ast instanceof Types.HashMap ||
    ast instanceof Types.List ||
    ast instanceof Types.Vector,
  'empty?': ast => (ast.contents ? ast.contents.length === 0 : false),
  count: ast =>
    ast.contents
      ? ast.contents.length
      : ast instanceof Types.Nil ? 0 : Types.nil,
  '=': (ast1, ast2) => {
    return equals(ast1, ast2)
  },
  '>': (ast1, ast2) => {
    const astAnd = f => f(ast1) && f(ast2)
    if (astAnd(a => a instanceof Types.Int || a instanceof Types.Float)) {
      return ast1.number > ast2.number
    }
    return false
  },
  '<': (ast1, ast2) => {
    const astAnd = f => f(ast1) && f(ast2)
    if (astAnd(a => a instanceof Types.Int || a instanceof Types.Float)) {
      return ast1.number < ast2.number
    }
    return false
  },
  '>=': (ast1, ast2) => {
    const astAnd = f => f(ast1) && f(ast2)
    if (astAnd(a => a instanceof Types.Int || a instanceof Types.Float)) {
      return ast1.number >= ast2.number
    }
    return false
  },
  '<=': (ast1, ast2) => {
    const astAnd = f => f(ast1) && f(ast2)
    if (astAnd(a => a instanceof Types.Int || a instanceof Types.Float)) {
      return ast1.number <= ast2.number
    }
    return false
  },
  'read-string': ast => {
    return readStr(ast.str)[0]
  },
  slurp: f => fs.readFileSync(path.resolve(f.toString(false)), 'utf-8'),
  atom: val => new Types.Atom(val),
  'atom?': atom => atom instanceof Types.Atom,
  deref: atom => atom.val,
  'reset!': (atom, newVal) => {
    atom.val = newVal
    return newVal
  },
  'swap!': (atom, f, ...args) => {
    let result = atom.val
    result = f.call([result, ...args])
    atom.val = result
    return atom.val
  },
  cons: (el, list) => {
    if (list instanceof Types.Nil) {
      return new Types.List([el])
    }
    return new Types.List([el, ...list.contents])
  },
  nth: (l, n) => {
    if (l instanceof Types.Nil) {
      return Types.nil
    }
    if (!(l instanceof Types.Seq)) {
      throw new Error(`${l} is not a seq`)
    }
    if (l.contents.length === 0) {
      return Types.nil
    }
    if (n < 0 || n >= l.contents.length) {
      throw new Error('Out of range')
    }
    return l.contents[n]
  },
  first: l => {
    if (l instanceof Types.Nil) {
      return Types.nil
    }
    if (!(l instanceof Types.Seq)) {
      throw new Error(`${l} is not a seq`)
    }
    if (l.contents.length === 0) {
      return Types.nil
    }
    return l.contents[0]
  },
  rest: l => {
    if (l instanceof Types.Nil) {
      return new Types.List([])
    }
    if (!(l instanceof Types.Seq)) {
      throw new Error(`${l} is not a seq`)
    }
    if (l.contents.length === 0) {
      return new Types.List([])
    }
    return new Types.List(l.contents.slice(1))
  },
  throw: e => {
    throw e
  },
  'nil?': ast => ast instanceof Types.Nil,
  'true?': ast => ast instanceof Types.MalBoolean && ast.booleanValue === true,
  'false?': ast =>
    ast instanceof Types.MalBoolean && ast.booleanValue === false,

  symbol: str => new Types.Symbol(str.toString(false)),
  'symbol?': ast => ast instanceof Types.Symbol,
  keyword: str => new Types.Keyword(str.toString(false)),
  'keyword?': ast => ast instanceof Types.Keyword,

  dissoc: (map, ...keys) => {
    const result = new Map(Array.from(map.contents.entries()))
    for (let k of map.contents.keys()) {
      for (let key of keys) {
        if (equals(k, key) || key.toString() === k) {
          result.delete(k)
        }
      }
    }
    return new Types.HashMap(result)
  },
  assoc: (map, ...args) => {
    const result = new Map(Array.from(map.contents.entries()))

    if (args.length % 2 !== 0) {
      throw new Error(`${args} is not odd number`)
    }
    for (let i = 0; i < args.length; i += 2) {
      for (let k of map.contents.keys()) {
        if (equals(k, args[i])) {
          result.delete(k)
        }
      }
      result.set(args[i], args[i + 1])
    }
    return new Types.HashMap(result)
  },
  get: getFromMap,
  'contains?': (map, key) => {
    for (let k of map.contents.keys()) {
      if (equals(k, key) || key.toString() === k) {
        return true
      }
    }
    return false
  },
  keys: map => {
    return new Types.List(Array.from(map.contents.keys()))
  },
  vals: map => {
    return new Types.List(Array.from(map.contents.values()))
  },

  apply: (func, ...args) => {
    const betweenArgs = args.slice(0, -1)
    const resultArgs = betweenArgs.concat(args[args.length - 1].contents)

    return func.call(resultArgs)
  },
  map: (func, list) => {
    if (!list) {
      return
    }
    const l = map(c => func.call([c]), list.contents)
    return new Types.List(l)
  },
  readline: promptStr => {
    const line = readline(promptStr.toString(false))
    if (line == null) {
      return Types.nil
    }
    return line
  },
  meta: func => func.meta || Types.nil,
  'with-meta': (ast, meta) => {
    return ast.withMeta(meta)
  },
  'time-ms': () => new Date().getTime(),
  conj: (l, ...args) =>
    l instanceof Types.Vector
      ? new Types.Vector(concat(l.contents, args))
      : new Types.List(concat(args.reverse(), l.contents)),

  'string?': str => str instanceof Types.MalString,
  'number?': num => num instanceof Types.Int || num instanceof Types.Float,
  'fn?': fn => fn instanceof Types.MalFunction && !fn.isMacro,
  'macro?': fn => fn instanceof Types.MalFunction && fn.isMacro,

  seq: ast => {
    if (ast instanceof Types.MalString) {
      if (ast.toString(false).length === 0) {
        return Types.nil
      }
      return new Types.List(
        map(s => new Types.MalString(s), ast.toString(false).split(''))
      )
    }
    if (ast instanceof Types.List || ast instanceof Types.Vector) {
      if (ast.contents.length === 0) {
        return Types.nil
      }
      return new Types.List(ast.contents)
    }
    return Types.nil
  }
})((f, key) => new Types.MalFunction(apply(f)))

const nsFunctions = merge(
  nsApplizedFunction,
  map(__, {
    list: args => new Types.List(args),
    vector: args => new Types.Vector(args),
    'hash-map': args => new Types.ArrayToHashMap(args),
    str: l =>
      new Types.MalString(
        `${map(__, l)(ast => printStr(ast, false)).join('')}`,
        true
      ),
    'pr-str': l =>
      new Types.MalString(
        `${map(__, l)(ast => printStr(ast, true)).join(' ')}`,
        true
      ),
    println: l => {
      console.log(`${map(__, l)(ast => printStr(ast, false)).join(' ')}`)
      return Types.nil
    },
    prn: l => {
      console.log(`${map(__, l)(ast => printStr(ast, true)).join(' ')}`)
      return Types.nil
    },
    concat: l => {
      const array = map(__, l)(ast => ast.contents)
      return new Types.List(unnest(array))
    }
  })(f => new Types.MalFunction(f))
)

const nsSymbols = {
  '*ARGV*': new Types.List([]),
  '*host-language*': new Types.MalString('ramda-js')
}

const nsMacros = map(__, {})(f =>
  Types.turnToMacro(new Types.MalFunction(apply(f)))
)

export const ns = mergeAll([nsFunctions, nsSymbols, nsMacros])
