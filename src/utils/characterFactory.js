import { Character } from '@/models/Character'
import { Item } from '@/models/Item'
import { generateItem } from '@/utils/equipmentGenerator'
import archetypesData from '@/data/archetypes.json'
import itemPrefixes from '@/data/itemPrefixes.json'

export function createNewCharacter(name, archetypeId) {
  // 1. Validate Archetype
  const archetype = archetypesData.archetypes[archetypeId]
  if (!archetype) {
    throw new Error(`Archetype ${archetypeId} does not exist.`)
  }

  // 2. Instantiate Character
  const newChar = new Character(crypto.randomUUID(), name, archetypeId)

  // 3. Resolve Starting Kit
  const kit = archetype.starting_kit
  const prefixId = kit.prefix_id

  // Find the prefix definition (e.g., "adventurer")
  const prefixDef = itemPrefixes.find((p) => p.id === prefixId)
  if (!prefixDef) {
    console.error(`Starting kit prefix '${prefixId}' not found for ${archetypeId}`)
    return newChar
  }

  // 4. Generate Armor (Chest, Legs, etc.)
  // We iterate through the list of slots defined in the archetype (e.g. "chest", "legs")
  // and find the matching item in the Prefix's content list.
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

  // 5. Generate Weapon
  // We search for the specific subtype defined in the kit (e.g. "longsword")
  const weaponIndex = prefixDef.contents.findIndex((c) => c.type === kit.weapon_subtype)

  if (weaponIndex !== -1) {
    const rawWeapon = generateItem(prefixId, weaponIndex, 'mundane', 1)
    const weaponInstance = new Item(rawWeapon)

    newChar.addItem(weaponInstance)
    newChar.equipItem(weaponInstance.uid)
  }

  return newChar
}
