import { supabase, isSupabaseEnabled } from '../lib/supabaseClient'
import { getProgress, saveProgress } from './progressManager'
import { saveProgressToDB, getProgressFromDB } from './indexedDBManager'

/**
 * 数据同步管理器
 * 负责在本地存储（LocalStorage + IndexedDB）和云端（Supabase）之间同步数据
 */

// 同步用户进度到云端
export async function syncUserProgress(user) {
  if (!isSupabaseEnabled() || !user) {
    console.log('Supabase not enabled or no user, skipping sync')
    return null
  }

  try {
    // 1. 获取本地进度
    const localProgress = getProgress()

    // 2. 从服务器获取最新进度
    const { data: serverProgress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // 如果服务器没有数据（新用户），直接上传本地数据
    if (error && error.code === 'PGRST116') {
      await uploadProgressToServer(user.id, localProgress)
      return localProgress
    }

    if (error) {
      console.error('Error fetching server progress:', error)
      return localProgress
    }

    // 3. 合并策略：取最大值
    const mergedProgress = mergeProgress(localProgress, serverProgress)

    // 4. 更新到服务器
    await uploadProgressToServer(user.id, mergedProgress)

    // 5. 更新本地
    saveProgress(mergedProgress)
    await saveProgressToDB(mergedProgress)

    console.log('✅ Progress synced successfully')
    return mergedProgress
  } catch (error) {
    console.error('Error syncing progress:', error)
    return null
  }
}

// 合并本地和服务器进度（取最大值）
function mergeProgress(local, server) {
  return {
    totalPoints: Math.max(local.totalPoints || 0, server?.total_points || 0),
    streak: Math.max(local.streak || 0, server?.streak_days || 0),
    lastStudyDate: getLatestDate(local.lastStudyDate, server?.last_study_date),
    level: server?.current_level || local.level || 'A1',
    masteredWords: mergeArrays(local.masteredWords || [], server?.mastered_words || []),
    badges: mergeArrays(local.badges || [], server?.badges || []),
    stats: {
      wordsLearned: Math.max(
        local.stats?.wordsLearned || 0,
        server?.words_learned || 0
      ),
      quizzesTaken: Math.max(
        local.stats?.quizzesTaken || 0,
        server?.quizzes_taken || 0
      ),
      correctAnswers: Math.max(
        local.stats?.correctAnswers || 0,
        server?.correct_answers || 0
      ),
      totalAnswers: Math.max(
        local.stats?.totalAnswers || 0,
        server?.total_answers || 0
      ),
    },
  }
}

// 上传进度到服务器
async function uploadProgressToServer(userId, progress) {
  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: userId,
      total_points: progress.totalPoints || 0,
      streak_days: progress.streak || 0,
      last_study_date: progress.lastStudyDate,
      current_level: progress.level || 'A1',
      words_learned: progress.stats?.wordsLearned || 0,
      quizzes_taken: progress.stats?.quizzesTaken || 0,
      correct_answers: progress.stats?.correctAnswers || 0,
      total_answers: progress.stats?.totalAnswers || 0,
      mastered_words: progress.masteredWords || [],
      badges: progress.badges || [],
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  )

  if (error) {
    console.error('Error uploading progress:', error)
    throw error
  }
}

// 从服务器下载进度
export async function downloadProgressFromServer(user) {
  if (!isSupabaseEnabled() || !user) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error downloading progress:', error)
      return null
    }

    return {
      totalPoints: data.total_points || 0,
      streak: data.streak_days || 0,
      lastStudyDate: data.last_study_date,
      level: data.current_level || 'A1',
      masteredWords: data.mastered_words || [],
      badges: data.badges || [],
      stats: {
        wordsLearned: data.words_learned || 0,
        quizzesTaken: data.quizzes_taken || 0,
        correctAnswers: data.correct_answers || 0,
        totalAnswers: data.total_answers || 0,
      },
    }
  } catch (error) {
    console.error('Error in downloadProgressFromServer:', error)
    return null
  }
}

// 同步已掌握的单词
export async function syncMasteredWords(user, wordIds) {
  if (!isSupabaseEnabled() || !user) {
    return
  }

  try {
    // 批量插入已掌握的单词
    const records = wordIds.map((wordId) => ({
      user_id: user.id,
      word_id: wordId,
      mastered_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('user_mastered_words')
      .upsert(records, {
        onConflict: 'user_id,word_id',
        ignoreDuplicates: true,
      })

    if (error) {
      console.error('Error syncing mastered words:', error)
    }
  } catch (error) {
    console.error('Error in syncMasteredWords:', error)
  }
}

// 同步测验结果
export async function syncQuizResult(user, quizData) {
  if (!isSupabaseEnabled() || !user) {
    return
  }

  try {
    const { error } = await supabase.from('quiz_results').insert({
      user_id: user.id,
      level: quizData.level,
      total_questions: quizData.totalQuestions,
      correct_answers: quizData.correctAnswers,
      accuracy: quizData.accuracy,
      points_earned: quizData.pointsEarned,
      completed_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error syncing quiz result:', error)
    }
  } catch (error) {
    console.error('Error in syncQuizResult:', error)
  }
}

// 辅助函数：获取最新日期
function getLatestDate(date1, date2) {
  if (!date1) return date2
  if (!date2) return date1

  const d1 = new Date(date1)
  const d2 = new Date(date2)

  return d1 > d2 ? date1 : date2
}

// 辅助函数：合并数组并去重
function mergeArrays(arr1, arr2) {
  return [...new Set([...arr1, ...arr2])]
}

export default {
  syncUserProgress,
  downloadProgressFromServer,
  syncMasteredWords,
  syncQuizResult,
}
