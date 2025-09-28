import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faMobileScreenButton } from '@fortawesome/free-solid-svg-icons';
import { API } from '../../api';
import { UserBindInfo } from '../../api/types';
import { useAuthStore } from '../../stores/useAuthStore';
import { useWordBookStorage } from '../../stores/wordBookStorage';
import './userInfo.css';
import './Home.css'

// 自定义微信SVG图标组件
const WeixinIcon: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <div className={className} title={title}>
    <svg
      width="24"
      height="24"
      viewBox="0 0 640 640"
      fill="currentColor"
    >
      <path d="M417.2 231.6C423.6 231.6 429.8 231.9 436 232.7C419.4 154.3 335.3 96 239.7 96C132.5 96 45 168.8 45 261.4C45 314.8 74.3 358.9 122.9 393L103.6 451.6L171.6 417.5C196 422.3 215.4 427.2 239.8 427.2C246 427.2 251.9 426.9 258.1 426.4C254.1 413.5 251.9 399.8 251.9 385.6C251.8 300.7 324.8 231.6 417.2 231.6zM312.7 178.7C327.2 178.7 336.9 188.4 336.9 203.1C336.9 217.6 327.2 227.3 312.7 227.3C297.9 227.3 283.4 217.6 283.4 203.1C283.5 188.4 298 178.7 312.7 178.7zM176.3 227.3C161.8 227.3 147 217.6 147 203.1C147 188.3 161.8 178.7 176.3 178.7C191.1 178.7 200.7 188.4 200.7 203.1C200.7 217.7 191.1 227.3 176.3 227.3zM595 383.4C595 305.5 517.1 242.1 429.6 242.1C336.9 242.1 264.2 305.5 264.2 383.4C264.2 461.3 337 524.7 429.6 524.7C448.9 524.7 468.5 519.6 488.2 514.8L541.6 544.1L526.8 495.5C566 466.1 595 427.2 595 383.4zM375.9 358.9C366.2 358.9 356.6 349.2 356.6 339.3C356.6 329.6 366.3 320 375.9 320C390.7 320 400.3 329.7 400.3 339.3C400.3 349.3 390.6 358.9 375.9 358.9zM483 358.9C473.3 358.9 463.7 349.2 463.7 339.3C463.7 329.6 473.4 320 483 320C497.5 320 507.4 329.7 507.4 339.3C507.5 349.3 497.5 358.9 483 358.9z"/>
    </svg>
  </div>
);

interface UserInfoProps {
  userName?: string;
  isWechatBound?: boolean;
  accountType?: string;
  expiredTime?: number;
}

const UserInfo: React.FC<UserInfoProps> = ({}) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfoProps | null>(null);

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
        })
      } catch (error) {
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

  return (
    <div className="user-info-container">
      <div className="user-info-content">
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
              <WeixinIcon 
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
      </div>
    </div>
  );
};

export default UserInfo;