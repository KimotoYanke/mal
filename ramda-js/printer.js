export function printStr (malStructure) {
  if (!malStructure.isMalType) {
    throw new Error('')
  }
  return malStructure.toString()
}
