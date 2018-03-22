import { all, compose, join, map, match } from 'ramda'

class MalType {
  constructor () {
    this.isMalType = true
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
  constructor (array) {
    super()
    if (!all(isMalType, array)) {
      throw new Error()
    }
    this.contents = array
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
  constructor (array) {
    super(array)
    this.start = '('
    this.end = ')'
  }
}
export class Vector extends Seq {
  constructor (array) {
    super(array)
    this.start = '['
    this.end = ']'
  }
}

export class HashMap extends Seq {
  constructor (array) {
    super(array)
    this.start = '{'
    this.end = '}'
  }
}

export class Atom extends MalType {
  constructor (name) {
    super()
    this.name = name
  }

  toString () {
    return this.name
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
  }
}

export class Int extends Atom {
  constructor (strInt) {
    super(strInt)
    this.number = parseInt(strInt, 10)
  }
  toString () {
    return String(this.number)
  }
}

export class Float extends Atom {
  constructor (strFloat) {
    super(strFloat)
    this.number = parseFloat(strFloat, 10)
  }
  toString () {
    return String(this.number)
  }
}

export class Nil extends Atom {
  constructor () {
    super('nil')
    this.isNil = true
  }
}

export class True extends Atom {
  constructor () {
    super('true')
    this.isTrue = true
  }
}

export class False extends Atom {
  constructor () {
    super('true')
    this.isFalse = true
  }
}
