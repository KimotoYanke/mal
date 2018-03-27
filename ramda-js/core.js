import * as Types from './types'
import {
  __,
  add,
  apply,
  divide,
  map,
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
  return false
}

const nsApplizedFunction = map(__, {
  '+': add,
  '-': subtract,
  '*': multiply,
  '/': divide,
  'list?': ast => ast instanceof Types.List,
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
  }
})(f => new Types.MalFunction(apply(f)))

const nsFunctions = merge(
  nsApplizedFunction,
  map(__, {
    list: args => new Types.List(args),
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
  '*ARGV*': new Types.List([])
}

export const ns = mergeAll([nsFunctions, nsSymbols])
