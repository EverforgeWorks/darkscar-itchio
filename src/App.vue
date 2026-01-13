<script setup>
import { useGameStore } from '@/stores/counter' // or './stores/game'
const game = useGameStore()
</script>

<template>
  <div style="text-align: center; margin-top: 50px;">
    <h1>Darkscar Dev Build</h1>
    <p>Gold: {{ game.gold }}</p>
    <button @click="game.mineGold" style="padding: 10px 20px;">Mine</button>
  </div>
</template>