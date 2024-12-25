import { RouteRecordRaw } from "vue-router";
import UserLayout from "@/layouts/UserLayout.vue";
import UserLoginView from "@/views/user/UserLoginView.vue";
import UserRegisterView from "@/views/user/UserRegisterView.vue";
import NoAuthView from "@/views/NoAuthView.vue";
import ACCESS_ENUM from "@/access/accessEnum";
import AddQuestionView from "@/views/question/AddQuestionView.vue";
import ManageQuestionView from "@/views/question/ManageQuestionView.vue";
import QuestionsView from "@/views/question/QuestionsView.vue";
import ViewQuestionView from "@/views/question/ViewQuestionView.vue";
import ViewQuestionSolvingView from "@/views/questionSolving/ViewQuestionSolvingView.vue";
import EditQuestionSolvingView from "@/views/questionSolving/EditQuestionSolvingView.vue";
import QuestionSolvingInformationView from "@/views/questionSolving/QuestionSolvingInformationView.vue";
import TopQuestionsView from "@/views/question/TopQuestionsView.vue";
import UserSmsLoginView from "@/views/user/UserSmsLoginView.vue";
import UserInfoView from "@/views/user/UserInfoView.vue";
import AIRecommendView from "@/views/AIRecommendView.vue";
import BasicLayout from "@/layouts/BasicLayout.vue";
import UserManageView from "@/views/user/UserManageView.vue";
import UserAnalysisView from "@/views/user/UserAnalysisView.vue";
import WorkspaceView from "@/views/workspace/WorkspaceView.vue";
import GroupDetailView from "@/views/workspace/GroupDetailView.vue";

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/user",
    name: "用户",
    component: UserLayout,
    children: [
      {
        path: "/user/login",
        name: "用户登录",
        component: UserLoginView,
      },

      {
        path: "/user/smsLogin",
        name: "用户短信登录",
        component: UserSmsLoginView,
      },
      {
        path: "/user/register",
        name: "用户注册",
        component: UserRegisterView,
      },
    ],
    meta: {
      hideInMenu: true,
    },
  },
  {
    path: "/info/user",
    name: "用户信息",
    component: UserInfoView,
    meta: {
      // access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/questions",
    alias: "/",
    name: "题库",
    component: QuestionsView,
  },
  {
    path: "/topQuestions",
    name: "Top50",
    component: TopQuestionsView,
  },
  // {
  //   path: "/question_submit",
  //   name: "浏览题目提交",
  //   component: QuestionSubmitView,
  // },
  {
    path: "/view/question/:id",
    name: "在线做题",
    component: ViewQuestionView,
    props: true,
    meta: {
      // access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/questionSolving/:id",
    name: "查看题解",
    component: QuestionSolvingInformationView,
    props: true,
    meta: {
      // access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/view/QuestionSolving",
    name: "浏览题解",
    component: ViewQuestionSolvingView,
    meta: {
      access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/edit/QuestionSolving",
    name: "写题解",
    component: EditQuestionSolvingView,
    meta: {
      access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/add/question",
    name: "创建题目",
    component: AddQuestionView,
    meta: {
      access: ACCESS_ENUM.ADMIN,
    },
  },
  {
    path: "/update/question",
    name: "更新题目",
    component: AddQuestionView,
    meta: {
      access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/manage/question/",
    name: "管理题目",
    component: ManageQuestionView,
    meta: {
      access: ACCESS_ENUM.ADMIN,
    },
  },
  {
    path: "/manage/user/",
    name: "管理用户",
    component: UserManageView,
    meta: {
      access: ACCESS_ENUM.ADMIN,
    },
  },
  // {
  //   path: "/",
  //   name: "主页",
  //   component: QuestionsView,
  // },
  // {
  //   path: "/hide",
  //   name: "隐藏页面",
  //   component: HomeView,
  //   meta: {
  //     hideInMenu: true,
  //   },
  // },
  {
    path: "/noAuth",
    name: "无权限",
    component: NoAuthView,
    meta: {
      hideInMenu: true,
    },
  },
  // {
  //   path: "/admin",
  //   name: "管理员可见",
  //   component: AdminView,
  //   meta: {
  //     access: ACCESS_ENUM.ADMIN,
  //   },
  // },
  // {
  //   path: "/about",
  //   name: "关于我的",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  // },
  {
    path: "/ai-recommend",
    name: "AI推荐",
    component: AIRecommendView,
    meta: {
      keepAlive: true,
    },
  },
  {
    path: "/aiAnalysis",
    name: "AI 学习分析",
    component: UserAnalysisView,
    meta: {
      keepAlive: true,
    },
  },
  {
    path: "/workspace",
    name: "工作台",
    component: WorkspaceView,
  },
  {
    path: "/workspace/group/:group",
    name: "groupDetail",
    component: GroupDetailView,
    props: true,
    meta: {
      hideInMenu: true,
    },
  },
  {
    path: "/resource",
    name: "学习资源",
    component: () => import("@/views/resource/ResourceManageView.vue"),
  },
  {
    path: "/resource-preview",
    name: "resource-preview",
    component: () => import("@/views/resource/ResourcePreviewView.vue"),
  },
];
