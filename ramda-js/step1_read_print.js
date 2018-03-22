import { compose, join, map } from 'ramda'
import { printStr } from './printer'
import { readStr } from './reader'
import { readline } from './node_readline'

// read
const READ = readStr

// eval
const EVAL = (ast, env) => ast

// print
const PRINT = compose(join(' '), map(printStr))

// repl
const REP = str => PRINT(EVAL(READ(str), {}))

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
