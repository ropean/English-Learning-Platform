import { useState } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import LearnPage from './components/LearnPage';
import QuizPage from './components/QuizPage';
import ProgressPage from './components/ProgressPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedLevel, setSelectedLevel] = useState('A1');

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
  };

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="pb-8">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onSelectLevel={handleSelectLevel}
          />
        )}

        {currentPage === 'learn' && (
          <LearnPage level={selectedLevel} onNavigate={handleNavigate} />
        )}

        {currentPage === 'quiz' && (
          <QuizPage level={selectedLevel} onNavigate={handleNavigate} />
        )}

        {currentPage === 'progress' && <ProgressPage />}
      </main>

      {/* Footer */}
      <footer className="footer footer-center p-4 bg-base-300 text-base-content mt-8">
        <aside>
          <p>
            🎓 English Learning Platform - 让英语学习更有趣
            <br />
            © 2025 - 使用 React + Vite + DaisyUI 构建
          </p>
        </aside>
      </footer>
    </div>
  );
}

export default App;
