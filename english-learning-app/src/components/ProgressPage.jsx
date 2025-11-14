import { useState, useEffect } from 'react';
import { getProgress, getAllBadges, getStats } from '../utils/progressManager';

const ProgressPage = () => {
  const [progress, setProgress] = useState(null);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    setProgress(getProgress());
    setBadges(getAllBadges());
    setStats(getStats());
  }, []);

  if (!progress || !stats) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">学习进度</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              ></path>
            </svg>
          </div>
          <div className="stat-title">总积分</div>
          <div className="stat-value text-primary">{stats.totalPoints}</div>
          <div className="stat-desc">继续加油！</div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-secondary">
            🔥
          </div>
          <div className="stat-title">连续学习</div>
          <div className="stat-value text-secondary">{stats.streak}</div>
          <div className="stat-desc">天</div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-accent">
            📚
          </div>
          <div className="stat-title">已掌握单词</div>
          <div className="stat-value text-accent">{stats.wordsLearned}</div>
          <div className="stat-desc">个</div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-info">
            🎯
          </div>
          <div className="stat-title">测验正确率</div>
          <div className="stat-value text-info">{stats.accuracy}%</div>
          <div className="stat-desc">
            {stats.quizzesTaken} 次测验
          </div>
        </div>
      </div>

      {/* 当前等级 */}
      <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title text-2xl">当前等级</h2>
          <p className="text-5xl font-bold">{stats.level}</p>
          <p className="text-lg">
            {stats.level === 'A1' && '初级 - 基础日常词汇'}
            {stats.level === 'A2' && '进阶初级 - 扩展日常词汇'}
            {stats.level === 'B1' && '中级 - 工作学习常见情况'}
            {stats.level === 'B2' && '中高级 - 流畅交流复杂话题'}
          </p>
        </div>
      </div>

      {/* 徽章系统 */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">成就徽章</h2>

        {/* 已获得的徽章 */}
        {earnedBadges.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-success">
              已获得 ({earnedBadges.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="card-body items-center text-center p-4">
                    <div className="text-5xl mb-2">{badge.icon}</div>
                    <h3 className="font-bold">{badge.name}</h3>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 未获得的徽章 */}
        {unearnedBadges.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-500">
              待解锁 ({unearnedBadges.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unearnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="card bg-base-200 shadow-md opacity-50"
                >
                  <div className="card-body items-center text-center p-4">
                    <div className="text-5xl mb-2 grayscale">{badge.icon}</div>
                    <h3 className="font-bold">{badge.name}</h3>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 学习统计图表 */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">学习统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="mb-2">
                <span className="font-semibold">总答题数:</span> {stats.totalAnswers}
              </p>
              <p className="mb-2">
                <span className="font-semibold">正确答案数:</span> {stats.correctAnswers}
              </p>
              <p className="mb-2">
                <span className="font-semibold">错误答案数:</span>{' '}
                {stats.totalAnswers - stats.correctAnswers}
              </p>
            </div>
            <div>
              <p className="mb-2">
                <span className="font-semibold">完成测验数:</span> {stats.quizzesTaken}
              </p>
              <p className="mb-2">
                <span className="font-semibold">学习单词数:</span> {stats.wordsLearned}
              </p>
              <p className="mb-2">
                <span className="font-semibold">平均准确率:</span> {stats.accuracy}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
