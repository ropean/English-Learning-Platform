import { openDB } from 'idb'

const DB_NAME = 'EnglishLearningDB'
const DB_VERSION = 1
const STORES = {
  WORDS: 'words',
  USER_PROGRESS: 'userProgress',
  MASTERED_WORDS: 'masteredWords',
}

// 初始化数据库
export async function initDB() {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // 创建词汇存储
        if (!db.objectStoreNames.contains(STORES.WORDS)) {
          const wordStore = db.createObjectStore(STORES.WORDS, {
            keyPath: 'id',
            autoIncrement: true,
          })
          wordStore.createIndex('word', 'word', { unique: true })
          wordStore.createIndex('level', 'level', { unique: false })
          wordStore.createIndex('category', 'category', { unique: false })
        }

        // 创建用户进度存储
        if (!db.objectStoreNames.contains(STORES.USER_PROGRESS)) {
          db.createObjectStore(STORES.USER_PROGRESS, { keyPath: 'id' })
        }

        // 创建已掌握单词存储
        if (!db.objectStoreNames.contains(STORES.MASTERED_WORDS)) {
          const masteredStore = db.createObjectStore(STORES.MASTERED_WORDS, {
            keyPath: 'id',
            autoIncrement: true,
          })
          masteredStore.createIndex('wordId', 'wordId', { unique: true })
        }
      },
    })
  } catch (error) {
    console.error('Error initializing IndexedDB:', error)
    throw error
  }
}

// ==================== 词汇操作 ====================

// 批量导入词汇
export async function importWords(words) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.WORDS, 'readwrite')
    const store = tx.objectStore('words')

    for (const word of words) {
      await store.add(word)
    }

    await tx.done
    console.log(`✅ 成功导入 ${words.length} 个单词到 IndexedDB`)
  } catch (error) {
    console.error('Error importing words:', error)
    throw error
  }
}

// 按等级获取词汇
export async function getWordsByLevel(level) {
  try {
    const db = await initDB()
    return await db.getAllFromIndex(STORES.WORDS, 'level', level)
  } catch (error) {
    console.error(`Error getting words for level ${level}:`, error)
    return []
  }
}

// 获取所有词汇
export async function getAllWords() {
  try {
    const db = await initDB()
    return await db.getAll(STORES.WORDS)
  } catch (error) {
    console.error('Error getting all words:', error)
    return []
  }
}

// 根据ID获取单词
export async function getWordById(id) {
  try {
    const db = await initDB()
    return await db.get(STORES.WORDS, id)
  } catch (error) {
    console.error(`Error getting word ${id}:`, error)
    return null
  }
}

// 搜索单词
export async function searchWords(query) {
  try {
    const db = await initDB()
    const allWords = await db.getAll(STORES.WORDS)
    const lowerQuery = query.toLowerCase()

    return allWords.filter(
      (word) =>
        word.word.toLowerCase().includes(lowerQuery) ||
        word.meaning_cn?.toLowerCase().includes(lowerQuery) ||
        word.definition.toLowerCase().includes(lowerQuery)
    )
  } catch (error) {
    console.error('Error searching words:', error)
    return []
  }
}

// 清空词汇数据
export async function clearWords() {
  try {
    const db = await initDB()
    await db.clear(STORES.WORDS)
    console.log('✅ 词汇数据已清空')
  } catch (error) {
    console.error('Error clearing words:', error)
    throw error
  }
}

// ==================== 进度操作 ====================

// 保存用户进度
export async function saveProgressToDB(progress) {
  try {
    const db = await initDB()
    await db.put(STORES.USER_PROGRESS, { id: 'main', ...progress })
  } catch (error) {
    console.error('Error saving progress:', error)
    throw error
  }
}

// 获取用户进度
export async function getProgressFromDB() {
  try {
    const db = await initDB()
    return await db.get(STORES.USER_PROGRESS, 'main')
  } catch (error) {
    console.error('Error getting progress:', error)
    return null
  }
}

// ==================== 已掌握单词操作 ====================

// 标记单词为已掌握
export async function markWordAsMasteredDB(wordId) {
  try {
    const db = await initDB()
    const existing = await db.getFromIndex(
      STORES.MASTERED_WORDS,
      'wordId',
      wordId
    )

    if (!existing) {
      await db.add(STORES.MASTERED_WORDS, {
        wordId,
        masteredAt: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error marking word as mastered:', error)
    throw error
  }
}

// 获取所有已掌握的单词ID
export async function getMasteredWordIds() {
  try {
    const db = await initDB()
    const masteredWords = await db.getAll(STORES.MASTERED_WORDS)
    return masteredWords.map((w) => w.wordId)
  } catch (error) {
    console.error('Error getting mastered words:', error)
    return []
  }
}

// 检查单词是否已掌握
export async function isWordMastered(wordId) {
  try {
    const db = await initDB()
    const word = await db.getFromIndex(STORES.MASTERED_WORDS, 'wordId', wordId)
    return !!word
  } catch (error) {
    console.error('Error checking if word is mastered:', error)
    return false
  }
}

// ==================== 数据库统计 ====================

// 获取数据库统计信息
export async function getDBStats() {
  try {
    const db = await initDB()

    const [totalWords, masteredWords, progress] = await Promise.all([
      db.count(STORES.WORDS),
      db.count(STORES.MASTERED_WORDS),
      db.get(STORES.USER_PROGRESS, 'main'),
    ])

    return {
      totalWords,
      masteredWords,
      progress: progress || null,
    }
  } catch (error) {
    console.error('Error getting DB stats:', error)
    return {
      totalWords: 0,
      masteredWords: 0,
      progress: null,
    }
  }
}

// 检查数据库是否有数据
export async function hasVocabularyData() {
  try {
    const db = await initDB()
    const count = await db.count(STORES.WORDS)
    return count > 0
  } catch (error) {
    console.error('Error checking vocabulary data:', error)
    return false
  }
}

export default {
  initDB,
  importWords,
  getWordsByLevel,
  getAllWords,
  getWordById,
  searchWords,
  clearWords,
  saveProgressToDB,
  getProgressFromDB,
  markWordAsMasteredDB,
  getMasteredWordIds,
  isWordMastered,
  getDBStats,
  hasVocabularyData,
}
