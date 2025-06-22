import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wallet',
      order: 5,
      title: $t('page.financial.title'),
    },
    name: 'Financial',
    path: '/financial',
    children: [
      {
        name: 'FinancialIndex',
        path: '/financial',
        component: () => import('#/views/financial/index.vue'),
        meta: {
          icon: 'lucide:list', 
          title: $t('page.financial.index'),
        },
      },
      {
        name: 'FinancialCreate',
        path: '/financial/create',
        component: () => import('#/views/financial/create.vue'),
        meta: {
          icon: 'lucide:plus',
          title: $t('page.financial.create'),
        },
      },
      {
        name: 'FinancialEdit',
        path: '/financial/edit/:id',
        component: () => import('#/views/financial/edit.vue'),
        meta: {
          icon: 'lucide:pencil',
          hideInMenu: true,
          title: $t('page.financial.edit'),
        },
      },
      {
        name: 'FinancialStats',
        path: '/financial/stats',
        component: () => import('#/views/financial/stats.vue'),
        meta: {
          icon: 'lucide:bar-chart',
          title: $t('page.financial.stats'),
        },
      },
    ],
  },
];

export default routes;
