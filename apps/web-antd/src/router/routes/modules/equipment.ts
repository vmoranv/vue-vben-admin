import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:hammer',
      order: 4,
      title: $t('page.equipment.title'),
    },
    name: 'Equipment',
    path: '/equipment',
    children: [
      {
        name: 'EquipmentList',
        path: '/equipment/list',
        component: () => import('#/views/equipment/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.equipment.list'),
        },
      },
      {
        name: 'EquipmentCreate',
        path: '/equipment/create',
        component: () => import('#/views/equipment/create.vue'),
        meta: {
          icon: 'lucide:plus',
          hideInMenu: true,
          title: $t('page.equipment.create'),
        },
      },
      {
        name: 'EquipmentEdit',
        path: '/equipment/edit',
        component: () => import('#/views/equipment/edit.vue'),
        meta: {
          icon: 'lucide:pencil',
          hideInMenu: true,
          title: $t('page.equipment.edit'),
        },
      },
      {
        name: 'EquipmentMaintenance',
        path: '/equipment/maintenance',
        component: () => import('#/views/equipment/maintenance.vue'),
        meta: {
          icon: 'lucide:wrench',
          hideInMenu: true,
          title: $t('page.equipment.maintenance'),
        },
      },
    ],
  },
];

export default routes;
