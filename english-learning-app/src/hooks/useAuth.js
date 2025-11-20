import { useState, useEffect } from 'react'
import { supabase, isSupabaseEnabled } from '../lib/supabaseClient'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isSupabaseEnabled()) {
      setLoading(false)
      return
    }

    // 获取当前用户会话
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setError(error.message)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // 当用户登录时，同步本地数据到云端
      if (session?.user) {
        const { syncUserProgress } = await import('../utils/syncManager')
        syncUserProgress(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 使用 Google 登录
  const signInWithGoogle = async () => {
    if (!isSupabaseEnabled()) {
      setError('Supabase is not configured. Please check your environment variables.')
      return { error: 'Supabase not configured' }
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        setError(error.message)
        return { error }
      }

      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    }
  }

  // 使用邮箱密码登录
  const signInWithEmail = async (email, password) => {
    if (!isSupabaseEnabled()) {
      setError('Supabase is not configured')
      return { error: 'Supabase not configured' }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        return { error }
      }

      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    }
  }

  // 注册
  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseEnabled()) {
      setError('Supabase is not configured')
      return { error: 'Supabase not configured' }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        setError(error.message)
        return { error }
      }

      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    }
  }

  // 登出
  const signOut = async () => {
    if (!isSupabaseEnabled()) {
      return { error: 'Supabase not configured' }
    }

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error.message)
        return { error }
      }

      setUser(null)
      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err }
    }
  }

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    signOut,
    isAuthenticated: !!user,
    isSupabaseEnabled: isSupabaseEnabled(),
  }
}
