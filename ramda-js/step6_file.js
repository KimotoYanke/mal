import * as Types from './types'
import {
  __,
  compose,
  curry,
  forEachObjIndexed,
  join,
  map,
  splitAt
} from 'ramda'
import { Env } from './env'
import { ns } from './core'
import { printStr } from './printer'
import { readStr } from './reader'
import { readline } from './node_readline'

// read
const READ = readStr

// eval
const EVAL = (aAst, aEnv) => {
  let ast = aAst
  let env = aEnv
  for (;;) {
    // console.log('a', env.get('a'))
    if (ast instanceof Array) {
      return map(a => EVAL(a, env), ast)
    }
    if (!(ast instanceof Types.List)) {
      return evalAst(ast, env)
    }

    if (ast.contents.length === 0) {
      return ast
    }

    const firstSymbol = ast.contents[0]
    const params = splitAt(1, ast.contents)[1]
    switch (firstSymbol.name) {
      case 'def!':
        return env.set(params[0], EVAL(params[1], env))
      case 'let*':
        const letEnv = new Env(env)
        for (let i = 0; i < params[0].contents.length; i += 2) {
          letEnv.set(
            params[0].contents[i].name,
            EVAL(params[0].contents[i + 1], letEnv)
          )
        }
        env = letEnv
        ast = params[1]
        break
      case 'do':
        EVAL(ast.contents.slice(1, -1), env)
        ast = ast.contents[ast.contents.length - 1]
        break
      case 'if':
        const condition = Types.isTrue(EVAL(params[0], env))
        if (condition) {
          if (params[1]) {
            ast = params[1]
          } else {
            return Types.nil
          }
        } else {
          if (params[2]) {
            ast = params[2]
          } else {
            return Types.nil
          }
        }
        break
      case 'fn*':
        return new Types.MalFunction(
          localParams => {
            return EVAL(
              params[1],
              new Env(env, params[0].contents, localParams)
            )
          },
          params[1],
          env,
          params[0].contents
        )
      default:
        const el = evalAst(ast, env)
        const f = el.contents[0]
        const args = splitAt(1, el.contents)[1]
        if (f.ast) {
          env = new Env(f.env, f.params, args)
          ast = f.ast
          continue
        } else {
          if (f instanceof Types.Nil) {
            // console.log(env)
          }
          return f.call(args)
        }
    }
  }
}

// print
const PRINT = compose(join(' '), map(curry(printStr)(__, true)))

// repl
const replEnv = new Env()
forEachObjIndexed((val, key) => {
  replEnv.set(key, val)
}, ns)

const evalAst = (ast, env) => {
  const evalWithEnv = x => EVAL(x, env)
  if (ast instanceof Types.MalFunction) {
    return ast
  } else if (ast instanceof Types.Symbol) {
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

REP('(def! not (fn* (a) (if a false true)))')
replEnv.set(
  'eval',
  new Types.MalFunction(ast => {
    const result = EVAL(ast, replEnv)
    return result[0]
  })
)
REP(
  '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) ")")))))'
)

if (typeof process !== 'undefined' && process.argv.length > 2) {
  replEnv.set(
    '*ARGV*',
    new Types.List(map(a => new Types.MalString(a), process.argv.slice(3)))
  )
  REP(`(load-file "${process.argv[2]}")`)
} else {
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
}
