export class Item {
  /**
   * @param {object} data - The raw object returned by equipmentGenerator
   */
  constructor(data) {
    this.uid = data.uid
    this.name = data.name
    this.slot = data.slot // 'head', 'weapon', etc.
    this.type = data.type // 'leather', 'longsword', etc.
    this.rarity = data.rarity
    this.netValue = data.netValue
    this.cost = data.cost

    // RENAME: The natural stats rolled on the item itself
    // We renamed this from 'stats' to 'baseStats' to avoid confusion with the getter
    this.baseStats = data.stats || {}

    // Weapon specifics (undefined for armor)
    this.damage = data.damage
    this.attackSpeed = data.attackSpeed
    
    // The Socketed Cores (Max 6)
    this.cores = []
  }

  get isWeapon() {
    return this.slot === 'weapon'
  }

  /**
   * THE MASTER STAT GETTER
   * Aggregates Natural Stats + Stats from all Socketed Cores
   */
  get stats() {
    // 1. Start with the natural base stats
    const total = { ...this.baseStats }

    // 2. Add every stat from every core
    for (const core of this.cores) {
      if (core.stats) {
        for (const [stat, val] of Object.entries(core.stats)) {
          // Add to existing value or initialize if missing
          total[stat] = (total[stat] || 0) + val
        }
      }
    }
    
    return total
  }

  /**
   * Attempts to socket a Core into this item.
   * @param {Core} coreInstance 
   * @returns {boolean} Success
   */
  addCore(coreInstance) {
    // 1. Check Space
    if (this.cores.length >= 6) {
      console.warn("Socket limit reached.")
      return false
    }

    // 2. Check Duplicates (Rule: No identical Prefix+Suffix on same item)
    // We assume the Core model has an .isSameKind() method
    const isDuplicate = this.cores.some(existing => existing.isSameKind(coreInstance))
    if (isDuplicate) {
      console.warn("Cannot socket duplicate Core type.")
      return false
    }

    // 3. Socket it
    this.cores.push(coreInstance)
    return true
  }

  /**
   * Removes a core and returns it (so it can go back to inventory)
   */
  removeCore(coreUid) {
    const index = this.cores.findIndex(c => c.uid === coreUid)
    if (index === -1) return null
    
    const [removedCore] = this.cores.splice(index, 1)
    return removedCore
  }

  /**
   * Returns a formatted tooltip string or array
   */
  get description() {
    const lines = [`[${this.rarity.toUpperCase()}] ${this.name}`]

    // --- SECTION: BASIC INFO ---
    if (this.isWeapon) {
      lines.push(`Damage: ${this.damage}`)
      lines.push(`Speed: ${this.attackSpeed}`)
      const dps = (this.damage / this.attackSpeed).toFixed(1)
      lines.push(`DPS: ${dps}`)
    } else {
      lines.push(`Slot: ${this.slot.toUpperCase()}`)
      lines.push(`Type: ${this.type}`)
    }

    // --- SECTION: TOTAL STATS ---
    // We use the getter here to show the FINAL totals (Base + Cores)
    lines.push('--- STATS ---')
    const currentStats = this.stats
    if (Object.keys(currentStats).length > 0) {
      for (const [stat, val] of Object.entries(currentStats)) {
        lines.push(`+${val} ${stat.toUpperCase()}`)
      }
    } else {
      lines.push("(No Stats)")
    }

    // --- SECTION: CORES ---
    if (this.cores.length > 0) {
      lines.push('--- CORES ---')
      this.cores.forEach(core => {
        lines.push(`[O] ${core.name}`) // [O] symbol represents a socket
      })
    }
    
    // --- SECTION: FOOTER ---
    lines.push('---')
    lines.push(`Value: ${this.cost}g`)
    lines.push(`Sockets: ${this.cores.length} / 6`)

    return lines
  }
}