import { readline } from './node_readline'
import { identity, curry } from 'ramda'

// read
const READ = identity

// eval
const EVAL = (ast, env) => ast

// print
const PRINT = identity

// repl
const REP = str => PRINT(EVAL(READ(str), {}))

for (;;) {
  const line = readline('user> ')
  if (line == null) {
    break
  }
  if (line) {
    console.log(REP(line))
  }
}
