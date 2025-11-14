import { useState } from 'react';

const FlashCard = ({ word, onMastered, onNext }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // 稍微慢一点，便于学习
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleKnow = () => {
    onMastered(word.id);
    setIsFlipped(false);
    setShowAnswer(false);
    onNext();
  };

  const handleDontKnow = () => {
    setShowAnswer(true);
  };

  const handleNextWord = () => {
    setIsFlipped(false);
    setShowAnswer(false);
    onNext();
  };

  return (
    <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div className="card-body">
        {/* 卡片内容 */}
        <div
          className={`min-h-[300px] cursor-pointer transition-all duration-500 ${
            isFlipped ? 'transform rotateY-180' : ''
          }`}
          onClick={handleFlip}
        >
          {!isFlipped ? (
            // 正面 - 单词
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl font-bold text-primary mb-4">
                {word.word}
              </div>
              <div className="text-2xl text-gray-500 mb-2">
                {word.pronunciation}
              </div>
              <div className="badge badge-outline badge-lg">
                {word.partOfSpeech}
              </div>
              <button
                className="btn btn-circle btn-primary mt-6"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpeak();
                }}
              >
                🔊
              </button>
              <p className="text-sm text-gray-400 mt-4">点击翻转查看释义</p>
            </div>
          ) : (
            // 背面 - 释义和例句
            <div className="flex flex-col h-full">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-secondary mb-2">
                  {word.meaning}
                </div>
                <div className="text-lg text-gray-600">{word.definition}</div>
              </div>

              <div className="divider">例句</div>

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="text-lg mb-2 italic">"{word.example}"</p>
                <p className="text-gray-600">{word.exampleTranslation}</p>
              </div>

              <div className="badge badge-accent badge-lg mt-4 mx-auto">
                {word.category}
              </div>

              <p className="text-sm text-gray-400 mt-4 text-center">
                点击翻转回去
              </p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="card-actions justify-between mt-6">
          {!showAnswer ? (
            <>
              <button className="btn btn-success flex-1" onClick={handleKnow}>
                ✓ 认识
              </button>
              <button className="btn btn-error flex-1" onClick={handleDontKnow}>
                ✗ 不认识
              </button>
            </>
          ) : (
            <button className="btn btn-primary w-full" onClick={handleNextWord}>
              下一个 →
            </button>
          )}
        </div>

        {/* 提示信息 */}
        {showAnswer && (
          <div className="alert alert-info mt-4">
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
            <span>
              没关系！多看几遍，翻转卡片记住这个单词的用法吧！
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashCard;
