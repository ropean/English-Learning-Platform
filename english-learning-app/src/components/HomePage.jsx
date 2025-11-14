import { vocabularyData } from '../data/vocabulary';

const HomePage = ({ onNavigate, onSelectLevel }) => {
  const handleStartLearning = (level) => {
    onSelectLevel(level);
    onNavigate('learn');
  };

  const handleStartQuiz = (level) => {
    onSelectLevel(level);
    onNavigate('quiz');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="hero min-h-[400px] bg-base-200 rounded-lg mb-8">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold mb-4">
              🎓 欢迎来到英语学习平台
            </h1>
            <p className="py-6 text-lg">
              由浅入深，轻松有趣地学习英语！
              <br />
              通过互动卡片、趣味测验和游戏化系统，让学习更高效！
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => handleStartLearning('A1')}
            >
              开始学习
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="text-5xl mb-4">🎴</div>
            <h2 className="card-title">互动学习卡片</h2>
            <p>翻转卡片学习单词，支持发音功能，记忆更深刻</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h2 className="card-title">趣味测验</h2>
            <p>多样化的题型，即时反馈，让学习充满乐趣</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <div className="text-5xl mb-4">🏆</div>
            <h2 className="card-title">成就系统</h2>
            <p>积分、徽章、连续学习天数，让进步看得见</p>
          </div>
        </div>
      </div>

      {/* Level Selection */}
      <div>
        <h2 className="text-3xl font-bold mb-6 text-center">选择学习等级</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(vocabularyData).map(([levelKey, levelData]) => (
            <div
              key={levelKey}
              className={`card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow border-2 border-${levelData.color}`}
            >
              <div className="card-body">
                <h2 className="card-title">
                  <span className={`badge badge-${levelData.color} badge-lg`}>
                    {levelKey}
                  </span>
                </h2>
                <h3 className="text-xl font-bold">{levelData.name}</h3>
                <p className="text-sm text-gray-600">{levelData.description}</p>
                <p className="text-sm mt-2">
                  <span className="font-semibold">单词数:</span>{' '}
                  {levelData.words.length}
                </p>

                <div className="card-actions justify-end mt-4">
                  <button
                    className={`btn btn-${levelData.color} btn-sm`}
                    onClick={() => handleStartLearning(levelKey)}
                  >
                    学习
                  </button>
                  <button
                    className={`btn btn-outline btn-${levelData.color} btn-sm`}
                    onClick={() => handleStartQuiz(levelKey)}
                  >
                    测验
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-12 alert alert-info">
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
        <div>
          <h3 className="font-bold">学习小贴士</h3>
          <div className="text-sm">
            <p>
              • 每天坚持学习，哪怕只有10分钟，积少成多
              <br />
              • 点击卡片上的 🔊 按钮可以听发音
              <br />
              • 完成测验可以获得更多积分和徽章
              <br />• 从简单的A1开始，循序渐进效果最好
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
