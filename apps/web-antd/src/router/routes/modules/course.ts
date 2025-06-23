import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:calendar',
      order: 3,
      title: $t('page.course.title'),
    },
    name: 'Course',
    path: '/course',
    component: () => import('#/views/course/index.vue'),
    children: [
      {
        name: 'CourseIndex',
        path: '',
        component: () => import('#/views/course/index.vue'),
        meta: {
          icon: 'lucide:calendar',
          title: $t('page.course.index'),
        },
      },
      {
        name: 'CourseCreate',
        path: 'create',
        component: () => import('#/views/course/create.vue'),
        meta: {
          icon: 'lucide:plus',
          hideInMenu: true,
          title: $t('page.course.create'),
        },
      },
      {
        name: 'CourseEdit',
        path: 'edit/:id',
        component: () => import('#/views/course/edit.vue'),
        meta: {
          icon: 'lucide:pencil',
          hideInMenu: true,
          title: $t('page.course.edit'),
        },
      },
      {
        name: 'CourseBookings',
        path: 'bookings',
        component: () => import('#/views/course/bookings.vue'),
        meta: {
          icon: 'lucide:calendar-check',
          title: $t('page.course.bookings'),
        },
      },
    ],
  },
];

export default routes;
