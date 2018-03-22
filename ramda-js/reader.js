import * as Types from './types'

import { __, curry, dec, filter, find, test } from 'ramda'

class Reader {
  constructor (tokens) {
    this.tokens = tokens
    this.position = 0
  }

  next () {
    this.position++
    return this.tokens[dec(this.position)]
  }

  peek () {
    return this.tokens[this.position]
  }
}

export const readStr = str => {
  const ast = []
  const reader = new Reader(tokenizer(str))
  while (reader.peek()) {
    ast.push(readForm(reader))
  }
  return filter(a => !(a instanceof Types.Blank), ast)
}

const tokenizer = str => {
  let match = null
  const tokenForRegExp = /[\s,]*(~@|[[\]{}()'`~^@]|"(?:\\.|[^\\"])*"|;.*|[^\s[\]{}('"`,;)]*)/g
  const results = []
  while ((match = tokenForRegExp.exec(str)) !== null) {
    if (match[1] === '') break
    results.push(match[1])
  }
  return results
}

const readForm = reader => {
  if (test(/^;.*$/, reader.peek())) {
    reader.next()
    return new Types.Blank()
  }
  switch (reader.peek()) {
    case undefined:
      return false
    case "'":
      reader.next()
      return new Types.List([new Types.Quote(), readForm(reader)])
    case '`':
      reader.next()
      return new Types.List([new Types.Quasiquote(), readForm(reader)])
    case '~':
      reader.next()
      return new Types.List([new Types.Unquote(), readForm(reader)])
    case '~@':
      reader.next()
      return new Types.List([new Types.SpliceUnquote(), readForm(reader)])
    case '@':
      reader.next()
      return new Types.List([new Types.Deref(), readForm(reader)])
    case '^':
      return readWithMeta(reader)
    case '(':
      return readList(reader)
    case '[':
      return readVector(reader)
    case '{':
      return readHashMap(reader)
    default:
      return readAtom(reader)
  }
}

const readAtom = reader => {
  const parseCases = [
    {
      re: /^-?[0-9]+$/,
      parser: token => new Types.Int(token)
    },
    {
      re: /^-?[0-9]+\.[0-9]+$/,
      parser: token => new Types.Float(token)
    },
    {
      re: /^:/,
      parser: token => new Types.Keyword(token)
    },
    {
      re: /.*/,
      parser: token => new Types.Atom(token)
    }
  ]
  const token = reader.peek()
  const matcher = test(__, token)
  reader.next()
  return find(parseCase => matcher(parseCase.re), parseCases).parser(token)
}

const readWithMeta = curry(reader => {
  const token = reader.next()
  const firstArg = readForm(reader)
  const secondArg = readForm(reader)
  if (token !== '^') {
    throw new Error(`expected '^'`)
  }
  return new Types.List([new Types.Atom('with-meta'), secondArg, firstArg])
})

const readSeq = curry((reader, start, end, astToStr) => {
  const ast = []
  const token = reader.next()
  if (token !== start) {
    throw new Error(`expected '${start}'`)
  }
  while (reader.peek() !== end) {
    if (!reader.peek()) {
      throw new Error(`expected '${end}', got EOF`)
    }
    ast.push(readForm(reader))
  }
  reader.next()
  return astToStr(ast)
})

const readList = readSeq(__, '(', ')', ast => new Types.List(ast))
const readVector = readSeq(__, '[', ']', ast => new Types.Vector(ast))
const readHashMap = readSeq(__, '{', '}', ast => new Types.HashMap(ast))
