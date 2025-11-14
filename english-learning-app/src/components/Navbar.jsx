import { useState, useEffect } from 'react';
import { getProgress } from '../utils/progressManager';

const Navbar = ({ currentPage, onNavigate }) => {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  return (
    <div className="navbar bg-base-200 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li><a onClick={() => onNavigate('home')}>首页</a></li>
            <li><a onClick={() => onNavigate('learn')}>学习</a></li>
            <li><a onClick={() => onNavigate('quiz')}>测验</a></li>
            <li><a onClick={() => onNavigate('progress')}>进度</a></li>
          </ul>
        </div>
        <a className="btn btn-ghost text-xl" onClick={() => onNavigate('home')}>
          🎓 English Learning
        </a>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <a
              className={currentPage === 'home' ? 'active' : ''}
              onClick={() => onNavigate('home')}
            >
              首页
            </a>
          </li>
          <li>
            <a
              className={currentPage === 'learn' ? 'active' : ''}
              onClick={() => onNavigate('learn')}
            >
              学习
            </a>
          </li>
          <li>
            <a
              className={currentPage === 'quiz' ? 'active' : ''}
              onClick={() => onNavigate('quiz')}
            >
              测验
            </a>
          </li>
          <li>
            <a
              className={currentPage === 'progress' ? 'active' : ''}
              onClick={() => onNavigate('progress')}
            >
              进度
            </a>
          </li>
        </ul>
      </div>

      <div className="navbar-end gap-2">
        {progress && (
          <>
            <div className="badge badge-primary gap-2">
              ⭐ {progress.totalPoints}
            </div>
            <div className="badge badge-secondary gap-2">
              🔥 {progress.streak}天
            </div>
            <div className="badge badge-accent gap-2">
              {progress.level}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
