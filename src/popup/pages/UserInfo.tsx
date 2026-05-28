import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faMobileScreenButton } from '@fortawesome/free-solid-svg-icons';
import { faWeixin } from '@fortawesome/free-brands-svg-icons';
import { API } from '../../api';
import { UnauthorizedError } from '../../api/errors';
import { UserBindInfo } from '../../api/types';
import { useAuthStore } from '../../stores/useAuthStore';
import { useWordBookStorage } from '../../stores/wordBookStorage';
import './userInfo.css';
import './Home.css'

interface UserInfoProps {
  userName?: string;
  isWechatBound?: boolean;
  accountType?: string;
  expiredTime?: number;
}

const UserInfo: React.FC<UserInfoProps> = ({}) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfoProps | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await API.getUserInfo();        
        const weixinUser = userInfo.userInfo.find((u: UserBindInfo) => u.provider === 'weixin');
        const nickname = weixinUser ? weixinUser.nickname : userInfo.userInfo[0].nickname;
        const isWechatBound = !!weixinUser;
    
        setUserInfo({
          userName: nickname, 
          isWechatBound, 
          accountType: userInfo.user.vipName || '普通用户', 
          expiredTime: userInfo.user.endTime
        });
        setIsSessionExpired(false);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          setUserInfo(null);
          setIsSessionExpired(true);
          return;
        }
        console.error('获取用户信息失败:', error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    useWordBookStorage.getState().clearCache();
    navigate('/');
  };

  const handleReLogin = () => {
    useAuthStore.getState().logout();
    useWordBookStorage.getState().clearCache();
    navigate('/login', { replace: true });
  };

  return (
    <div className="user-info-container">
      <div className="user-info-content">
        {isSessionExpired ? (
          <>
            <div className="user-profile">
              <div className="user-avatar">
                <FontAwesomeIcon icon={faUser} className="avatar-icon" />
              </div>
              <div className="user-details">
                <div className="user-name-row">
                  <span className="user-name">登录已过期</span>
                </div>
              </div>
            </div>
            <div className="account-type session-expired-card">
              <span className="account-label">当前状态：</span>
              <span className="account-value session-expired-value">需要重新登录</span>
              <span className="account-label session-expired-message">为了继续搜索、收藏和同步，请重新完成登录。</span>
            </div>
            <div className="migration-notice">
              选项页面功能已迁移到<a href='http://www.baicizhan-helper.cn/page/dashboard' target='_blank'>百词斩助手网站</a>
            </div>
            <button className="relogin-button" onClick={handleReLogin}>
              去登录
            </button>
          </>
        ) : (
          <>
            {/* 用户图标和姓名 */}
            <div className="user-profile">
              <div className="user-avatar">
                <FontAwesomeIcon icon={faUser} className="avatar-icon" />
              </div>
              <div className="user-details">
                <div className="user-name-row">
                  <span className="user-name">{userInfo?.userName || 'guest'}</span>
                  <FontAwesomeIcon 
                    icon={faMobileScreenButton}  
                    className='fontawesome-icon'
                    style={{color: '#28a745'}}
                    title='已绑定手机号'
                  />
                  <FontAwesomeIcon 
                    icon={faWeixin}  
                    className={`wechat-icon ${userInfo?.isWechatBound ? 'bound' : 'unbound'}`}
                    title={userInfo?.isWechatBound ? '微信已绑定' : '微信未绑定'}
                  />
                </div>
              </div>
            </div>

            {/* 账号类型 */}
            <div className="account-type">
              <span className="account-label">当前账号类型：</span>
              <span className="account-value">{userInfo?.accountType}</span>
              {userInfo?.accountType === '普通用户' && (
                <a href="http://www.baicizhan-helper.cn/page/vip-center" target="_blank"><span className="upgrade-label">去开通会员</span></a>
              )}
              <span className="account-label">有效期至：{userInfo?.expiredTime ? new Date(userInfo.expiredTime).toISOString().split('T')[0] : '-'}</span>
            </div>
            <div className="migration-notice">
              选项页面功能已迁移到<a href='http://www.baicizhan-helper.cn/page/dashboard' target='_blank'>百词斩助手网站</a>
            </div>

            {/* 退出按钮 */}
            <button className="logout-button" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
              退出
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserInfo;
