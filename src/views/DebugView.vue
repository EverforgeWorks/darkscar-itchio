<script setup>
import { ref } from 'vue'
import CharacterPreview from '@/components/debug/CharacterPreview.vue'
import ArchetypeEditor from '@/components/debug/ArchetypeEditor.vue'
import ItemPrefixEditor from '@/components/debug/ItemPrefixEditor.vue'
import CoreSuffixEditor from '@/components/debug/CoreSuffixEditor.vue' // Import new component

const activeTab = ref('preview')
</script>

<template>
  <div class="debug-container">
    <nav class="top-nav">
      <div class="tabs">
        <button :class="{ active: activeTab === 'preview' }" @click="activeTab = 'preview'">
          Preview & Fabricator
        </button>
        <button :class="{ active: activeTab === 'archetypes' }" @click="activeTab = 'archetypes'">
          Archetype Editor
        </button>
        <button :class="{ active: activeTab === 'prefixes' }" @click="activeTab = 'prefixes'">
          Item Set Editor
        </button>
        <button :class="{ active: activeTab === 'suffixes' }" @click="activeTab = 'suffixes'">
          Suffix Editor
        </button>
      </div>
      <router-link to="/" class="exit-link">Exit Debug</router-link>
    </nav>

    <div class="content-area">
      <keep-alive>
        <component
          :is="
            activeTab === 'preview'
              ? CharacterPreview
              : activeTab === 'archetypes'
                ? ArchetypeEditor
                : activeTab === 'prefixes'
                  ? ItemPrefixEditor
                  : CoreSuffixEditor
          "
        />
      </keep-alive>
    </div>
  </div>
</template>

<style scoped>
/* Unchanged styles from your previous file */
.debug-container {
  background: #111;
  color: #eee;
  height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', monospace;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  background: #222;
  border-bottom: 1px solid #444;
  height: 60px;
  align-items: center;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  height: 100%;
}

.tabs button {
  background: transparent;
  color: #888;
  border: none;
  padding: 0 20px;
  cursor: pointer;
  font-size: 1em;
  height: 100%;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
}

.tabs button:hover {
  background: #2a2a2a;
  color: #ccc;
}

.tabs button.active {
  color: #ffcc00;
  border-bottom-color: #ffcc00;
  background: #2a2a2a;
  font-weight: bold;
}

.exit-link {
  color: #f44;
  text-decoration: none;
  font-weight: bold;
}

.content-area {
  flex: 1;
  overflow: hidden; /* Components handle their own scrolling */
  padding: 20px;
}
</style>
