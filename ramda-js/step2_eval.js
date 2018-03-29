import * as Types from './types'
import {
  add,
  apply,
  compose,
  divide,
  join,
  map,
  multiply,
  splitAt,
  subtract
} from 'ramda'

import { printStr } from './printer'
import { readStr } from './reader'
import { readline } from './node_readline'

// read
const READ = readStr

// eval
const EVAL = (ast, env) => {
  if (ast instanceof Array) {
    return map(a => EVAL(a, env), ast)
  }
  if (!(ast instanceof Types.List)) {
    return evalAst(ast, env)
  }

  if (ast.contents.length === 0) {
    return ast
  }

  const el = evalAst(ast, env)
  const f = el.contents[0]
  const args = splitAt(1, el.contents)[1]
  return f.call(args)
}

// print
const PRINT = compose(join(' '), map(printStr))

// repl
const replEnv = {
  '+': apply(add),
  '-': apply(subtract),
  '*': apply(multiply),
  '/': apply(divide)
}

const evalAst = (ast, env) => {
  const evalWithEnv = x => EVAL(x, env)
  if (ast instanceof Types.Symbol) {
    const malf = new Types.MalFunction(env[ast.name])
    malf.name = ast.name
    return malf
  } else if (ast instanceof Types.List) {
    return new Types.List(map(evalWithEnv, ast.contents))
  } else if (ast instanceof Types.Vector) {
    return new Types.Vector(map(evalWithEnv, ast.contents))
  } else if (ast instanceof Types.HashMap) {
    const newHashMap = new Map()
    const keys = ast.contents.keys()
    for (let key of keys) {
      newHashMap.set(evalWithEnv(key), evalWithEnv(ast.contents.get(key)))
    }
    return new Types.HashMap(newHashMap)
  } else {
    return ast
  }
}

const REP = str => PRINT(EVAL(READ(str), replEnv))

for (;;) {
  const line = readline('user> ')
  if (line == null) {
    break
  }
  if (line) {
    try {
      console.log(REP(line))
    } catch (e) {
      if (e.stack) {
        console.log(e.stack)
      } else {
        console.log(e)
      }
    }
  }
}
