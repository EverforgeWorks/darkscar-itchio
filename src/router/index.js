import { createRouter, createWebHistory } from 'vue-router'
import DebugView from '@/views/DebugView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/debug', name: 'debug', component: DebugView },
    // You can add a redirect or a HomeView here later
    { path: '/', redirect: '/debug' },
  ],
})

export default router
