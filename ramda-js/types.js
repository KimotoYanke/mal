import { __, all, compose, is, join, map, match, replace } from 'ramda'

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
      throw new Error(`${contents} is array but not mal structures`)
    }
    this.contents = contents
    this.start = ''
    this.end = ''
  }

  toString (printReadably) {
    const spacer = join(' ')
    return `${this.start}${spacer(
      map(s => s.toString(printReadably), this.contents)
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
  toString () {
    return 'nil'
  }
}

export class MalBoolean extends Atom {
  constructor (b) {
    b ? super('true') : super('false')
    this.booleanValue = b
  }
}

export const malTrue = new MalBoolean(true)
export const malFalse = new MalBoolean(false)
export const nil = new Nil()
export const convertToBoolean = val => (val ? malTrue : malFalse)

export const convertToAST = val => {
  const getValType = is(__, val)
  if (getValType(Number)) {
    return new Float(String(val))
  }
  if (getValType(Boolean)) {
    return convertToBoolean(val)
  }
  if (getValType(String)) {
    return new MalString(val)
  }
  return new Symbol(val)
}

export class MalFunction extends Symbol {
  constructor (f1, f2) {
    if (f1 instanceof String) {
      super(f1)
    } else {
      super('#<function>')
      this.func = f1
    }
  }
  call (args) {
    const result = this.func(args)
    if (result && result.isMalType) {
      return result
    }
    return convertToAST(result)
  }
  toString () {
    return '#<function>'
  }
}

export class MalString extends Atom {
  constructor (str, unescaped) {
    super(str)

    // console.log(str)
    if (unescaped) {
      this.str = str
    } else {
      this.str = str.replace(/\\(.)/g, (_, c) => {
        return c === 'n' ? '\n' : c
      })
    }
    // console.log(this.str)
  }
  toString (printReadably) {
    if (printReadably === undefined) {
      printReadably = true
    }
    if (this.str[0] === '\u029e') {
      return ':' + this.str.slice(1)
    } else if (printReadably) {
      return `"${this.str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')}"`
    } else {
      return this.str
    }
  }
}

export const isTrue = ast => {
  if ((ast instanceof MalBoolean && !ast.booleanValue) || ast instanceof Nil) {
    return false
  }
  return true
}
