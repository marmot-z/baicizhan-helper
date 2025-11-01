import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Logo from '../../assets/icon.png'
import './Home.css';
import { settingsStore } from '../../stores/settingsStore';

export default function Layout() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(settingsStore.getState().theme);
  
  // 同步暗色主题到body元素
  useEffect(() => {
    const updateTheme = () => {
      setTheme(settingsStore.getState().theme);
      if (settingsStore.getState().theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    };
    
    updateTheme();
    
    // 监听主题变化
    const unsubscribe = settingsStore.subscribe((state) => {
      if (state.theme !== theme) {
        updateTheme();
      }
    });
    
    return () => {
      document.body.classList.remove('dark-theme');
      unsubscribe();
    };
  }, [theme]);

  const handleWebSiteClick = () => {
    window.open('http://www.baicizhan-helper.cn', '_blank');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleUserInfoClick = () => {
    navigate('/user-info');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleFeedbackClick = () => {
    window.open('http://www.baicizhan-helper.cn/comments', '_blank');    
  };

  return (
    <div className={`app-container ${theme === 'dark' ? 'dark-theme' : ''}`}>
      {/* 顶部导航栏 */}
      <div className="top-navbar">
        <div className="logo">
          <img src={Logo} alt="Logo" className="logo-image" onClick={handleWebSiteClick} />
        </div>
        <div className="nav-items">
          <div className="nav-item" onClick={handleHomeClick} title="首页">
            <span className="nav-text">主页</span>
          </div>
          <div className="nav-item" onClick={handleUserInfoClick} title="个人信息">
            <span className="nav-text">我的</span>
          </div>
          <div className="nav-item" onClick={handleSettingsClick} title="设置">
            <span className="nav-text">设置</span>
          </div>
          <div className="nav-item" onClick={handleFeedbackClick} title="反馈">
            <span className="nav-text">反馈</span>
          </div>          
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}