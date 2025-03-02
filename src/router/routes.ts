import ACCESS_ENUM from "@/access/accessEnum";
import HomeView from "@/views/HomeView.vue";
import KnowledgeGraph from "@/views/KnowledgeGraph.vue";
import NoAuthView from "@/views/NoAuthView.vue";
import AddQuestionView from "@/views/question/AddQuestionView.vue";
import ManageQuestionView from "@/views/question/ManageQuestionView.vue";
import EditQuestionSolvingView from "@/views/questionSolving/EditQuestionSolvingView.vue";
import QuestionSolvingInformationView from "@/views/questionSolving/QuestionSolvingInformationView.vue";
import ViewQuestionSolvingView from "@/views/questionSolving/ViewQuestionSolvingView.vue";
import UserManageView from "@/views/user/UserManageView.vue";
import CardManagementView from "@/views/workspace/CardManagementView.vue";
import GroupDetailView from "@/views/workspace/GroupDetailView.vue";
import WorkspaceView from "@/views/workspace/WorkspaceView.vue";
import { RouteRecordRaw } from "vue-router";

export const routes: Array<RouteRecordRaw> = [
  {
    path: "/user",
    name: "用户",
    component: () => import("@/layouts/UserLayout.vue"),
    children: [
      {
        path: "/user/login",
        name: "用户登录",
        component: () => import("@/views/user/UserLoginView.vue"),
      },
      {
        path: "/user/smsLogin",
        name: "用户短信登录",
        component: () => import("@/views/user/UserSmsLoginView.vue"),
      },
      {
        path: "/user/register",
        name: "用户注册",
        component: () => import("@/views/user/UserRegisterView.vue"),
      },
    ],
    meta: {
      hideInMenu: true,
    },
  },
  {
    path: "/info/user",
    name: "用户信息",
    component: () => import("@/views/user/UserInfoView.vue"),
    meta: {
      // access: ACCESS_ENUM.USER,
      hideInMenu: true,
    },
  },
  {
    path: "/",
    name: "首页",
    component: HomeView,
  },
  // {
  //   path: "/topQuestions",
  //   name: "Top50",
  //   component: () => import("@/views/question/TopQuestionsView.vue"),
  // },
  // {
  //   path: "/question_submit",
  //   name: "浏览题目提交",
  //   component: QuestionSubmitView,
  // },
  {
    path: "/view/question/:id",
    name: "在线做题",
    component: () => import("@/views/question/ViewQuestionView.vue"),
    props: true,
    meta: {
      hideHeader: true,
      hideInMenu: true,
      // openInNewTab: true,
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
  // {
  //   path: "/ai-recommend",
  //   name: "AI推荐",
  //   component: AIRecommendView,
  //   meta: {
  //     keepAlive: true,
  //   },
  // },
  // {
  //   path: "/aiAnalysis",
  //   name: "AI 学习分析",
  //   component: UserAnalysisView,
  //   meta: {
  //     keepAlive: true,
  //   },
  // },
  {
    path: "/resource",
    name: "学习资源",
    component: () => import("@/views/resource/ResourceManagerView.vue"),
    meta: {
      // hideHeader: true,
      // openInNewTab: true,
    },
  },
  {
    path: "/questions",
    name: "编程专区",
    component: () => import("@/views/question/QuestionsView.vue"),
  },
  {
    path: "/cardManage",
    name: "卡片仓库",
    component: CardManagementView,
    meta: {
      hideHeader: true,
      // openInNewTab: true,
    },
  },
  {
    path: "/workspace",
    name: "个人牌组",
    component: WorkspaceView,
    meta: {
      // hideHeader: true,
      // openInNewTab: true,
      // hideInMenu: true,
    },
  },

  {
    path: "/flashcard/review",
    name: "高效复习",
    component: () => import("@/views/flashcard/ReviewView.vue"),
    meta: {
      // openInNewTab: true,
    },
  },
  {
    path: "/graph",
    name: "知识图谱",
    component: KnowledgeGraph,
    meta: {
      hideHeader: true,
      // openInNewTab: true,
    },
  },
  {
    path: "/workspace/group/:group",
    name: "groupDetail",
    component: GroupDetailView,
    props: true,
    meta: {
      hideHeader: true,
      hideInMenu: true,
    },
  },

  {
    path: "/resource-preview",
    name: "resource-preview",
    component: () => import("@/views/resource/ResourcePreviewView.vue"),
    meta: {
      hideHeader: true,
      hideInMenu: true,
    },
  },
];
