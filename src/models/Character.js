import { calculateCharacterStats } from '@/utils/statCalculator'
import { Item } from '@/models/Item'
import { Core } from '@/models/Core'

export class Character {
  constructor(id, name, archetypeId) {
    this.id = id
    this.name = name
    this.archetypeId = archetypeId
    this.level = 1
    this.experience = 0

    // Permanent bonuses (Elixirs, Quest Rewards)
    this.permanentBonuses = {}

    // The Backpack (Contains both Items and Cores)
    this.inventory = []

    // The Paper Doll (Full Slot List)
    this.equipment = {
      head: null,
      shoulders: null,
      chest: null,
      arms: null,
      hands: null,
      waist: null,
      legs: null,
      feet: null,
      weapon: null 
    }
  }

  /**
   * Adds an Item or Core instance to inventory
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
    
    // Safety Check: Can't equip a Core directly!
    if (newItem instanceof Core) {
      console.warn("Cannot equip a Core directly. Use a socketing action.")
      return
    }

    const slot = newItem.slot

    // Check if slot exists on character
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
   * Helper: Get only wearable equipment from inventory
   */
  get equipmentItems() {
    return this.inventory.filter(i => i instanceof Item)
  }

  /**
   * Helper: Get only Cores from inventory
   */
  get coreItems() {
    return this.inventory.filter(i => i instanceof Core)
  }

  /**
   * Aggregates stats from ALL equipped items + Permanent Bonuses
   */
  get totalBonuses() {
    const totals = { ...this.permanentBonuses }

    for (const slot of Object.keys(this.equipment)) {
      const item = this.equipment[slot]
      // Item.stats getter now automatically includes Core stats!
      if (item && item.stats) {
        for (const [stat, val] of Object.entries(item.stats)) {
          totals[stat] = (totals[stat] || 0) + val
        }

        // Handle Weapon Damage specifically
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