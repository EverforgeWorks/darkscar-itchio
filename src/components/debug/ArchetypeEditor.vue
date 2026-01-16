<script setup>
import { ref, reactive, computed } from 'vue'
import archetypesDataRaw from '@/data/archetypes.json'
import itemPrefixes from '@/data/itemPrefixes.json'
import equipmentData from '@/data/equipmentData.json'

const ATTRIBUTES = ['str', 'dex', 'int', 'wis', 'end']
const ARMOR_SLOTS = ['head', 'shoulders', 'chest', 'arms', 'hands', 'waist', 'legs', 'feet']
const WEAPON_TYPES = Object.keys(equipmentData.subtype_data)

const archetypesData = reactive(JSON.parse(JSON.stringify(archetypesDataRaw)))
const archetypeList = computed(() => Object.keys(archetypesData.archetypes))
const editingId = ref('martyr')
const editingArchetype = computed(() => archetypesData.archetypes[editingId.value])
const expandedAttr = ref(null)

function toggleExpand(attr) { expandedAttr.value = expandedAttr.value === attr ? null : attr }
function toggleArrayItem(array, item) {
  const idx = array.indexOf(item)
  if (idx > -1) array.splice(idx, 1)
  else array.push(item)
}
function saveJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archetypesData, null, 2));
  const link = document.createElement('a');
  link.href = dataStr;
  link.download = "archetypes.json";
  link.click();
}
</script>

<template>
  <div class="editor-layout">
    <aside class="editor-sidebar">
      <h3>Select Archetype</h3>
      <select v-model="editingId" size="10" class="arch-list">
        <option v-for="key in archetypeList" :key="key" :value="key">{{ archetypesData.archetypes[key].name }}</option>
      </select>
      <button class="save-btn" @click="saveJson">Download JSON</button>
    </aside>

    <main class="editor-form" v-if="editingArchetype">
      <header class="form-header">
        <div><label>Name</label><input v-model="editingArchetype.name" type="text"></div>
        <div><label>Threat</label><input v-model.number="editingArchetype.threat" type="number"></div>
      </header>
      <div class="form-group">
        <label>Description</label><textarea v-model="editingArchetype.description"></textarea>
      </div>

      <div class="section-block">
        <h3>Attributes & Growth</h3>
        <div v-for="attr in ATTRIBUTES" :key="attr" class="accordion-item">
          <div class="accordion-header" @click="toggleExpand(attr)" :class="{ active: expandedAttr === attr }">
            <strong>{{ attr.toUpperCase() }}</strong>
            <span>Base: {{ editingArchetype.base_attributes[attr] }} | Growth: {{ editingArchetype.attribute_growth[attr] }}</span>
            <span class="arrow">{{ expandedAttr === attr ? '▼' : '▶' }}</span>
          </div>
          <div v-if="expandedAttr === attr" class="accordion-body">
            <div class="split-inputs">
              <label>Base <input type="number" v-model.number="editingArchetype.base_attributes[attr]"></label>
              <label>Growth <input type="number" v-model.number="editingArchetype.attribute_growth[attr]"></label>
            </div>
            <h4>Relations</h4>
            <div class="relations-grid">
              <div v-for="(mult, key) in editingArchetype.attribute_relations[attr]" :key="key" class="relation-item">
                <span>{{ key }}</span><input type="number" step="0.1" v-model.number="editingArchetype.attribute_relations[attr][key]">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-block">
        <h3>Starting Kit</h3>
        <div class="kit-row">
          <label>Prefix Set: <select v-model="editingArchetype.starting_kit.prefix_id">
              <option v-for="p in itemPrefixes" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select></label>
          <label>Weapon: <select v-model="editingArchetype.starting_kit.weapon_subtype">
              <option v-for="w in WEAPON_TYPES" :key="w" :value="w">{{ w }}</option>
          </select></label>
        </div>
        <h4>Equipped Slots</h4>
        <div class="toggle-grid">
            <button v-for="slot in ARMOR_SLOTS" :key="slot" class="toggle-btn"
              :class="{ active: editingArchetype.starting_kit.armor_slots.includes(slot) }"
              @click="toggleArrayItem(editingArchetype.starting_kit.armor_slots, slot)">{{ slot }}</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.editor-layout { display: flex; height: 100%; gap: 20px; }
.editor-sidebar { width: 250px; padding: 20px; background: #1a1a1a; border-right: 1px solid #333; display: flex; flex-direction: column; gap: 10px; }
.editor-form { flex: 1; padding: 30px; overflow-y: auto; background: #111; }
.arch-list { flex: 1; background: #000; color: #ccc; border: 1px solid #444; }
.form-header { display: flex; gap: 20px; margin-bottom: 20px; }
.form-header input { background: #222; border: 1px solid #444; color: #fff; padding: 5px; }
textarea { width: 100%; height: 60px; background: #222; border: 1px solid #444; color: #ccc; }
.save-btn { background: #28a745; color: white; border: none; padding: 10px; cursor: pointer; font-weight: bold; }

.section-block { margin-top: 30px; border: 1px solid #333; padding: 15px; border-radius: 4px; }
.accordion-item { margin-bottom: 5px; border: 1px solid #444; background: #1e1e1e; }
.accordion-header { padding: 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.accordion-header:hover { background: #2a2a2a; }
.accordion-header.active { background: #333; color: #fc0; }
.accordion-body { padding: 15px; background: #111; border-top: 1px solid #444; }
.split-inputs { display: flex; gap: 20px; margin-bottom: 10px; }
.split-inputs input { width: 60px; background: #000; color: #fff; border: 1px solid #555; }
.relations-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.relation-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; background: #222; padding: 5px; }
.relation-item input { width: 50px; text-align: center; }
.toggle-grid { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
.toggle-btn { background: #222; border: 1px solid #444; color: #666; padding: 5px 10px; cursor: pointer; font-size: 0.8em; }
.toggle-btn.active { background: #005500; color: #bfb; border-color: #00aa00; }
</style>