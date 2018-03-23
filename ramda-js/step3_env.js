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
import { Env } from './env'
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

  switch (ast.contents[0].name) {
    case 'def!':
      return env.set(EVAL(ast.contents[2], env), ast.contents[1])
    case 'let*':
      const letEnv = new Env(env)
      for (let i = 0; i < ast.contents[1].contents.length; i += 2) {
        letEnv.set(
          EVAL(ast.contents[1].contents[i + 1], letEnv),
          ast.contents[1].contents[i].name
        )
      }
      return EVAL(ast.contents[2], letEnv)

    default:
      const el = evalAst(ast, env)
      const f = el.contents[0]
      const args = splitAt(1, el.contents)[1]
      return f.call(args)
  }
}

// print
const PRINT = compose(join(' '), map(printStr))

// repl
const replEnv = new Env()
replEnv.set(new Types.MalFunction('+', apply(add)))
replEnv.set(new Types.MalFunction('-', apply(subtract)))
replEnv.set(new Types.MalFunction('*', apply(multiply)))
replEnv.set(new Types.MalFunction('/', apply(divide)))

const evalAst = (ast, env) => {
  const evalWithEnv = x => EVAL(x, env)
  if (ast instanceof Types.Symbol) {
    return env.getBySymbol(ast)
  } else if (ast instanceof Types.List) {
    return new Types.List(map(evalWithEnv, ast.contents))
  } else if (ast instanceof Types.Vector) {
    return new Types.Vector(map(evalWithEnv, ast.contents))
  } else if (ast instanceof Types.HashMap) {
    const newHashMap = {}
    const keys = Object.keys(ast.contents)
    for (let key of keys) {
      newHashMap[evalWithEnv(key)] = evalWithEnv(ast.contents[key])
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
