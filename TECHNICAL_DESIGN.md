# 英语学习平台 - 技术方案设计

## 📊 整体架构

### 方案选择：混合方案（推荐）

```
┌─────────────────────────────────────────────────────┐
│                   用户浏览器                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ React 前端   │  │  IndexedDB   │  │LocalStorage│ │
│  │              │  │  (词汇数据)   │  │  (缓存)    │ │
│  └──────┬───────┘  └──────────────┘  └───────────┘ │
└─────────┼──────────────────────────────────────────┘
          │
          ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│                  Supabase 云服务                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ PostgreSQL   │  │  Auth 认证   │  │  Storage  │ │
│  │  数据库      │  │ (Google登录) │  │  (可选)   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
          ↑
          │ 定期同步
┌─────────────────────────────────────────────────────┐
│              开源数据源 (本地化)                       │
│  - Free Dictionary API                              │
│  - WordNet 数据库                                    │
│  - NGSL 词汇表                                       │
│  - 自定义扩展词汇                                     │
└─────────────────────────────────────────────────────┘
```

## 🗄️ 数据库设计（PostgreSQL）

### 核心表结构

```sql
-- 1. 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  preferred_level VARCHAR(10) DEFAULT 'A1',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 词汇表（核心数据）
CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(100) UNIQUE NOT NULL,
  pronunciation VARCHAR(100),
  part_of_speech VARCHAR(50),
  level VARCHAR(10) NOT NULL, -- A1, A2, B1, B2, C1, C2
  meaning_cn TEXT NOT NULL,
  definition_en TEXT NOT NULL,
  example_en TEXT,
  example_cn TEXT,
  category VARCHAR(50),
  frequency_rank INTEGER, -- 词频排名
  image_url TEXT, -- 可选：单词配图
  audio_url TEXT, -- 可选：真人发音
  source VARCHAR(50), -- 数据来源：ngsl, oxford, custom
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 用户进度表
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  current_level VARCHAR(10) DEFAULT 'A1',
  streak_days INTEGER DEFAULT 0,
  last_study_date DATE,
  total_study_time INTEGER DEFAULT 0, -- 总学习时间（秒）
  words_learned INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 用户已掌握单词表
CREATE TABLE user_mastered_words (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES words(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 1, -- 1-5级掌握程度
  review_count INTEGER DEFAULT 0, -- 复习次数
  last_reviewed_at TIMESTAMP,
  next_review_at TIMESTAMP, -- 间隔重复算法
  mastered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- 5. 测验记录表
CREATE TABLE quiz_results (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level VARCHAR(10) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  accuracy DECIMAL(5,2), -- 正确率
  points_earned INTEGER DEFAULT 0,
  time_spent INTEGER, -- 用时（秒）
  completed_at TIMESTAMP DEFAULT NOW()
);

-- 6. 测验详细记录（可选）
CREATE TABLE quiz_answers (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quiz_results(id) ON DELETE CASCADE,
  word_id INTEGER REFERENCES words(id),
  user_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  answered_at TIMESTAMP DEFAULT NOW()
);

-- 7. 徽章表
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  badge_key VARCHAR(50) UNIQUE NOT NULL,
  name_cn VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  icon VARCHAR(10),
  condition_type VARCHAR(50), -- words_count, quiz_count, streak, accuracy, points
  condition_value INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. 用户徽章关联表
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 9. 学习记录表（用于统计和分析）
CREATE TABLE study_sessions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(20), -- learn, quiz, review
  level VARCHAR(10),
  words_studied INTEGER DEFAULT 0,
  duration INTEGER, -- 秒
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- 10. 用户设置表
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light', -- light, dark, cupcake, emerald
  language VARCHAR(10) DEFAULT 'zh-CN',
  notification_enabled BOOLEAN DEFAULT true,
  daily_goal INTEGER DEFAULT 10, -- 每天学习单词目标
  review_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 索引优化

```sql
-- 性能优化索引
CREATE INDEX idx_words_level ON words(level);
CREATE INDEX idx_words_frequency ON words(frequency_rank);
CREATE INDEX idx_user_mastered_words_user ON user_mastered_words(user_id);
CREATE INDEX idx_user_mastered_words_next_review ON user_mastered_words(next_review_at);
CREATE INDEX idx_quiz_results_user ON quiz_results(user_id);
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
```

## 🔐 Google 登录集成方案

### 使用 Supabase Auth

#### 1. Supabase 配置

```javascript
// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 2. Google OAuth 集成

```javascript
// src/hooks/useAuth.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前用户
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Google 登录
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) console.error('Error:', error)
  }

  // 登出
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('Error:', error)
  }

  return { user, loading, signInWithGoogle, signOut }
}
```

#### 3. 前端组件集成

```javascript
// src/components/AuthButton.jsx
import { useAuth } from '../hooks/useAuth'

const AuthButton = () => {
  const { user, loading, signInWithGoogle, signOut } = useAuth()

  if (loading) {
    return <div className="loading loading-spinner"></div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={user.user_metadata.avatar_url}
          alt="Avatar"
          className="w-8 h-8 rounded-full"
        />
        <span>{user.user_metadata.full_name}</span>
        <button className="btn btn-sm btn-ghost" onClick={signOut}>
          登出
        </button>
      </div>
    )
  }

  return (
    <button
      className="btn btn-primary"
      onClick={signInWithGoogle}
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        {/* Google Icon SVG */}
      </svg>
      使用 Google 登录
    </button>
  )
}
```

## 📚 开源数据本地化方案

### 方案 A：静态JSON文件（推荐MVP阶段）

#### 数据获取脚本

```javascript
// scripts/fetchVocabulary.js
import axios from 'axios'
import fs from 'fs'

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

// NGSL核心词汇列表（前2000个）
const ngslWords = [
  'abandon', 'ability', 'able', 'about', 'above',
  // ... 导入NGSL词汇表
]

async function fetchWordData(word) {
  try {
    const response = await axios.get(`${DICTIONARY_API}${word}`)
    const data = response.data[0]

    return {
      word: data.word,
      pronunciation: data.phonetics[0]?.text || '',
      definitions: data.meanings.map(m => ({
        partOfSpeech: m.partOfSpeech,
        definition: m.definitions[0].definition,
        example: m.definitions[0].example || ''
      }))
    }
  } catch (error) {
    console.error(`Error fetching ${word}:`, error.message)
    return null
  }
}

async function buildVocabularyDatabase() {
  const vocabulary = []

  for (const word of ngslWords) {
    const data = await fetchWordData(word)
    if (data) {
      vocabulary.push(data)
      // 添加延迟避免API限流
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  fs.writeFileSync(
    'src/data/vocabulary-extended.json',
    JSON.stringify(vocabulary, null, 2)
  )

  console.log(`✅ 成功获取 ${vocabulary.length} 个单词`)
}

buildVocabularyDatabase()
```

### 方案 B：IndexedDB动态加载

```javascript
// src/utils/indexedDBManager.js
import { openDB } from 'idb'

const DB_NAME = 'EnglishLearningDB'
const DB_VERSION = 1

export async function initDB() {
  return await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建词汇存储
      if (!db.objectStoreNames.contains('words')) {
        const wordStore = db.createObjectStore('words', {
          keyPath: 'id',
          autoIncrement: true
        })
        wordStore.createIndex('level', 'level', { unique: false })
        wordStore.createIndex('word', 'word', { unique: true })
      }
    }
  })
}

// 批量导入词汇
export async function importWords(words) {
  const db = await initDB()
  const tx = db.transaction('words', 'readwrite')

  for (const word of words) {
    await tx.store.add(word)
  }

  await tx.done
}

// 按等级获取词汇
export async function getWordsByLevel(level) {
  const db = await initDB()
  return await db.getAllFromIndex('words', 'level', level)
}
```

## 🔄 数据同步策略

### 离线优先策略

```javascript
// src/utils/syncManager.js
import { supabase } from '../lib/supabaseClient'
import { getProgress, saveProgress } from './progressManager'

export async function syncUserProgress(user) {
  if (!user) return

  const localProgress = getProgress()

  // 1. 从服务器获取最新进度
  const { data: serverProgress, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Sync error:', error)
    return
  }

  // 2. 合并策略：服务器和本地取最大值
  const mergedProgress = {
    total_points: Math.max(
      localProgress.totalPoints,
      serverProgress?.total_points || 0
    ),
    streak_days: Math.max(
      localProgress.streak,
      serverProgress?.streak_days || 0
    ),
    // ... 其他字段
  }

  // 3. 更新到服务器
  await supabase
    .from('user_progress')
    .upsert({
      user_id: user.id,
      ...mergedProgress,
      updated_at: new Date().toISOString()
    })

  // 4. 更新本地
  saveProgress(mergedProgress)
}
```

## 📦 依赖包清单

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "idb": "^7.1.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "axios": "^1.6.0"
  }
}
```

## 🚀 实施步骤

### 阶段 1：数据准备（1-2天）
1. ✅ 编写数据获取脚本
2. ✅ 从开源API抓取词汇
3. ✅ 清洗和标准化数据
4. ✅ 添加中文翻译（可用翻译API）
5. ✅ 按CEFR等级分类

### 阶段 2：Supabase配置（1天）
1. ✅ 创建Supabase项目
2. ✅ 配置数据库表结构
3. ✅ 启用Google OAuth
4. ✅ 配置Row Level Security (RLS)

### 阶段 3：前端集成（2-3天）
1. ✅ 安装Supabase客户端
2. ✅ 实现认证hooks
3. ✅ 迁移数据到IndexedDB
4. ✅ 实现数据同步逻辑
5. ✅ 更新UI组件

### 阶段 4：测试与优化（1-2天）
1. ✅ 离线功能测试
2. ✅ 数据同步测试
3. ✅ 性能优化
4. ✅ 用户体验优化

## 💰 成本估算

### 免费方案（推荐起步）
- Supabase Free Tier:
  - ✅ 500MB PostgreSQL数据库
  - ✅ 50,000 月活跃用户
  - ✅ 无限Google登录
  - ✅ 1GB文件存储
- Vercel/Netlify部署：免费

### 付费方案（规模化后）
- Supabase Pro: $25/月
  - 8GB数据库
  - 100,000 月活跃用户
  - 100GB文件存储

## 🔒 安全考虑

### Row Level Security (RLS) 策略

```sql
-- 用户只能访问自己的数据
CREATE POLICY "Users can view own progress"
ON user_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON user_progress FOR UPDATE
USING (auth.uid() = user_id);

-- 词汇表所有人可读
CREATE POLICY "Words are viewable by everyone"
ON words FOR SELECT
TO authenticated, anon
USING (true);
```

## 📊 性能优化

1. **词汇数据**：首屏只加载当前等级词汇
2. **图片懒加载**：单词配图按需加载
3. **离线缓存**：Service Worker缓存静态资源
4. **数据库索引**：优化查询性能
5. **分页加载**：大数据量分批加载

---

## 🎯 总结

这个方案的优势：
- ✅ 快速实现（1周内可上线）
- ✅ 低成本（完全免费起步）
- ✅ 可扩展（支持10万+用户）
- ✅ 开源友好（Supabase可自托管）
- ✅ 离线支持（IndexedDB + LocalStorage）
- ✅ 数据主权（可迁移到自己的服务器）
