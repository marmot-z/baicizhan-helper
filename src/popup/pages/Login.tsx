import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores';
import { API } from '../../api';
import './Login.css';

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSendCode = async () => {
    if (!phoneNumber.trim() || !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      setErrorMessage('请输入正确的手机号码');
      return;
    }
    
    setErrorMessage('');
    try {
      await API.sendSmsVerifyCode(phoneNumber);
      setCountdown(60);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('发送验证码失败:', error);
      setErrorMessage('发送验证码失败，请稍后重试');
    }
  };  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMessage('请输入手机号码');
      return;
    }
    if (!verificationCode.trim()) {
      setErrorMessage('请输入验证码');
      return;
    }
    
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login({ phoneNum: phoneNumber, smsVerifyCode: verificationCode });
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage('登录失败，请检查手机号和验证码');
      console.error('登录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1 className="login-title">登录</h1>
        
        <form onSubmit={handleLogin}>
            {errorMessage && (
              <div style={{
                color: '#dc3545',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '5px',
                padding: '10px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                {errorMessage}
              </div>
            )}
            <div className="form-group" style={{
              marginBottom: '1.5rem'
            }}>
              <input 
                type="text" 
                placeholder="手机号码" 
                required
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div className="form-group-inline" style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '1.5rem',
              alignItems: 'center'
            }}>
              <input 
                type="text" 
                placeholder="短信验证码" 
                required
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                style={{
                  flexGrow: 1,
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                 type="button" 
                 className="btn btn-send-code"
                 onClick={handleSendCode}
                 disabled={countdown > 0 || isLoading}
                 style={{
                   padding: '12px 15px',
                   borderRadius: '5px',
                   color: '#fff',
                   fontWeight: 'bold',
                   border: 'none',
                   cursor: (countdown > 0 || isLoading) ? 'not-allowed' : 'pointer',
                   fontSize: '0.9rem',
                   width: 'auto',
                   boxSizing: 'border-box',
                   backgroundColor: (countdown > 0 || isLoading) ? '#6c757d' : '#28a745',
                   whiteSpace: 'nowrap',
                   opacity: (countdown > 0 || isLoading) ? 0.6 : 1
                 }}
               >
                 {isLoading ? '发送中...' : countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
               </button>
            </div>
            <div className="form-group" style={{
              marginBottom: '1.5rem'
            }}>
              <button 
                type="submit" 
                className="btn btn-login"
                disabled={isLoading || !phoneNumber || !verificationCode || verificationCode.length !== 6}
                style={{
                  padding: '12px 20px',
                  borderRadius: '5px',
                  color: '#fff',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: isLoading || !phoneNumber || !verificationCode || verificationCode.length !== 6 ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: isLoading || !phoneNumber || !verificationCode || verificationCode.length !== 6 ? '#ccc' : '#007bff',
                  opacity: isLoading || !phoneNumber || !verificationCode || verificationCode.length !== 6 ? 0.6 : 1
                }}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default Login;