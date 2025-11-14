import { useState, useEffect } from 'react';
import { getRandomWords } from '../data/vocabulary';
import { recordQuizResult } from '../utils/progressManager';

const Quiz = ({ level, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    // 生成5道题
    const words = getRandomWords(level, 5);
    const quizQuestions = words.map((word) => {
      // 随机选择题目类型
      const questionType = Math.random() > 0.5 ? 'meaning' : 'example';

      if (questionType === 'meaning') {
        // 选择正确的中文意思
        return {
          type: 'meaning',
          question: `"${word.word}" 的意思是？`,
          word: word.word,
          correctAnswer: word.meaning,
          options: generateMeaningOptions(word, words),
        };
      } else {
        // 根据例句选择正确的单词
        return {
          type: 'example',
          question: `以下哪个单词适合这个句子？`,
          sentence: word.example,
          translation: word.exampleTranslation,
          correctAnswer: word.word,
          options: generateWordOptions(word, words),
        };
      }
    });

    setQuestions(quizQuestions);
  }, [level]);

  const generateMeaningOptions = (correctWord, allWords) => {
    const options = [correctWord.meaning];
    const otherWords = allWords.filter((w) => w.id !== correctWord.id);

    while (options.length < 4 && otherWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherWords.length);
      const meaning = otherWords[randomIndex].meaning;

      if (!options.includes(meaning)) {
        options.push(meaning);
      }
      otherWords.splice(randomIndex, 1);
    }

    return shuffleArray(options);
  };

  const generateWordOptions = (correctWord, allWords) => {
    const options = [correctWord.word];
    const otherWords = allWords.filter((w) => w.id !== correctWord.id);

    while (options.length < 4 && otherWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherWords.length);
      const word = otherWords[randomIndex].word;

      if (!options.includes(word)) {
        options.push(word);
      }
      otherWords.splice(randomIndex, 1);
    }

    return shuffleArray(options);
  };

  const shuffleArray = (array) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleAnswerSelect = (answer) => {
    if (showResult) return; // 已经显示结果，不能再选择

    setSelectedAnswer(answer);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([...answers, { question: currentQuestion, answer, isCorrect }]);
    setShowResult(true);

    // 2秒后自动进入下一题
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // 测验完成
        const result = recordQuizResult(score + (isCorrect ? 1 : 0), questions.length);
        onComplete(result);
      }
    }, 2000);
  };

  if (questions.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div className="card-body">
        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span>
              问题 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span>得分: {score}</span>
          </div>
          <progress
            className="progress progress-primary w-full"
            value={progress}
            max="100"
          ></progress>
        </div>

        {/* 问题 */}
        <h2 className="card-title text-2xl mb-4">{currentQuestion.question}</h2>

        {currentQuestion.type === 'meaning' && (
          <div className="text-4xl font-bold text-primary text-center mb-6">
            {currentQuestion.word}
          </div>
        )}

        {currentQuestion.type === 'example' && (
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <p className="text-lg italic mb-2">"{currentQuestion.sentence}"</p>
            <p className="text-gray-600">{currentQuestion.translation}</p>
          </div>
        )}

        {/* 选项 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
            let btnClass = 'btn btn-outline btn-lg w-full h-auto min-h-[4rem]';

            if (showResult && option === currentQuestion.correctAnswer) {
              btnClass += ' btn-success';
            } else if (showResult && option === selectedAnswer && option !== currentQuestion.correctAnswer) {
              btnClass += ' btn-error';
            }

            return (
              <button
                key={index}
                className={btnClass}
                onClick={() => handleAnswerSelect(option)}
                disabled={showResult}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* 结果提示 */}
        {showResult && (
          <div className={`alert ${selectedAnswer === currentQuestion.correctAnswer ? 'alert-success' : 'alert-error'} mt-4`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              {selectedAnswer === currentQuestion.correctAnswer ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <span>
              {selectedAnswer === currentQuestion.correctAnswer
                ? '✓ 回答正确！干得好！'
                : `✗ 答错了。正确答案是: ${currentQuestion.correctAnswer}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
