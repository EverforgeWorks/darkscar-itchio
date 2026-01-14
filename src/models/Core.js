export class Core {
  /**
   * @param {object} data - The raw data from coreHandler.createCore()
   */
  constructor(data) {
    this.uid = data.uid || crypto.randomUUID()
    
    // Identity
    this.name = data.name
    this.prefixId = data.prefixId
    this.suffixId = data.suffixId
    this.familyId = data.familyId
    
    // The Math
    this.stats = data.stats || {}
    this.baseValue = data.baseValue // Useful for resale value calculations
  }

  /**
   * Helper to check if this core is "The same kind" as another
   * (Used to prevent duplicate socketing on one item)
   */
  isSameKind(otherCore) {
    return this.prefixId === otherCore.prefixId && this.suffixId === otherCore.suffixId
  }

  get description() {
    const lines = [`[CORE] ${this.name}`]
    lines.push('---')
    for (const [stat, val] of Object.entries(this.stats)) {
      lines.push(`+${val} ${stat.toUpperCase()}`)
    }
    lines.push('---')
    lines.push('Can be socketed into Equipment.')
    return lines
  }
}