import { useState, useEffect } from 'react';
import { getWordsByLevel } from '../data/vocabulary';
import { markWordAsMastered, updateStreak } from '../utils/progressManager';
import FlashCard from './FlashCard';

const LearnPage = ({ level, onNavigate }) => {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const levelWords = getWordsByLevel(level);
    setWords(levelWords);
    setCurrentIndex(0);

    // 更新学习连续天数
    updateStreak();
  }, [level]);

  const handleMastered = (wordId) => {
    markWordAsMastered(wordId);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2000);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 完成当前等级的学习
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (words.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">暂无该等级的词汇</h2>
        <button className="btn btn-primary" onClick={() => onNavigate('home')}>
          返回首页
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            className="btn btn-ghost"
            onClick={() => onNavigate('home')}
          >
            ← 返回
          </button>
          <h1 className="text-3xl font-bold">学习模式 - {level}</h1>
          <div className="badge badge-primary badge-lg">
            {currentIndex + 1} / {words.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <progress
            className="progress progress-primary w-full"
            value={progress}
            max="100"
          ></progress>
        </div>

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="toast toast-top toast-center">
            <div className="alert alert-success">
              <span className="text-lg">🎉 太棒了！+10 积分</span>
            </div>
          </div>
        )}

        {/* Flash Card */}
        <div className="flex justify-center mb-6">
          <FlashCard
            word={currentWord}
            onMastered={handleMastered}
            onNext={handleNext}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <button
            className="btn btn-outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← 上一个
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              还有 {words.length - currentIndex - 1} 个单词
            </p>
          </div>

          <button
            className="btn btn-outline"
            onClick={handleNext}
            disabled={currentIndex === words.length - 1}
          >
            下一个 →
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 alert alert-info max-w-2xl mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div className="text-sm">
            <p className="font-bold">学习技巧：</p>
            <p>
              • 点击卡片可以翻转查看释义
              <br />
              • 点击 🔊 按钮听发音
              <br />
              • 认识的单词点"认识"可获得积分
              <br />• 不认识的单词多看几遍例句加深记忆
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;
