import { generateItem } from '@/utils/equipmentGenerator'
import { generateId } from '@/utils/uuid'
import defaultArchetypes from '@/data/archetypes.json'
import itemPrefixes from '@/data/itemPrefixes.json'

/**
 * Creates a new character state object (POJO).
 * This returns the pure data structure required to initialize the Player Store.
 * @param {string} name
 * @param {string} archetypeId
 * @param {object|null} customSource - (Optional) Live JSON object to use instead of the file.
 * @returns {Object} The complete initial character state.
 */
export function createNewCharacter(name, archetypeId, customSource = null) {
  // 1. Determine Data Source (Live Edit vs Static File)
  const sourceData = customSource || defaultArchetypes

  // 2. Validate Archetype
  const archetype = sourceData.archetypes[archetypeId]
  if (!archetype) {
    throw new Error(`Archetype ${archetypeId} does not exist.`)
  }

  // 3. Initialize State Tree (POJO)
  // This must match the state shape in usePlayerStore
  const newChar = {
    id: generateId(),
    name: name,
    archetypeId: archetypeId,
    level: 1,
    experience: 0,
    permanentBonuses: {}, // Permanent stat boosts
    inventory: [], // Items currently in the bag
    equipment: {
      // Items currently equipped
      head: null,
      shoulders: null,
      chest: null,
      arms: null,
      hands: null,
      waist: null,
      legs: null,
      feet: null,
      weapon: null,
    },
  }

  // 4. Resolve Starting Kit configuration
  const kit = archetype.starting_kit
  const prefixId = kit.prefix_id

  const prefixDef = itemPrefixes.find((p) => p.id === prefixId)
  if (!prefixDef) {
    console.error(`Starting kit prefix '${prefixId}' not found for ${archetypeId}`)
    return newChar
  }

  // 5. Generate & Equip Armor
  // Optimization: Place directly into equipment slots. No need to route through inventory.
  kit.armor_slots.forEach((slotName) => {
    const contentIndex = prefixDef.contents.findIndex((c) => c.slot === slotName)

    if (contentIndex !== -1) {
      // Force Mundane rarity, Force 1 Natural Stat
      const item = generateItem(prefixId, contentIndex, 'mundane', 1)

      if (item) {
        // Validation: Ensure the slot actually exists on our paper doll
        if (Object.prototype.hasOwnProperty.call(newChar.equipment, slotName)) {
          newChar.equipment[slotName] = item
        } else {
          // Fallback: If for some reason the slot doesn't exist, dump to bag
          newChar.inventory.push(item)
        }
      }
    }
  })

  // 6. Generate & Equip Weapon
  const weaponIndex = prefixDef.contents.findIndex((c) => c.type === kit.weapon_subtype)

  if (weaponIndex !== -1) {
    const weapon = generateItem(prefixId, weaponIndex, 'mundane', 1)
    if (weapon) {
      newChar.equipment.weapon = weapon
    }
  }

  return newChar
}
