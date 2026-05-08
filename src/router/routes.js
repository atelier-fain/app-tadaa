const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('pages/Dashboard.vue') },
      { path: '/modules/access', name: 'access', component: () => import('pages/modules/AccessPage.vue') },
      { path: '/modules/access_proedus', name: 'access_proedus', component: () => import('pages/modules/AccessProedusPage.vue') },
      { path: '/modules/report', name: 'report', component: () => import('pages/modules/ReportPage.vue') },
      { path: '/modules/tickets', name: 'tickets', component: () => import('pages/modules/TicketsPage.vue') },
      { path: '/modules/top_up', name: 'top_up', component: () => import('pages/modules/TopUpPage.vue') },
      { path: '/modules/vendor', name: 'vendor', component: () => import('pages/modules/VendorPage.vue') },
      { path: '/modules/vendor/settings', name: 'vendor-settings', component: () => import('pages/modules/VendorSettings.vue') }
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
