<script setup>
import { ref, watch, reactive, computed } from 'vue'
import { createNewCharacter } from '@/utils/characterFactory'
import { generateItem } from '@/utils/equipmentGenerator'
import { Item } from '@/models/Item'
import archetypesDataRaw from '@/data/archetypes.json'
import itemPrefixes from '@/data/itemPrefixes.json'
import equipmentData from '@/data/equipmentData.json'

const ARMOR_SLOTS = ['head', 'shoulders', 'chest', 'arms', 'hands', 'waist', 'legs', 'feet', 'weapon']
const RARITIES = ['mundane', 'artisan', 'rare', 'legendary']
const ALL_STATS = Object.keys(equipmentData.stat_conversion)

// --- STATE ---
const archetypesData = reactive(JSON.parse(JSON.stringify(archetypesDataRaw)))
const archetypeList = computed(() => Object.keys(archetypesData.archetypes))
const previewId = ref('martyr')
const character = ref(null)
const tooltipItem = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })

// --- GENERATOR STATE ---
const gen = reactive({
  prefixId: itemPrefixes[0].id,
  slot: 'random',
  type: 'random',
  rarity: 'random',
  statCount: 'random', 
  forcedStats: [null, null, null, null]
})

// --- HELPERS ---
const selectedPrefixData = computed(() => itemPrefixes.find(p => p.id === gen.prefixId))

const availableGenSlots = computed(() => {
  if (!selectedPrefixData.value) return []
  const slots = new Set(selectedPrefixData.value.contents.map(c => c.slot))
  return Array.from(slots)
})

const availableGenTypes = computed(() => {
  if (!selectedPrefixData.value) return []
  let content = selectedPrefixData.value.contents
  if (gen.slot !== 'random') {
    content = content.filter(c => c.slot === gen.slot)
  }
  return Array.from(new Set(content.map(c => c.type)))
})

function getAvailableStats(currentIndex) {
  return ALL_STATS.filter(stat => {
    if (gen.forcedStats[currentIndex] === stat) return true
    return !gen.forcedStats.includes(stat)
  })
}

// --- ACTIONS ---
function generatePreview() {
  try {
    character.value = createNewCharacter('Debug_Preview', previewId.value, archetypesData)
  } catch (e) { console.error(e) }
}

function fabricateItem() {
  if (!character.value) return
  
  let targetSlot = gen.slot
  if (targetSlot === 'random') {
    targetSlot = availableGenSlots.value[Math.floor(Math.random() * availableGenSlots.value.length)]
  }

  let targetType = gen.type
  if (targetType === 'random') {
    const validContents = selectedPrefixData.value.contents.filter(c => c.slot === targetSlot)
    if (validContents.length === 0) return 
    targetType = validContents[Math.floor(Math.random() * validContents.length)].type
  }

  const contentIndex = selectedPrefixData.value.contents.findIndex(c => c.slot === targetSlot && c.type === targetType)
  if (contentIndex === -1) return

  let targetRarity = gen.rarity
  if (targetRarity === 'random') targetRarity = RARITIES[Math.floor(Math.random() * RARITIES.length)]

  let count = gen.statCount === 'random' ? Math.floor(Math.random() * 5) : parseInt(gen.statCount)

  const rawItem = generateItem(gen.prefixId, contentIndex, targetRarity, count)

  if (gen.statCount !== 'random' && count > 0) {
    const activeForced = gen.forcedStats.slice(0, count)
    if (activeForced.some(s => s !== null)) {
      rawItem.stats = {}
      const rules = equipmentData
      activeForced.forEach(statKey => {
        if (!statKey) {
          const used = Object.keys(rawItem.stats)
          const available = Object.keys(rules.stat_conversion).filter(k => !used.includes(k))
          statKey = available[Math.floor(Math.random() * available.length)]
        }
        if (statKey) {
          const val = rawItem.netValue * rules.stat_conversion[statKey]
          rawItem.stats[statKey] = (rawItem.stats[statKey] || 0) + val
        }
      })
    }
  }

  const newItem = new Item(rawItem)
  character.value.addItem(newItem)
  character.value.equipItem(newItem.uid)
}

function stripGear() {
  if (character.value) Object.keys(character.value.equipment).forEach(s => character.value.unequipSlot(s))
}

function toggleSlot(slot, isChecked) {
  if (!character.value) return
  if (!isChecked) character.value.unequipSlot(slot)
  else {
    const item = character.value.inventory.find(i => i.slot === slot)
    if (item) character.value.equipItem(item.uid)
  }
}

watch(previewId, generatePreview, { immediate: true })
watch(() => gen.prefixId, () => { gen.slot = 'random'; gen.type = 'random' })
watch(() => gen.slot, () => { gen.type = 'random' })

function showTooltip(item, event) {
  if (!item) return
  tooltipItem.value = item
  tooltipPos.value = { x: event.clientX + 15, y: event.clientY + 15 }
}
function hideTooltip() { tooltipItem.value = null }
function updateTooltip(event) {
  if (tooltipItem.value) tooltipPos.value = { x: event.clientX + 15, y: event.clientY + 15 }
}
</script>

<template>
  <div class="preview-layout" @mousemove="updateTooltip">
    <div class="sheet-column">
      <div class="preview-controls">
        <label>Archetype:</label>
        <select v-model="previewId">
          <option v-for="key in archetypeList" :key="key" :value="key">{{ archetypesData.archetypes[key].name }}</option>
        </select>
        <div class="btn-group">
          <button @click="generatePreview">Reroll Kit</button>
          <button @click="stripGear" class="danger-btn">Strip</button>
        </div>
      </div>

      <div v-if="character" class="character-sheet">
        <div class="panel">
          <h3>Attributes (Lv. {{ character.level }})</h3>
          <div v-for="(val, stat) in character.currentStats.attributes" :key="stat" class="stat-row">
            <span>{{ stat.toUpperCase() }}</span>
            <span class="val">{{ val }} <span v-if="character.currentStats.bonuses[stat]" class="bonus-text">(+{{ character.currentStats.bonuses[stat] }})</span></span>
          </div>
          <hr/>
          <h3>Combat</h3>
          <div v-for="(val, stat) in character.currentStats.combatStats" :key="stat" class="stat-row">
             <template v-if="val > 0 || stat.includes('hp') || stat.includes('mp')">
               <span class="lbl">{{ stat.replace('_', ' ') }}</span> 
               <span class="val">{{ val }} <span v-if="character.currentStats.bonuses[stat]" class="bonus-text">(+{{ character.currentStats.bonuses[stat] }})</span></span>
             </template>
          </div>
        </div>

        <div class="panel equipment-grid">
          <div v-for="slot in ARMOR_SLOTS" :key="slot" class="slot-wrapper">
            <div class="slot-toggle">
              <input type="checkbox" :checked="!!character.equipment[slot]" @change="(e) => toggleSlot(slot, e.target.checked)" 
                :disabled="!character.equipment[slot] && !character.inventory.find(i => i.slot === slot)" />
            </div>
            <div class="slot-box" :class="{ filled: character.equipment[slot] }" 
               @mouseenter="showTooltip(character.equipment[slot], $event)" @mouseleave="hideTooltip">
               <span class="slot-label">{{ slot }}</span>
               <span v-if="character.equipment[slot]" class="item-name">{{ character.equipment[slot].name }}</span>
               <span v-else class="empty-text">Empty</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="generator-column panel">
      <h3>Item Fabricator</h3>
      <div class="gen-field">
        <label>Prefix Set</label>
        <select v-model="gen.prefixId"><option v-for="p in itemPrefixes" :key="p.id" :value="p.id">{{ p.name }}</option></select>
      </div>
      <div class="gen-row">
        <div class="gen-field">
          <label>Slot</label>
          <select v-model="gen.slot">
            <option value="random">Random</option>
            <option v-for="s in availableGenSlots" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="gen-field">
          <label>Type</label>
          <select v-model="gen.type">
            <option value="random">Random</option>
            <option v-for="t in availableGenTypes" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
      </div>
      <div class="gen-field">
        <label>Rarity</label>
        <select v-model="gen.rarity">
          <option value="random">Random</option>
          <option v-for="r in RARITIES" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="gen-field">
        <label>Stats Count</label>
        <select v-model="gen.statCount">
          <option value="random">Random (0-4)</option>
          <option v-for="n in 5" :key="n" :value="n-1">{{ n-1 }}</option>
        </select>
      </div>
      <div class="stats-selectors">
        <label>Forced Stats</label>
        <div v-for="n in 4" :key="n" class="stat-select-row">
          <select v-model="gen.forcedStats[n-1]" :disabled="gen.statCount === 'random' || n > parseInt(gen.statCount)">
            <option :value="null">-- Random --</option>
            <option v-for="s in getAvailableStats(n-1)" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
      </div>
      <button class="fabricate-btn" @click="fabricateItem">Generate & Equip</button>
    </div>
    
    <div v-if="tooltipItem" class="tooltip" :style="{ top: tooltipPos.y + 'px', left: tooltipPos.x + 'px' }">
      <div v-for="(line, i) in tooltipItem.description" :key="i" :class="{ 'tt-head': i===0 }">{{ line }}</div>
    </div>
  </div>
</template>

<style scoped>
.preview-layout { display: flex; gap: 20px; height: 100%; }
.sheet-column { flex: 2; display: flex; flex-direction: column; gap: 20px; overflow-y: auto; }
.generator-column { flex: 1; min-width: 300px; display: flex; flex-direction: column; gap: 15px; border-left: 2px solid #444; padding-left: 20px; }

.preview-controls { display: flex; gap: 20px; align-items: center; padding: 10px; border-bottom: 1px solid #333; }
.btn-group { display: flex; gap: 10px; }
.danger-btn { background: #552222; color: #ffaaaa; border: 1px solid #773333; }

.character-sheet { display: flex; gap: 20px; align-items: flex-start; }
.panel { background: #1a1a1a; padding: 15px; border: 1px solid #333; min-width: 250px; }
.stat-row { display: flex; justify-content: space-between; border-bottom: 1px solid #333; padding: 4px 0; }
.val { color: #fc0; }
.bonus-text { color: #00ff00; font-size: 0.85em; margin-left: 5px; }

.equipment-grid { display: grid; gap: 8px; }
.slot-wrapper { display: flex; gap: 10px; align-items: center; }
.slot-toggle input { cursor: pointer; width: 16px; height: 16px; }
.slot-box { flex: 1; display: flex; justify-content: space-between; padding: 8px; border: 1px dashed #444; background: #151515; }
.slot-box.filled { border-style: solid; border-color: #666; }
.item-name { color: #afa; }

/* Generator specific */
.gen-field { display: flex; flex-direction: column; margin-bottom: 10px; }
.gen-field label { color: #aaa; font-size: 0.9em; margin-bottom: 5px; }
.gen-field select { background: #222; color: white; border: 1px solid #444; padding: 8px; }
.gen-row { display: flex; gap: 10px; }
.gen-row .gen-field { flex: 1; }
.stat-select-row select { width: 100%; margin-bottom: 5px; background: #1a1a1a; color: #ddd; border: 1px solid #333; padding: 5px; }
.stat-select-row select:disabled { opacity: 0.3; cursor: not-allowed; }
.fabricate-btn { background: #d4a017; color: black; font-weight: bold; border: none; padding: 15px; margin-top: 10px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; }
.fabricate-btn:hover { background: #ffcc00; }

.tooltip { position: fixed; background: rgba(0,0,0,0.95); border: 1px solid #777; padding: 10px; pointer-events: none; z-index: 999; }
.tt-head { color: #fc0; font-weight: bold; border-bottom: 1px solid #555; margin-bottom: 5px; }
</style>