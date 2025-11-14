import { useState } from 'react';
import Quiz from './Quiz';

const QuizPage = ({ level, onNavigate }) => {
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [result, setResult] = useState(null);

  const handleQuizComplete = (quizResult) => {
    setResult(quizResult);
    setQuizCompleted(true);
  };

  const handleRestart = () => {
    setQuizCompleted(false);
    setResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button className="btn btn-ghost" onClick={() => onNavigate('home')}>
            ← 返回
          </button>
          <h1 className="text-3xl font-bold">测验模式 - {level}</h1>
          <div className="badge badge-primary badge-lg">{level}</div>
        </div>

        {!quizCompleted ? (
          <div className="flex justify-center">
            <Quiz level={level} onComplete={handleQuizComplete} />
          </div>
        ) : (
          // 测验完成页面
          <div className="card bg-base-100 shadow-xl max-w-2xl mx-auto">
            <div className="card-body items-center text-center">
              <div className="text-8xl mb-4">
                {result.progress.stats.accuracy >= 80 ? '🎉' : result.progress.stats.accuracy >= 60 ? '👍' : '💪'}
              </div>
              <h2 className="card-title text-3xl mb-4">测验完成！</h2>

              <div className="stats stats-vertical lg:stats-horizontal shadow mb-6">
                <div className="stat">
                  <div className="stat-title">得分</div>
                  <div className="stat-value text-primary">
                    {Math.round(
                      (result.progress.stats.correctAnswers /
                        result.progress.stats.totalAnswers) *
                        100
                    )}
                    %
                  </div>
                  <div className="stat-desc">正确率</div>
                </div>

                <div className="stat">
                  <div className="stat-title">获得积分</div>
                  <div className="stat-value text-secondary">
                    +{result.points}
                  </div>
                  <div className="stat-desc">继续加油！</div>
                </div>
              </div>

              {/* 鼓励信息 */}
              <div className="alert alert-success mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  {result.progress.stats.accuracy >= 80
                    ? '太棒了！你对这些单词掌握得很好！'
                    : result.progress.stats.accuracy >= 60
                    ? '不错！继续努力，你会做得更好！'
                    : '加油！多复习几遍，相信你一定能进步！'}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="card-actions">
                <button className="btn btn-primary" onClick={handleRestart}>
                  再来一次
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => onNavigate('learn')}
                >
                  继续学习
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => onNavigate('progress')}
                >
                  查看进度
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        {!quizCompleted && (
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
              <p className="font-bold">测验说明：</p>
              <p>
                • 共有5道题目
                <br />
                • 选择答案后会立即显示结果
                <br />
                • 答对得分，正确率越高积分越多
                <br />• 完成测验后可以获得徽章
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
