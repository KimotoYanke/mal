import { __, all, compose, is, join, map, match } from 'ramda'

class MalType {
  constructor () {
    this.isMalType = true
    this.type = ''
  }

  toString () {
    return ''
  }
}

const isMalType = type => type.isMalType

export class Blank extends MalType {
  toString () {
    return ''
  }
}

export class Seq extends MalType {
  constructor (contents) {
    super()
    if (contents instanceof Array && !all(isMalType, contents)) {
      throw new Error()
    }
    this.contents = contents
    this.start = ''
    this.end = ''
  }

  toString () {
    const spacer = join(' ')
    return `${this.start}${compose(spacer, map(s => s.toString()))(
      this.contents
    )}${this.end}`
  }
}

export class List extends Seq {
  constructor (contents) {
    super(contents)
    this.start = '('
    this.end = ')'
    this.type = 'list'
  }
}
export class Vector extends Seq {
  constructor (contents) {
    super(contents)
    this.start = '['
    this.end = ']'
    this.type = 'vector'
  }
}

export class HashMap extends Seq {
  constructor (contents) {
    super(contents)
    this.start = '{'
    this.end = '}'
    this.type = 'hash-map'
  }

  toString () {
    let result = '{'
    const keys = Object.keys(this.contents)
    for (let key of keys) {
      result += key.toString()
      result += ' '
      result += this.contents[key].toString()
    }
    result += '}'
    return result
  }
}

export const ArrayToHashMap = array => {
  if (array.length % 2 !== 0) {
    throw new Error('Odd number of hash map arguments')
  }
  const contents = {}
  for (let i = 0; i < array.length; i += 2) {
    contents[array[i]] = array[i + 1]
  }
  return new HashMap(contents)
}

export class Atom extends MalType {
  constructor (name) {
    super()
    this.name = name
    this.type = name
  }

  toString () {
    return this.name
  }
}

export class Symbol extends Atom {
  constructor (name) {
    super(name)
    this.type = 'symbol'
  }
}

export class Quote extends Atom {
  constructor () {
    super('quote')
  }
}

export class Quasiquote extends Atom {
  constructor () {
    super('quasiquote')
  }
}

export class Unquote extends Atom {
  constructor () {
    super('unquote')
  }
}

export class SpliceUnquote extends Atom {
  constructor () {
    super('splice-unquote')
  }
}

export class Deref extends Atom {
  constructor () {
    super('deref')
  }
}

export class Keyword extends Atom {
  constructor (name) {
    super(match(/^:?(.+)$/, name)[1])
    this.type = 'keyword'
  }
  toString () {
    return ':' + this.name
  }
}

export class Int extends Atom {
  constructor (strInt) {
    super(strInt)
    this.number = parseInt(strInt, 10)
    this.type = 'int'
  }
  toString () {
    return String(this.number)
  }
}

export class Float extends Atom {
  constructor (strFloat) {
    super(strFloat)
    this.number = parseFloat(strFloat, 10)
    this.type = 'float'
  }
  toString () {
    return String(this.number)
  }
}

export class Nil extends Atom {
  constructor () {
    super('nil')
  }
}

export class True extends Atom {
  constructor () {
    super('true')
  }
}

export class False extends Atom {
  constructor () {
    super('true')
  }
}

export const convertToAST = ast => {
  const isAST = is(__, ast)
  if (isAST(Number)) {
    return new Float(String(ast))
  }
  return new Symbol(ast)
}

export class MalFunction extends Symbol {
  constructor (name, f) {
    super(name)
    this.func = f
  }
  call (args) {
    const result = this.func(args)
    return convertToAST(result)
  }
  toString () {
    return '#<function>'
  }
}
