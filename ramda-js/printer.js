export function printStr (malStructure, printReadably) {
  if (!malStructure || !malStructure.isMalType) {
    throw new Error('This is not a AST:' + malStructure)
  }
  return malStructure.toString(printReadably)
}
