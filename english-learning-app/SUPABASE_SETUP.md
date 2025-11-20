# Supabase 设置指南

本指南将帮助你配置 Supabase 后端，实现用户认证和云端数据同步功能。

## 📋 前置要求

- Google 账号（用于创建 Supabase 项目）
- Google Cloud Console 账号（用于配置 OAuth）

## 🚀 步骤 1：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/)
2. 点击 "Start your project" 注册/登录
3. 创建新组织（Organization）
4. 创建新项目（Project）：
   - **Name**: `english-learning-platform`
   - **Database Password**: 保存好这个密码（后续可能需要）
   - **Region**: 选择离你最近的区域（如 Northeast Asia - Tokyo）
5. 等待项目初始化完成（约 2-3 分钟）

## 🗄️ 步骤 2：创建数据库表

1. 在 Supabase 项目中，点击左侧菜单 "SQL Editor"
2. 点击 "New Query"
3. 复制 `database/schema.sql` 文件的内容并粘贴
4. 点击 "Run" 执行 SQL
5. 验证表已创建：点击左侧 "Table Editor"，应该看到所有创建的表

## 🔑 步骤 3：获取 API 密钥

1. 点击左侧菜单 "Project Settings" > "API"
2. 找到以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...`（这是你的 API Key）
3. 复制这两个值

4. 在项目根目录创建 `.env` 文件：

```bash
cd english-learning-app
cp .env.example .env
```

5. 编辑 `.env` 文件，填入你的值：

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔐 步骤 4：配置 Google OAuth

### 4.1 创建 Google OAuth 凭证

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 "Google+ API"：
   - 左侧菜单 > "APIs & Services" > "Library"
   - 搜索 "Google+ API"
   - 点击 "Enable"

4. 创建 OAuth 凭证：
   - 左侧菜单 > "APIs & Services" > "Credentials"
   - 点击 "+ CREATE CREDENTIALS" > "OAuth client ID"
   - Application type: "Web application"
   - Name: `English Learning Platform`

5. 配置授权重定向 URI：
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
   （将 `your-project-id` 替换为你的 Supabase 项目 ID）

6. 点击 "Create"
7. 复制 **Client ID** 和 **Client Secret**

### 4.2 在 Supabase 中配置 Google Provider

1. 返回 Supabase 项目
2. 左侧菜单 > "Authentication" > "Providers"
3. 找到 "Google"，点击展开
4. 启用 Google provider
5. 填入：
   - **Client ID**: 从 Google Cloud Console 复制的值
   - **Client Secret**: 从 Google Cloud Console 复制的值
6. 点击 "Save"

## 🔒 步骤 5：配置 Row Level Security (RLS)

为了保护用户数据，需要配置 RLS 策略。

1. 在 Supabase 的 SQL Editor 中执行：

```sql
-- 为 user_progress 表启用 RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的进度
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

-- 用户只能更新自己的进度
CREATE POLICY "Users can insert own progress"
ON user_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- 为其他用户相关表启用类似的 RLS
ALTER TABLE user_mastered_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 词汇表所有人可读
CREATE POLICY "Words are viewable by everyone"
ON words FOR SELECT
TO authenticated, anon
USING (true);

-- 徽章表所有人可读
CREATE POLICY "Badges are viewable by everyone"
ON badges FOR SELECT
TO authenticated, anon
USING (true);
```

## ✅ 步骤 6：测试配置

1. 启动开发服务器：
```bash
npm run dev
```

2. 打开浏览器访问 `http://localhost:5173`

3. 点击右上角的 "Google 登录" 按钮

4. 应该会跳转到 Google 登录页面

5. 登录成功后，应该会看到你的头像出现在右上角

## 📊 步骤 7：初始化词汇数据（可选）

如果你想在数据库中存储词汇数据而不是使用本地 JSON：

1. 在 Supabase 中运行数据导入脚本
2. 或者手动在 Table Editor 中添加词汇数据

## 🔧 故障排除

### 问题 1：Google 登录失败

**症状**：点击 Google 登录后无响应或报错

**解决方案**：
1. 检查 `.env` 文件中的 URL 和 Key 是否正确
2. 确认 Google Cloud Console 中的重定向 URI 正确
3. 检查浏览器控制台是否有错误信息

### 问题 2：数据无法同步

**症状**：登录后数据没有保存到云端

**解决方案**：
1. 检查 RLS 策略是否正确配置
2. 在 Supabase 的 "Table Editor" 中查看是否有数据插入
3. 检查浏览器控制台的网络请求

### 问题 3：表创建失败

**症状**：执行 SQL 时报错

**解决方案**：
1. 确保按顺序执行 SQL（依赖关系）
2. 检查是否有表名冲突
3. 查看 Supabase 的日志了解详细错误

## 📱 步骤 8：配置生产环境

当你准备部署到生产环境时：

1. 在 Vercel/Netlify 中配置环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. 更新 Google Cloud Console 的授权重定向 URI：
   ```
   https://your-domain.com  # 你的生产域名
   https://your-project-id.supabase.co/auth/v1/callback
   ```

## 📖 相关资源

- [Supabase 文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)

## 💡 提示

- **免费额度**：Supabase 免费版支持 50,000 月活跃用户，足够大多数项目使用
- **数据备份**：Supabase 自动备份数据库，但建议定期导出重要数据
- **监控**：在 Supabase Dashboard 中可以查看 API 使用情况和数据库性能

---

设置完成后，你就可以享受完整的用户认证和云端同步功能了！🎉
