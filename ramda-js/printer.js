export function printStr (malStructure) {
  if (!malStructure || !malStructure.isMalType) {
    throw new Error('This is not a AST:' + malStructure)
  }
  return malStructure.toString()
}
