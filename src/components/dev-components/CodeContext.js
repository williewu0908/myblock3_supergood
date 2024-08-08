// 這個組件會包在最外層，儲存程式碼訊息
import React, { createContext, useState } from 'react';

export const CodeContext = createContext();

export const CodeProvider = ({ children }) => {
    const [contextCode, setContextCode] = useState('');

    return (
        <CodeContext.Provider value={{ contextCode, setContextCode }}>
            {children}
        </CodeContext.Provider>
    );
};
