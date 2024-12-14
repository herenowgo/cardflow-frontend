<template>
  <div class="basic-layout">
    <!-- 全局顶部导航 -->
    <header class="global-header">
      <div class="header-content">
        <div class="logo">
          <router-link to="/">OJ System</router-link>
        </div>
        <a-menu mode="horizontal">
          <a-menu-item key="1">
            <router-link to="/problems">题库</router-link>
          </a-menu-item>
          <a-menu-item key="2">
            <router-link to="/contest">竞赛</router-link>
          </a-menu-item>
          <a-menu-item key="3">
            <router-link to="/discuss">讨论</router-link>
          </a-menu-item>
        </a-menu>
        <div class="user-info">
          <!-- 用户信息和登录状态 -->
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-container">
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
.basic-layout {
  min-height: 100vh;
}

.global-header {
  height: 60px;
  background-color: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
}

.main-container {
  height: calc(100vh - 60px);
  overflow: hidden;
}
</style> 