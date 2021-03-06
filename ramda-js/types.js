import {
  __,
  all,
  compose,
  is,
  join,
  lensProp,
  map,
  match,
  replace,
  set
} from 'ramda'

class MalType {
  constructor (name) {
    this.isMalType = true
    this.name = name
    this.type = ''
  }

  toString () {
    return this.name
  }
}

const isMalType = type => type.isMalType

export class Blank extends MalType {
  constructor () {
    super()
    // throw new Error('Blank has created')
  }
  toString () {
    return ''
  }
}

export class Symbol extends MalType {
  constructor (name) {
    super(name)
    this.type = 'symbol'
  }
}

export class Atom extends MalType {
  constructor (val) {
    super()
    this.val = val
  }

  toString () {
    return new List([new Symbol('atom'), this.val]).toString()
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

  withMeta (meta) {
    const result = new List(this.contents)
    result.meta = meta
    return result
  }
}
export class Vector extends Seq {
  constructor (contents) {
    super(contents)
    this.start = '['
    this.end = ']'
    this.type = 'vector'
  }
  withMeta (meta) {
    const result = new Vector(this.contents)
    result.meta = meta
    return result
  }
}

export class HashMap extends Seq {
  constructor (contents) {
    if (!(contents instanceof Map)) {
      throw new Error(`${contents} is not a Map`)
    }
    super(contents)
    this.start = '{'
    this.end = '}'
    this.type = 'hash-map'
  }
  withMeta (meta) {
    const result = new HashMap(this.contents)
    result.meta = meta
    return result
  }

  toString (printReadably) {
    let result = '{'
    const keys = this.contents.keys()
    for (let key of keys) {
      result += key.toString(printReadably) + ' '
      result += this.contents.get(key).toString(printReadably) + ' '
    }
    result = result.trim()
    result += '}'
    return result
  }
}

export const ArrayToHashMap = array => {
  if (array.length % 2 !== 0) {
    throw new Error('Odd number of hash map arguments')
  }
  const contents = new Map()
  for (let i = 0; i < array.length; i += 2) {
    contents.set(array[i], array[i + 1])
  }
  return new HashMap(contents)
}
export class Quote extends Symbol {
  constructor () {
    super('quote')
  }
}

export class Quasiquote extends Symbol {
  constructor () {
    super('quasiquote')
  }
}

export class Unquote extends Symbol {
  constructor () {
    super('unquote')
  }
}

export class SpliceUnquote extends Symbol {
  constructor () {
    super('splice-unquote')
  }
}

export class Deref extends Symbol {
  constructor () {
    super('deref')
  }
}

export class Keyword extends MalType {
  constructor (name) {
    super(match(/^:?(.+)$/, name)[1])
    this.type = 'keyword'
  }
  toString () {
    return ':' + this.name
  }
}

export class Int extends MalType {
  constructor (strInt) {
    super(strInt)
    this.number = parseInt(strInt, 10)
    this.type = 'int'
  }
  toString () {
    return String(this.number)
  }
}

export class Float extends MalType {
  constructor (strFloat) {
    super(strFloat)
    this.number = parseFloat(strFloat, 10)
    this.type = 'float'
  }
  toString () {
    return String(this.number)
  }
}

export class Nil extends MalType {
  constructor () {
    super('nil')
  }
  toString () {
    return 'nil'
  }
}

export class MalBoolean extends MalType {
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
  if (val instanceof MalType) {
    return val
  }
  if (getValType(Array)) {
    throw new Error()
  }
  return new Symbol(val)
}

export class MalFunction extends MalType {
  constructor (f, ast, env, params) {
    super('#<function>')
    this.func = f
    this.ast = ast
    this.env = env
    this.params = params
    this.isMacro = false
  }
  call (args) {
    const result = this.func(args)
    if (result && result instanceof MalType) {
      return result
    }
    return convertToAST(result)
  }
  withMeta (meta) {
    const result = new MalFunction(this.func, this.this, this.env, this.params)
    result.meta = meta
    return result
  }
  toString () {
    return '#<function>'
  }
}
export const turnToMacro = malf => {
  malf.isMacro = true
  return malf
}

export class MalString extends MalType {
  constructor (str, unescaped) {
    super(str)

    if (unescaped) {
      this.str = str
    } else {
      this.str = str.replace(/\\(.)/g, (_, c) => {
        return c === 'n' ? '\n' : c
      })
    }
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
