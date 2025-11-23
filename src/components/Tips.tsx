import React, { useState, useEffect } from 'react';
import './Tips.css';

const Tips: React.FC<{ message: string; onClose?: () => void }> = ({ message, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!visible) return null;

    return (
        <div className="bcz-helper-tips">
            {message}
        </div>
    );
};

export default Tips;