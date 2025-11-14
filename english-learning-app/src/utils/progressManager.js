// 进度管理工具 - 使用 LocalStorage 保存学习进度

const STORAGE_KEY = 'english_learning_progress';

// 获取用户进度
export const getProgress = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // 默认进度
  return {
    level: 'A1', // 当前学习等级
    totalPoints: 0, // 总积分
    streak: 0, // 连续学习天数
    lastStudyDate: null, // 最后学习日期
    masteredWords: [], // 已掌握的单词ID
    badges: [], // 获得的徽章
    stats: {
      wordsLearned: 0, // 学过的单词总数
      quizzesTaken: 0, // 完成的测验数
      correctAnswers: 0, // 正确答案数
      totalAnswers: 0, // 总答题数
    },
  };
};

// 保存进度
export const saveProgress = (progress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

// 添加积分
export const addPoints = (points) => {
  const progress = getProgress();
  progress.totalPoints += points;

  // 检查是否获得新徽章
  checkBadges(progress);

  saveProgress(progress);
  return progress;
};

// 标记单词为已掌握
export const markWordAsMastered = (wordId) => {
  const progress = getProgress();
  if (!progress.masteredWords.includes(wordId)) {
    progress.masteredWords.push(wordId);
    progress.stats.wordsLearned += 1;
    addPoints(10); // 掌握一个单词获得10分
  }
  saveProgress(progress);
  return progress;
};

// 记录测验结果
export const recordQuizResult = (correct, total) => {
  const progress = getProgress();
  progress.stats.quizzesTaken += 1;
  progress.stats.correctAnswers += correct;
  progress.stats.totalAnswers += total;

  // 根据正确率给予积分
  const accuracy = correct / total;
  const points = Math.round(correct * 5 * (1 + accuracy));
  addPoints(points);

  saveProgress(progress);
  return { progress, points };
};

// 更新学习连续天数
export const updateStreak = () => {
  const progress = getProgress();
  const today = new Date().toDateString();

  if (progress.lastStudyDate === today) {
    // 今天已经学习过
    return progress;
  }

  const lastDate = progress.lastStudyDate ? new Date(progress.lastStudyDate) : null;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
    // 连续学习
    progress.streak += 1;
  } else if (!lastDate || lastDate.toDateString() !== today) {
    // 中断了，重新开始
    progress.streak = 1;
  }

  progress.lastStudyDate = today;

  // 连续学习奖励
  if (progress.streak % 7 === 0) {
    addPoints(50); // 连续7天奖励50分
  }

  saveProgress(progress);
  return progress;
};

// 升级等级
export const levelUp = (newLevel) => {
  const progress = getProgress();
  progress.level = newLevel;
  addPoints(100); // 升级奖励100分
  saveProgress(progress);
  return progress;
};

// 徽章定义
const BADGES = [
  { id: 'first_word', name: '初学者', description: '学习第一个单词', icon: '🌱', condition: (p) => p.stats.wordsLearned >= 1 },
  { id: 'word_master_10', name: '词汇新手', description: '掌握10个单词', icon: '📚', condition: (p) => p.stats.wordsLearned >= 10 },
  { id: 'word_master_50', name: '词汇达人', description: '掌握50个单词', icon: '📖', condition: (p) => p.stats.wordsLearned >= 50 },
  { id: 'word_master_100', name: '词汇大师', description: '掌握100个单词', icon: '🎓', condition: (p) => p.stats.wordsLearned >= 100 },
  { id: 'quiz_master_5', name: '练习者', description: '完成5次测验', icon: '✏️', condition: (p) => p.stats.quizzesTaken >= 5 },
  { id: 'quiz_master_20', name: '测验专家', description: '完成20次测验', icon: '📝', condition: (p) => p.stats.quizzesTaken >= 20 },
  { id: 'accuracy_80', name: '精准射手', description: '总体正确率达到80%', icon: '🎯', condition: (p) => p.stats.totalAnswers > 0 && (p.stats.correctAnswers / p.stats.totalAnswers) >= 0.8 },
  { id: 'streak_7', name: '坚持不懈', description: '连续学习7天', icon: '🔥', condition: (p) => p.streak >= 7 },
  { id: 'streak_30', name: '习惯养成', description: '连续学习30天', icon: '⭐', condition: (p) => p.streak >= 30 },
  { id: 'points_500', name: '积分达人', description: '获得500积分', icon: '💎', condition: (p) => p.totalPoints >= 500 },
  { id: 'points_1000', name: '积分大师', description: '获得1000积分', icon: '👑', condition: (p) => p.totalPoints >= 1000 },
];

// 检查并授予新徽章
export const checkBadges = (progress) => {
  const newBadges = [];

  BADGES.forEach((badge) => {
    if (!progress.badges.includes(badge.id) && badge.condition(progress)) {
      progress.badges.push(badge.id);
      newBadges.push(badge);
    }
  });

  return newBadges;
};

// 获取所有徽章（包括未获得的）
export const getAllBadges = () => {
  const progress = getProgress();
  return BADGES.map((badge) => ({
    ...badge,
    earned: progress.badges.includes(badge.id),
  }));
};

// 获取学习统计
export const getStats = () => {
  const progress = getProgress();
  const accuracy = progress.stats.totalAnswers > 0
    ? Math.round((progress.stats.correctAnswers / progress.stats.totalAnswers) * 100)
    : 0;

  return {
    ...progress.stats,
    accuracy,
    level: progress.level,
    totalPoints: progress.totalPoints,
    streak: progress.streak,
  };
};

// 重置进度（用于测试或重新开始）
export const resetProgress = () => {
  localStorage.removeItem(STORAGE_KEY);
  return getProgress();
};
