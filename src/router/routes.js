import Login from "pages/Login.vue";

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      //{ path: '', component: () => import('pages/IndexPage.vue') },
      { path: '', component: () => import('pages/Home.vue') },
      //{ path: 'login', component: () => import('pages/Login.vue') },
      { path: 'login', component: Login,},
      { path: 'dashboard', component: () => import('pages/Dashboard.vue')},
      { path: "/workshops", component: () => import("pages/Workshops.vue")},
      { path: "/products", component: () => import("pages/ProductTypes.vue")},
      { path: "/details", component: () => import("pages/Details.vue")},
      { path: "/employees", component: () => import("pages/Employees.vue")},
      { path: "/salaries", component: () => import("pages/Salaries.vue")},
      { path: "/register", component: () => import("pages/Register.vue")},
      { path: "/profile", component: () => import("pages/Profile.vue"), meta: { requiresAuth: true}},
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
];

export default routes
