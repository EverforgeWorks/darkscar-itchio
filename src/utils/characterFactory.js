import { Character } from '@/models/Character'
import { Item } from '@/models/Item'
import { generateItem } from '@/utils/equipmentGenerator'
import { generateId } from '@/utils/uuid' // Assuming you have this from your previous fix
import defaultArchetypes from '@/data/archetypes.json'
import itemPrefixes from '@/data/itemPrefixes.json'

/**
 * Creates a new character.
 * @param {string} name
 * @param {string} archetypeId
 * @param {object|null} customSource - (Optional) Live JSON object to use instead of the file.
 */
export function createNewCharacter(name, archetypeId, customSource = null) {
  // 1. Determine Data Source (Live Edit vs Static File)
  const sourceData = customSource || defaultArchetypes

  // 2. Validate Archetype
  const archetype = sourceData.archetypes[archetypeId]
  if (!archetype) {
    throw new Error(`Archetype ${archetypeId} does not exist.`)
  }

  // 3. Instantiate Character
  const newChar = new Character(generateId(), name, archetypeId)

  // 4. Resolve Starting Kit
  const kit = archetype.starting_kit
  const prefixId = kit.prefix_id

  // Find the prefix definition (e.g., "adventurer")
  const prefixDef = itemPrefixes.find((p) => p.id === prefixId)
  if (!prefixDef) {
    console.error(`Starting kit prefix '${prefixId}' not found for ${archetypeId}`)
    return newChar
  }

  // 5. Generate Armor
  kit.armor_slots.forEach((slotName) => {
    const contentIndex = prefixDef.contents.findIndex((c) => c.slot === slotName)

    if (contentIndex !== -1) {
      // Force Mundane rarity, Force 1 Natural Stat
      const rawItem = generateItem(prefixId, contentIndex, 'mundane', 1)
      const itemInstance = new Item(rawItem)

      newChar.addItem(itemInstance)
      newChar.equipItem(itemInstance.uid)
    }
  })

  // 6. Generate Weapon
  const weaponIndex = prefixDef.contents.findIndex((c) => c.type === kit.weapon_subtype)

  if (weaponIndex !== -1) {
    const rawWeapon = generateItem(prefixId, weaponIndex, 'mundane', 1)
    const weaponInstance = new Item(rawWeapon)

    newChar.addItem(weaponInstance)
    newChar.equipItem(weaponInstance.uid)
  }

  return newChar
}
