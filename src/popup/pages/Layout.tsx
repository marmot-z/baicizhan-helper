import { Outlet, useNavigate } from 'react-router-dom';
import Logo from '../../assets/icon.png'
import './Home.css';

export default function Layout() {
  const navigate = useNavigate();

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

  return (
    <div className="app-container">
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
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}