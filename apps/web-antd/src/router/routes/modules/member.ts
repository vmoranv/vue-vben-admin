import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 6,
      title: $t('page.member.title'),
    },
    name: 'Member',
    path: '/member',
    children: [
      {
        name: 'MemberList',
        path: '/member/list',
        component: () => import('#/views/member/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.member.list'),
        },
      },
      {
        name: 'MemberCreate',
        path: '/member/create',
        component: () => import('#/views/member/create.vue'),
        meta: {
          icon: 'lucide:plus',
          hideInMenu: true,
          title: $t('page.member.create'),
        },
      },
      {
        name: 'MemberEdit',
        path: '/member/edit/:id',
        component: () => import('#/views/member/edit.vue'),
        meta: {
          icon: 'lucide:pencil',
          hideInMenu: true,
          title: $t('page.member.edit'),
        },
      },
      {
        name: 'MemberCheckin',
        path: '/member/checkin',
        component: () => import('#/views/member/checkin.vue'),
        meta: {
          icon: 'lucide:check-circle',
          title: $t('page.member.checkin'),
        },
      },
    ],
  },
];

export default routes;
