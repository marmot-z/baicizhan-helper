import { UnauthorizedError, ForbiddenError } from '../api/errors'
import './PopoverContent.css'

const ErrorPopover: React.FC<{ error: Error | null }> = ({ error }) => {
  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }

  return (
    <div className="bcz-helper-error-popover">
      {error instanceof UnauthorizedError && (
        <p>未登录，去<a onClick={handleLoginClick} className="bcz-helper-login-link">登录</a></p>
      )}
      {error instanceof ForbiddenError && <p>权限不足，请<a href="http://www.baicizhan-helper.cn/page/vip-center" target="_blank">开通会员</a></p>}
      {error instanceof Error && <p>{error.message}</p>}
    </div>
  )
}

export default ErrorPopover