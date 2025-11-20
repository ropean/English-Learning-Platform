#!/usr/bin/env node

/**
 * 词汇数据抓取脚本
 * 从开源 API 获取英语词汇数据并保存为 JSON 文件
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DICTIONARY_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/'
const OUTPUT_DIR = path.join(__dirname, '../src/data')

// NGSL (New General Service List) 核心词汇 - 按 CEFR 等级分类
// 这里只列出部分示例词汇，实际应该从完整的 NGSL 列表导入
const wordsByLevel = {
  A1: [
    'time', 'person', 'year', 'way', 'day', 'thing', 'man', 'world', 'life', 'hand',
    'part', 'child', 'eye', 'woman', 'place', 'work', 'week', 'case', 'point', 'government',
    'company', 'number', 'group', 'problem', 'fact', 'be', 'have', 'do', 'say', 'get',
    'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give',
    'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call',
    // 添加更多A1词汇...
  ],
  A2: [
    'area', 'book', 'business', 'case', 'community', 'country', 'door', 'end', 'family', 'food',
    'form', 'friend', 'game', 'girl', 'guy', 'head', 'health', 'history', 'home', 'hour',
    'house', 'idea', 'issue', 'job', 'kind', 'law', 'level', 'line', 'lot', 'matter',
    'member', 'mind', 'minute', 'moment', 'money', 'month', 'morning', 'mother', 'move', 'music',
    'name', 'need', 'night', 'office', 'parent', 'party', 'people', 'picture', 'place', 'plan',
    // 添加更多A2词汇...
  ],
  B1: [
    'ability', 'access', 'account', 'action', 'activity', 'address', 'advantage', 'agreement', 'air', 'amount',
    'analysis', 'animal', 'answer', 'anything', 'apartment', 'appearance', 'application', 'approach', 'argument', 'arm',
    'article', 'artist', 'aspect', 'assignment', 'assistance', 'associate', 'assumption', 'attention', 'attitude', 'audience',
    'author', 'authority', 'average', 'award', 'background', 'balance', 'ball', 'bank', 'base', 'basis',
    'battle', 'beat', 'beautiful', 'beauty', 'bed', 'beginning', 'behavior', 'belief', 'benefit', 'beyond',
    // 添加更多B1词汇...
  ],
  B2: [
    'absence', 'academic', 'acceptance', 'accident', 'accommodation', 'accompany', 'accomplish', 'accordance', 'accordingly', 'account',
    'accuracy', 'accurate', 'accuse', 'achieve', 'achievement', 'acknowledge', 'acquire', 'acquisition', 'across', 'action',
    'activate', 'active', 'activist', 'activity', 'actor', 'actual', 'actually', 'adapt', 'add', 'addition',
    'additional', 'address', 'adequate', 'adjust', 'adjustment', 'administration', 'administrative', 'administrator', 'admire', 'admission',
    'admit', 'adopt', 'adoption', 'adult', 'advance', 'advanced', 'advantage', 'adventure', 'advertise', 'advertisement',
    // 添加更多B2词汇...
  ],
}

// 延迟函数，避免API限流
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 从 Dictionary API 获取单词详细信息
async function fetchWordData(word) {
  try {
    const response = await fetch(`${DICTIONARY_API}${word}`)

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`⚠️  Word not found: ${word}`)
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    if (!data || data.length === 0) return null

    const entry = data[0]
    const firstMeaning = entry.meanings?.[0]

    if (!firstMeaning) return null

    const firstDefinition = firstMeaning.definitions?.[0]

    return {
      word: entry.word,
      pronunciation: entry.phonetics?.[0]?.text || entry.phonetic || '',
      audioUrl: entry.phonetics?.find((p) => p.audio)?.audio || '',
      partOfSpeech: firstMeaning.partOfSpeech || 'unknown',
      definition: firstDefinition?.definition || '',
      example: firstDefinition?.example || '',
      synonyms: firstMeaning.synonyms?.slice(0, 3) || [],
      antonyms: firstMeaning.antonyms?.slice(0, 3) || [],
    }
  } catch (error) {
    console.error(`❌ Error fetching ${word}:`, error.message)
    return null
  }
}

// 主函数：批量获取词汇数据
async function buildVocabularyDatabase() {
  console.log('🚀 开始抓取词汇数据...\n')

  const allVocabulary = {}
  let totalFetched = 0

  for (const [level, words] of Object.entries(wordsByLevel)) {
    console.log(`📚 正在处理 ${level} 级别（${words.length} 个单词）...`)

    const levelVocabulary = []

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      process.stdout.write(`  [${i + 1}/${words.length}] 获取 "${word}"... `)

      const data = await fetchWordData(word)

      if (data) {
        levelVocabulary.push({
          id: totalFetched + 1,
          ...data,
          level,
          category: 'general', // 可以后续手动分类
          source: 'dictionaryapi',
        })
        console.log('✓')
        totalFetched++
      } else {
        console.log('✗')
      }

      // 添加延迟避免 API 限流（每秒最多 10 个请求）
      await delay(150)
    }

    allVocabulary[level] = {
      name: getLevelName(level),
      description: getLevelDescription(level),
      color: getLevelColor(level),
      words: levelVocabulary,
    }

    console.log(`✅ ${level} 级别完成：成功获取 ${levelVocabulary.length} 个单词\n`)
  }

  // 保存数据
  const outputPath = path.join(OUTPUT_DIR, 'vocabulary-extended.json')

  // 确保目录存在
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(allVocabulary, null, 2), 'utf-8')

  console.log(`\n✅ 数据抓取完成！`)
  console.log(`📊 总计获取：${totalFetched} 个单词`)
  console.log(`💾 保存位置：${outputPath}`)
  console.log(`\n💡 提示：你可以手动编辑 JSON 文件来添加中文翻译和分类信息`)
}

// 辅助函数
function getLevelName(level) {
  const names = {
    A1: '初级 (A1)',
    A2: '进阶初级 (A2)',
    B1: '中级 (B1)',
    B2: '中高级 (B2)',
  }
  return names[level] || level
}

function getLevelDescription(level) {
  const descriptions = {
    A1: '基础日常词汇，适合刚开始学习英语的学员',
    A2: '扩展日常词汇，能进行简单交流',
    B1: '能应对工作、学习中的常见情况',
    B2: '能流畅交流复杂话题，理解专业内容',
  }
  return descriptions[level] || ''
}

function getLevelColor(level) {
  const colors = {
    A1: 'success',
    A2: 'info',
    B1: 'warning',
    B2: 'secondary',
  }
  return colors[level] || 'primary'
}

// 运行脚本
buildVocabularyDatabase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
