import { createRouter, createWebHistory } from 'vue-router'
import AdminPage from '../views/AdminPage.vue'
import SessionTracker from '../views/SessionTracker.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/P4T1N0M4STUS4B3SL0QU34S3S',
      name: 'admin',
      component: AdminPage
    },
    {
      path: '/session/:sessionId',
      name: 'session',
      component: SessionTracker
    }
  ]
})

export default router
