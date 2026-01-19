/* src/stores/player.js */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { calculateCharacterStats } from '@/utils/statCalculator'
import { getItemStats } from '@/models/Item' // Logic imported separately

export const usePlayerStore = defineStore('player', () => {
  // --- STATE (POJOs only) ---
  const id = ref(crypto.randomUUID())
  const name = ref('Hero')
  const archetypeId = ref('martyr')
  const level = ref(1)
  const inventory = ref([]) // Array of plain item objects
  const equipment = ref({
    head: null,
    shoulders: null,
    chest: null,
    arms: null,
    hands: null,
    waist: null,
    legs: null,
    feet: null,
    weapon: null,
  })

  // --- GETTERS ---
  const totalBonuses = computed(() => {
    const totals = {}

    // Sum from Equipment
    for (const slotName of Object.keys(equipment.value)) {
      const item = equipment.value[slotName]
      if (!item) continue

      // Use Pure Logic Function
      const stats = getItemStats(item)

      for (const [stat, val] of Object.entries(stats)) {
        totals[stat] = (totals[stat] || 0) + val
      }
      if (item.damage) {
        totals['weapon_damage'] = (totals['weapon_damage'] || 0) + item.damage
      }
    }
    return totals
  })

  const stats = computed(() => {
    return calculateCharacterStats(archetypeId.value, level.value, totalBonuses.value)
  })

  // --- ACTIONS ---

  function addItem(item) {
    inventory.value.push(item)
  }

  function equipItem(itemUid) {
    const idx = inventory.value.findIndex((i) => i.uid === itemUid)
    if (idx === -1) return

    const item = inventory.value[idx]
    const slot = item.slot

    if (!Object.prototype.hasOwnProperty.call(equipment.value, slot)) {
      console.warn(`Invalid slot: ${slot}`)
      return
    }

    // Unequip current if exists
    if (equipment.value[slot]) {
      inventory.value.push(equipment.value[slot])
    }

    // Move new item to slot
    equipment.value[slot] = item
    inventory.value.splice(idx, 1)
  }

  function unequipSlot(slot) {
    if (equipment.value[slot]) {
      inventory.value.push(equipment.value[slot])
      equipment.value[slot] = null
    }
  }

  function loadFromSave(saveData) {
    // This is where serialization pays off.
    // We can directly hydrate state because we don't have methods to lose.
    id.value = Pk.id
    name.value = Pk.name
    inventory.value = Pk.inventory
    equipment.value = Pk.equipment
    // ...etc
  }

  return {
    id,
    name,
    archetypeId,
    level,
    inventory,
    equipment,
    // Getters
    totalBonuses,
    stats,
    // Actions
    addItem,
    equipItem,
    unequipSlot,
  }
})
