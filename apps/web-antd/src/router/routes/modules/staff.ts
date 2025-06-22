import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:user-round-pen',
      order: 7,
      title: $t('page.staff.title'),
    },
    name: 'Staff',
    path: '/staff',
    children: [
      {
        name: 'StaffList',
        path: '/staff/list',
        component: () => import('#/views/staff/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.staff.list'),
        },
      },
      {
        name: 'StaffCreate',
        path: '/staff/create',
        component: () => import('#/views/staff/create.vue'),
        meta: {
          icon: 'lucide:plus',
          hideInMenu: true,
          title: $t('page.staff.create'),
        },
      },
      {
        name: 'StaffEdit',
        path: '/staff/edit/:id',
        component: () => import('#/views/staff/edit.vue'),
        meta: {
          icon: 'lucide:pencil',
          hideInMenu: true,
          title: $t('page.staff.edit'),
        },
      },
    ],
  },
];

export default routes;
