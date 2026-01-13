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

    // The stats this item provides (e.g., { str: 4, patk: 8 })
    this.stats = data.stats || {}

    // Weapon specifics (undefined for armor)
    this.damage = data.damage
    this.attackSpeed = data.attackSpeed
  }

  get isWeapon() {
    return this.slot === 'weapon'
  }

  /**
   * Returns a formatted tooltip string or array
   */
  get description() {
    const lines = [`[${this.rarity.toUpperCase()}] ${this.name}`]

    if (this.isWeapon) {
      lines.push(`Damage: ${this.damage}`)
      lines.push(`Speed: ${this.attackSpeed}`)
      // Calculate DPS for display
      const dps = (this.damage / this.attackSpeed).toFixed(1)
      lines.push(`DPS: ${dps}`)
    } else {
      lines.push(`Slot: ${this.slot.toUpperCase()}`)
      lines.push(`Type: ${this.type}`)
    }

    lines.push('---')
    for (const [stat, val] of Object.entries(this.stats)) {
      lines.push(`+${val} ${stat.toUpperCase()}`)
    }

    lines.push('---')
    lines.push(`Value: ${this.cost}g`)

    return lines
  }
}
