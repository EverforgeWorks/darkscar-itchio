import { calculateCharacterStats } from '@/utils/statCalculator'

export class Character {
  constructor(id, name, archetypeId) {
    this.id = id
    this.name = name
    this.archetypeId = archetypeId
    this.level = 1
    this.experience = 0

    // Permanent bonuses (Elixirs, Quest Rewards)
    this.permanentBonuses = {}

    // The Backpack
    this.inventory = []

    // The Paper Doll
    this.equipment = {
      head: null,
      shoulders: null,
      arms: null,
      chest: null,
      hands: null,
      waist: null,
      legs: null,
      feet: null,
      weapon: null, // eventually weapon_main, weapon_off
      // accessories later
    }
  }

  /**
   * Adds an Item instance to inventory
   */
  addItem(item) {
    this.inventory.push(item)
  }

  /**
   * Equips an item.
   * 1. Removes it from inventory.
   * 2. If slot is occupied, moves old item to inventory.
   * 3. Puts new item in slot.
   */
  equipItem(itemUid) {
    const index = this.inventory.findIndex((i) => i.uid === itemUid)
    if (index === -1) return

    const newItem = this.inventory[index]
    const slot = newItem.slot

    // Check if slot exists
    if (!this.equipment.hasOwnProperty(slot)) {
      console.warn(`Character cannot equip item to slot: ${slot}`)
      return
    }

    // Remove from bag
    this.inventory.splice(index, 1)

    // Unequip existing if needed
    if (this.equipment[slot]) {
      this.inventory.push(this.equipment[slot])
    }

    // Equip
    this.equipment[slot] = newItem
  }

  /**
   * Unequips an item by slot name
   */
  unequipSlot(slot) {
    if (this.equipment[slot]) {
      this.inventory.push(this.equipment[slot])
      this.equipment[slot] = null
    }
  }

  /**
   * Aggregates stats from ALL equipped items + Permanent Bonuses
   */
  get totalBonuses() {
    const totals = { ...this.permanentBonuses }

    for (const slot of Object.keys(this.equipment)) {
      const item = this.equipment[slot]
      if (item && item.stats) {
        // Add item stats to totals
        for (const [stat, val] of Object.entries(item.stats)) {
          totals[stat] = (totals[stat] || 0) + val
        }

        // Handle Weapon Damage specifically (if you want it in the stat sheet)
        if (item.damage) {
          totals['weapon_damage'] = (totals['weapon_damage'] || 0) + item.damage
        }
      }
    }
    return totals
  }

  /**
   * The Master Stat Getter
   */
  get currentStats() {
    // We pass the AGGREGATED bonuses to the calculator
    return calculateCharacterStats(this.archetypeId, this.level, this.totalBonuses)
  }
}
