<script setup>
import { ref, watch, reactive, computed } from 'vue'
import { createNewCharacter } from '@/utils/characterFactory'
import archetypesDataRaw from '@/data/archetypes.json'
import itemPrefixes from '@/data/itemPrefixes.json'
import equipmentData from '@/data/equipmentData.json'

// --- CONSTANTS ---
const ATTRIBUTES = ['str', 'dex', 'int', 'wis', 'end']
const ARMOR_TYPES = ['cloth', 'leather', 'chain', 'plate']
const WEAPON_TYPES = Object.keys(equipmentData.subtype_data)
const ARMOR_SLOTS = ['head', 'shoulders', 'chest', 'arms', 'hands', 'waist', 'legs', 'feet']

// --- STATE ---
const activeTab = ref('preview')
const expandedAttr = ref(null)

// Data & Selection
const archetypesData = reactive(JSON.parse(JSON.stringify(archetypesDataRaw)))
const archetypeList = computed(() => Object.keys(archetypesData.archetypes))
const editingId = ref('martyr')
const editingArchetype = computed(() => archetypesData.archetypes[editingId.value])
const previewId = ref('martyr')

// Character Instance
const character = ref(null)
const tooltipItem = ref(null)
const tooltipPos = ref({ x: 0, y: 0 })

// --- ACTIONS ---

function generatePreview() {
  try {
    character.value = createNewCharacter('Debug_Preview', previewId.value, archetypesData)
  } catch (e) {
    console.error(e)
  }
}

function stripGear() {
  if (!character.value) return
  for (const slot of Object.keys(character.value.equipment)) {
    character.value.unequipSlot(slot)
  }
}

function toggleSlot(slot, isChecked) {
  if (!character.value) return
  if (!isChecked) {
    character.value.unequipSlot(slot)
  } else {
    const itemToEquip = character.value.inventory.find((i) => i.slot === slot)
    if (itemToEquip) {
      character.value.equipItem(itemToEquip.uid)
    }
  }
}

function saveJson() {
  const dataStr =
    'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(archetypesData, null, 2))
  const link = document.createElement('a')
  link.href = dataStr
  link.download = 'archetypes.json'
  link.click()
}

// Helpers
function toggleExpand(attr) {
  expandedAttr.value = expandedAttr.value === attr ? null : attr
}
function toggleArrayItem(array, item) {
  const idx = array.indexOf(item)
  if (idx > -1) array.splice(idx, 1)
  else array.push(item)
}

// Watchers
watch(previewId, generatePreview, { immediate: true })
watch(
  archetypesData,
  () => {
    if (previewId.value === editingId.value) generatePreview()
  },
  { deep: true },
)

// Tooltips
function showTooltip(item, event) {
  if (!item) return
  tooltipItem.value = item
  tooltipPos.value = { x: event.clientX + 15, y: event.clientY + 15 }
}
function hideTooltip() {
  tooltipItem.value = null
}
function updateTooltip(event) {
  if (tooltipItem.value) tooltipPos.value = { x: event.clientX + 15, y: event.clientY + 15 }
}
</script>

<template>
  <div class="debug-container" @mousemove="updateTooltip">
    <nav class="top-nav">
      <div class="tabs">
        <button :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">
          Preview
        </button>
        <button :class="{ active: activeTab === 'editor' }" @click="activeTab = 'editor'">
          Archetype Editor
        </button>
      </div>
      <router-link to="/" class="exit-link">Exit Debug</router-link>
    </nav>

    <div v-if="activeTab === 'preview'" class="tab-content">
      <div class="preview-controls">
        <label>Archetype:</label>
        <select v-model="previewId">
          <option v-for="key in archetypeList" :key="key" :value="key">
            {{ archetypesData.archetypes[key].name }}
          </option>
        </select>
        <div class="btn-group">
          <button @click="generatePreview">Reroll Gear</button>
          <button @click="stripGear" class="danger-btn">Remove Gear</button>
        </div>
      </div>

      <div v-if="character" class="character-sheet">
        <div class="panel">
          <h3>Attributes (Lv. {{ character.level }})</h3>
          <div
            v-for="(val, stat) in character.currentStats.attributes"
            :key="stat"
            class="stat-row"
          >
            <span>{{ stat.toUpperCase() }}</span>
            <span class="val">
              {{ val }}
              <span v-if="character.currentStats.bonuses[stat]" class="bonus-text">
                (+{{ character.currentStats.bonuses[stat] }})
              </span>
            </span>
          </div>
          <hr />
          <h3>Combat</h3>
          <div
            v-for="(val, stat) in character.currentStats.combatStats"
            :key="stat"
            class="stat-row"
          >
            <template v-if="val > 0 || stat.includes('hp') || stat.includes('mp')">
              <span class="lbl">{{ stat.replace('_', ' ') }}</span>
              <span class="val">
                {{ val }}
                <span v-if="character.currentStats.bonuses[stat]" class="bonus-text">
                  (+{{ character.currentStats.bonuses[stat] }})
                </span>
              </span>
            </template>
          </div>
        </div>

        <div class="panel equipment-grid">
          <div
            v-for="slot in [
              'head',
              'shoulders',
              'chest',
              'arms',
              'hands',
              'waist',
              'legs',
              'feet',
              'weapon',
            ]"
            :key="slot"
            class="slot-wrapper"
          >
            <div class="slot-toggle">
              <input
                type="checkbox"
                :checked="!!character.equipment[slot]"
                @change="(e) => toggleSlot(slot, e.target.checked)"
                :disabled="
                  !character.equipment[slot] && !character.inventory.find((i) => i.slot === slot)
                "
              />
            </div>

            <div
              class="slot-box"
              :class="{ filled: character.equipment[slot] }"
              @mouseenter="showTooltip(character.equipment[slot], $event)"
              @mouseleave="hideTooltip"
            >
              <span class="slot-label">{{ slot }}</span>
              <span v-if="character.equipment[slot]" class="item-name">{{
                character.equipment[slot].name
              }}</span>
              <span v-else class="empty-text">Empty</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'editor'" class="tab-content editor-layout">
      <aside class="editor-sidebar">
        <h3>Select Archetype</h3>
        <select v-model="editingId" size="10" class="arch-list">
          <option v-for="key in archetypeList" :key="key" :value="key">
            {{ archetypesData.archetypes[key].name }}
          </option>
        </select>
        <button class="save-btn" @click="saveJson">Download JSON</button>
      </aside>

      <main class="editor-form" v-if="editingArchetype">
        <header class="form-header">
          <div><label>Name</label><input v-model="editingArchetype.name" type="text" /></div>
          <div>
            <label>Threat</label><input v-model.number="editingArchetype.threat" type="number" />
          </div>
        </header>
        <div class="form-group">
          <label>Description</label><textarea v-model="editingArchetype.description"></textarea>
        </div>

        <div class="section-block">
          <h3>Attributes & Growth</h3>
          <div v-for="attr in ATTRIBUTES" :key="attr" class="accordion-item">
            <div
              class="accordion-header"
              @click="toggleExpand(attr)"
              :class="{ active: expandedAttr === attr }"
            >
              <strong>{{ attr.toUpperCase() }}</strong>
              <span
                >Base: {{ editingArchetype.base_attributes[attr] }} | Growth:
                {{ editingArchetype.attribute_growth[attr] }}</span
              >
              <span class="arrow">{{ expandedAttr === attr ? '▼' : '▶' }}</span>
            </div>
            <div v-if="expandedAttr === attr" class="accordion-body">
              <div class="split-inputs">
                <label
                  >Base
                  <input type="number" v-model.number="editingArchetype.base_attributes[attr]"
                /></label>
                <label
                  >Growth
                  <input type="number" v-model.number="editingArchetype.attribute_growth[attr]"
                /></label>
              </div>
              <h4>Relations</h4>
              <div class="relations-grid">
                <div
                  v-for="(mult, key) in editingArchetype.attribute_relations[attr]"
                  :key="key"
                  class="relation-item"
                >
                  <span>{{ key }}</span
                  ><input
                    type="number"
                    step="0.1"
                    v-model.number="editingArchetype.attribute_relations[attr][key]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-block">
          <h3>Starting Kit</h3>
          <div class="kit-row">
            <label
              >Prefix Set:
              <select v-model="editingArchetype.starting_kit.prefix_id">
                <option v-for="p in itemPrefixes" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select></label
            >
            <label
              >Weapon:
              <select v-model="editingArchetype.starting_kit.weapon_subtype">
                <option v-for="w in WEAPON_TYPES" :key="w" :value="w">{{ w }}</option>
              </select></label
            >
          </div>
          <h4>Equipped Slots</h4>
          <div class="toggle-grid">
            <button
              v-for="slot in ARMOR_SLOTS"
              :key="slot"
              class="toggle-btn"
              :class="{ active: editingArchetype.starting_kit.armor_slots.includes(slot) }"
              @click="toggleArrayItem(editingArchetype.starting_kit.armor_slots, slot)"
            >
              {{ slot }}
            </button>
          </div>
        </div>
      </main>
    </div>

    <div
      v-if="tooltipItem"
      class="tooltip"
      :style="{ top: tooltipPos.y + 'px', left: tooltipPos.x + 'px' }"
    >
      <div v-for="(line, i) in tooltipItem.description" :key="i" :class="{ 'tt-head': i === 0 }">
        {{ line }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Previous Styles + New Bonus Text Style */
.debug-container {
  background: #111;
  color: #eee;
  min-height: 100vh;
  font-family: 'Courier New', monospace;
}
.top-nav {
  display: flex;
  justify-content: space-between;
  padding: 10px 20px;
  background: #222;
  border-bottom: 1px solid #444;
}
.tabs button {
  background: transparent;
  color: #888;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 1.1em;
}
.tabs button.active {
  color: #ffcc00;
  border-bottom: 2px solid #ffcc00;
  font-weight: bold;
}
.exit-link {
  color: #f44;
  text-decoration: none;
  align-self: center;
}

.preview-controls {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  border-bottom: 1px solid #333;
}
.btn-group {
  display: flex;
  gap: 10px;
}
.danger-btn {
  background: #552222;
  color: #ffaaaa;
  border: 1px solid #773333;
}

.character-sheet {
  display: flex;
  gap: 20px;
  padding: 20px;
}
.panel {
  background: #1a1a1a;
  padding: 15px;
  border: 1px solid #333;
  min-width: 250px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #333;
  padding: 4px 0;
}
.val {
  color: #fc0;
}
.bonus-text {
  color: #00ff00;
  font-size: 0.85em;
  margin-left: 5px;
} /* NEW STYLE */

.equipment-grid {
  display: grid;
  gap: 8px;
}
.slot-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
}
.slot-toggle input {
  cursor: pointer;
  width: 16px;
  height: 16px;
}
.slot-box {
  flex: 1;
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border: 1px dashed #444;
  background: #151515;
}
.slot-box.filled {
  border-style: solid;
  border-color: #666;
}
.item-name {
  color: #afa;
}

/* Editor & Tooltip */
.editor-layout {
  display: flex;
  height: calc(100vh - 60px);
}
.editor-sidebar {
  width: 250px;
  padding: 20px;
  background: #1a1a1a;
  border-right: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.editor-form {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  background: #111;
}
.arch-list {
  flex: 1;
  background: #000;
  color: #ccc;
  border: 1px solid #444;
}
.form-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.form-header input {
  background: #222;
  border: 1px solid #444;
  color: #fff;
  padding: 5px;
}
textarea {
  width: 100%;
  height: 60px;
  background: #222;
  border: 1px solid #444;
  color: #ccc;
}
.save-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
}
.section-block {
  margin-top: 30px;
  border: 1px solid #333;
  padding: 15px;
  border-radius: 4px;
}
.accordion-item {
  margin-bottom: 5px;
  border: 1px solid #444;
  background: #1e1e1e;
}
.accordion-header {
  padding: 10px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.accordion-header:hover {
  background: #2a2a2a;
}
.accordion-header.active {
  background: #333;
  color: #fc0;
}
.accordion-body {
  padding: 15px;
  background: #111;
  border-top: 1px solid #444;
}
.split-inputs {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}
.split-inputs input {
  width: 60px;
  background: #000;
  color: #fff;
  border: 1px solid #555;
}
.relations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.relation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
  background: #222;
  padding: 5px;
}
.relation-item input {
  width: 50px;
  text-align: center;
}
.toggle-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}
.toggle-btn {
  background: #222;
  border: 1px solid #444;
  color: #666;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 0.8em;
}
.toggle-btn.active {
  background: #005500;
  color: #bfb;
  border-color: #00aa00;
}
.tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.95);
  border: 1px solid #777;
  padding: 10px;
  pointer-events: none;
  z-index: 999;
}
.tt-head {
  color: #fc0;
  font-weight: bold;
  border-bottom: 1px solid #555;
  margin-bottom: 5px;
}
</style>
