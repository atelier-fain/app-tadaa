const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('pages/Dashboard.vue') },
      { path: '/modules/access', name: 'access', component: () => import('pages/modules/AccessPage.vue'), meta: { permission: 'app_access' } },
      { path: '/modules/tickets', name: 'tickets', component: () => import('pages/modules/TicketsPage.vue'), meta: { permission: 'app_tickets' } },
      { path: '/modules/tickets/callback', name: 'tickets-callback', component: () => import('pages/modules/Callback.vue') },
      { path: '/modules/top_up', name: 'top_up', component: () => import('pages/modules/TopUpPage.vue'), meta: { permission: 'app_topup' } },
      { path: '/modules/vendor', name: 'vendor', component: () => import('pages/modules/VendorPage.vue'), meta: { permission: 'app_vendor' } },
      { path: '/modules/vendor/settings', name: 'vendor-settings', component: () => import('pages/modules/VendorSettings.vue'), meta: { permission: 'app_vendor' } }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('pages/LoginPage.vue')
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
