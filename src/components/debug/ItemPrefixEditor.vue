<script setup>
import { ref, reactive, computed } from 'vue'
import itemPrefixesRaw from '@/data/itemPrefixes.json'
import equipmentData from '@/data/equipmentData.json'

// --- CONSTANTS ---
// Split slots to help with logic
const ARMOR_SLOTS = ['head', 'shoulders', 'chest', 'arms', 'hands', 'waist', 'legs', 'feet']
const WEAPON_SLOT = 'weapon'
const ALL_SLOTS = [...ARMOR_SLOTS, WEAPON_SLOT]

// Context-Aware Lists
// Armor: Ordered by weight (usually better than alphabetical for game logic)
const ARMOR_MATERIALS = ['cloth', 'leather', 'chain', 'plate'] 
// Weapons: Alphabetized for easy finding
const WEAPON_TYPES = Object.keys(equipmentData.subtype_data).sort()

// --- STATE ---
const prefixData = reactive(JSON.parse(JSON.stringify(itemPrefixesRaw)))
const selectedIndex = ref(0)
const activePrefix = computed(() => prefixData[selectedIndex.value])

// --- ACTIONS ---
function addPrefix() {
  prefixData.push({
    id: "new_set",
    name: "New Set",
    base_value: 1,
    cost_mod: 10,
    contents: []
  })
  selectedIndex.value = prefixData.length - 1
}

function removePrefix(index) {
  if (confirm("Delete this Item Set?")) {
    prefixData.splice(index, 1)
    selectedIndex.value = Math.max(0, index - 1)
  }
}

function addContentRow() {
  activePrefix.value.contents.push({ name: "New Item", slot: "head", type: "leather" })
}

function removeContentRow(idx) {
  activePrefix.value.contents.splice(idx, 1)
}

function saveJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prefixData, null, 2));
  const link = document.createElement('a');
  link.href = dataStr;
  link.download = "itemPrefixes.json";
  link.click();
}

// --- HELPER ---
/**
 * Returns the valid types based on the selected slot.
 * - Weapon Slot -> Weapon Subtypes
 * - Armor Slot -> Armor Materials
 */
function getTypesForSlot(slot) {
  if (slot === WEAPON_SLOT) {
    return WEAPON_TYPES
  }
  return ARMOR_MATERIALS
}

// Optional: Auto-fix type if slot changes to incompatible one? 
// For now, we leave it to the user to re-select, but the dropdown options will update immediately.
</script>

<template>
  <div class="editor-layout">
    <aside class="editor-sidebar">
      <h3>Prefix Sets</h3>
      <div class="list-container">
        <div 
          v-for="(p, idx) in prefixData" :key="idx" 
          class="list-item" :class="{ active: idx === selectedIndex }"
          @click="selectedIndex = idx"
        >
          {{ p.name }} <span class="id-tag">({{ p.id }})</span>
        </div>
      </div>
      <button class="add-btn" @click="addPrefix">+ Add Set</button>
      <button class="save-btn" @click="saveJson">Download JSON</button>
    </aside>

    <main class="editor-form" v-if="activePrefix">
      <header class="form-header">
        <div class="field"><label>ID</label><input v-model="activePrefix.id" /></div>
        <div class="field"><label>Name</label><input v-model="activePrefix.name" /></div>
        <div class="field small"><label>Base Val</label><input type="number" v-model.number="activePrefix.base_value" /></div>
        <div class="field small"><label>Cost Mod</label><input type="number" v-model.number="activePrefix.cost_mod" /></div>
        <button class="delete-btn" @click="removePrefix(selectedIndex)">Delete</button>
      </header>

      <div class="section-block">
        <h3>Equipment Contents</h3>
        <div class="contents-header">
          <span>Item Name</span>
          <span>Slot</span>
          <span>Type/Material</span>
          <span></span>
        </div>
        <div class="contents-list">
          <div v-for="(item, idx) in activePrefix.contents" :key="idx" class="content-row">
            <input v-model="item.name" placeholder="Item Name" />
            
            <select v-model="item.slot">
              <option v-for="s in ALL_SLOTS" :key="s" :value="s">{{ s }}</option>
            </select>
            
            <select v-model="item.type">
              <option v-for="t in getTypesForSlot(item.slot)" :key="t" :value="t">{{ t }}</option>
            </select>
            
            <button class="remove-row" @click="removeContentRow(idx)">×</button>
          </div>
        </div>
        <button class="add-row-btn" @click="addContentRow">+ Add Item Row</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.editor-layout { display: flex; height: 100%; gap: 20px; }
.editor-sidebar { width: 250px; background: #1a1a1a; padding: 20px; display: flex; flex-direction: column; gap: 10px; border-right: 1px solid #333; }
.list-container { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.list-item { padding: 10px; cursor: pointer; background: #222; border: 1px solid transparent; }
.list-item:hover { background: #2a2a2a; }
.list-item.active { background: #333; border-color: #ffcc00; color: #ffcc00; }
.id-tag { font-size: 0.8em; color: #777; }
.add-btn { background: #333; color: white; border: 1px solid #555; padding: 10px; cursor: pointer; }

.editor-form { flex: 1; padding: 20px; background: #111; overflow-y: auto; }
.form-header { display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-end; }
.field { display: flex; flex-direction: column; flex: 1; }
.field.small { flex: 0.4; }
.field label { color: #aaa; font-size: 0.9em; margin-bottom: 5px; }
.field input { background: #222; border: 1px solid #444; color: white; padding: 8px; }

.section-block { margin-top: 20px; border: 1px solid #333; padding: 15px; }
.contents-header { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 10px; padding: 5px; color: #888; font-weight: bold; border-bottom: 1px solid #444; }
.content-row { display: grid; grid-template-columns: 2fr 1fr 1fr 40px; gap: 10px; padding: 5px 0; border-bottom: 1px dashed #333; }
.content-row input, .content-row select { background: #1a1a1a; border: 1px solid #444; color: #ccc; padding: 8px; width: 100%; }
.remove-row { background: transparent; border: 1px solid #522; color: #f44; cursor: pointer; font-weight: bold; }
.add-row-btn { width: 100%; padding: 10px; margin-top: 10px; background: #222; border: 1px dashed #555; color: #888; cursor: pointer; }
.add-row-btn:hover { background: #333; color: white; }

.save-btn { background: #28a745; color: white; border: none; padding: 10px; cursor: pointer; margin-top: auto; }
.delete-btn { background: #552222; color: #ffaaaa; border: none; padding: 8px 15px; height: 35px; cursor: pointer; }
</style>