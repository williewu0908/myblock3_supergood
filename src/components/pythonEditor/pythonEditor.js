import React, { useState, useEffect, useContext, useRef } from 'react';
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { CodeContext } from '@/components/dev-components/CodeContext';

// 獲取 Python 程式碼從 IndexedDB
const getPythonCodeFromIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('codeDatabase', 1);

        openRequest.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('codeStore')) {
                db.createObjectStore('codeStore', { keyPath: 'id' });
            }
        };

        openRequest.onerror = function (event) {
            console.error('Error opening database:', event.target.errorCode);
            reject(event.target.errorCode);
        };

        openRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['codeStore'], 'readonly');
            const store = transaction.objectStore('codeStore');
            const getRequest = store.get('python_code');

            getRequest.onsuccess = function () {
                if (getRequest.result) {
                    resolve(getRequest.result.code);
                } else {
                    resolve("# Write your Python code here\n");
                }
            };

            getRequest.onerror = function () {
                console.error('Error fetching code:', getRequest.error);
                reject(getRequest.error);
            };
        };
    });
};

// 儲存 Python 程式碼到 IndexedDB
const savePythonCodeToIndexedDB = async (newCode) => {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('codeDatabase', 1);

        openRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['codeStore'], 'readwrite');
            const store = transaction.objectStore('codeStore');
            const putRequest = store.put({ id: 'python_code', code: newCode });

            putRequest.onsuccess = function () {
                resolve();
            };

            putRequest.onerror = function (event) {
                console.error('Error saving code:', event.target.errorCode);
                reject(event.target.errorCode);
            };
        };

        openRequest.onerror = function (event) {
            console.error('Error opening database:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
};

function PythonEditor() {
    const [code, setCode] = useState("# Write your Python code here\n");
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [lineCount, setLineCount] = useState(1); // 用於追蹤行數
    const { setContextCode } = useContext(CodeContext);
    const editorRef = useRef(null);
    const [isRequestPending, setIsRequestPending] = useState(false); // 用來追蹤請求是否處理中

    // 接收到 blockUpdated 事件後，從 IndexedDB 取得 python 程式碼
    useEffect(() => {
        const handleBlockUpdate = async (event) => {
            console.log('get blockUpdated');
            if (event.detail.source === 'BlocklyComponent' && !isEditorFocused) {
                // 只有當編輯器沒有被聚焦時，才從 IndexedDB 取得程式碼
                const updatedCode = await getPythonCodeFromIndexedDB();
                setCode(updatedCode);
                setContextCode(updatedCode);
                setLineCount(updatedCode.split('\n').length);  // 更新行數
            }
        };

        window.addEventListener('blockUpdated', handleBlockUpdate);
        return () => window.removeEventListener('blockUpdated', handleBlockUpdate);
    }, [isEditorFocused]);

    // 在程式碼編輯區編輯 python 後，觸發 codeUpdated，把 python 程式碼儲存到 IndexedDB
    const handleChange = (newCode) => {
        const newLineCount = newCode.split('\n').length;
    
        // 延遲執行，以確保 Enter 動作完成後再取得游標位置和行數
        setTimeout(() => {
            const cursorPosition = editorRef.current.getCursorPosition();
    
            // 如果行數增加，且游標在新行開頭，確認是 Enter 鍵新增一行
            if (newLineCount > lineCount && cursorPosition.column === 0) {
                const previousLineCode = newCode.split('\n')[cursorPosition.row - 1];
                console.log(`第 ${cursorPosition.row} 行的程式碼:`, previousLineCode);
    
                // 加上提示詞
                const message = `這是我剛剛寫的程式碼：${previousLineCode}。請幫我看看有沒有語法錯誤。`;
    
                // 檢查請求是否在進行中，若沒有才發送新的請求
                if (!isRequestPending) {
                    sendToAI(message);
                }
            }
    
            // 更新行數
            setLineCount(newLineCount);
        }, 0); // 使用 setTimeout 延遲執行
    
        // 更新程式碼
        setCode(newCode);
        setContextCode(newCode);
        savePythonCodeToIndexedDB(newCode);
        // 觸發CodeExec對indexedDB是否為空的檢查
        window.dispatchEvent(new CustomEvent('checkCodeAvailabilityTrigger'));
        console.log('codeUpdated:' + newCode);
        window.dispatchEvent(new CustomEvent('codeUpdated', {
            detail: {
                code: newCode,
                source: 'pythonEditor'
            }
        }));
    };

    // 設定 onLoad 事件來初始化 editor 的游標變更事件監聽
    const handleEditorLoad = (editor) => {
        editorRef.current = editor;
    };

    // 定義 sendToAI 函數，將訊息傳送給後端 API
    const sendToAI = async (message) => {
        setIsRequestPending(true);
    
        // 構建請求體，包括完整的 chatLog、selectedCharacter 和 model
        const currentTime = new Date().toLocaleTimeString('it-IT');
        const newChatLog = [
            { role: 'user', content: '你可以作為一個很厲害的程式工程師，幫我看看我的這一行程式有沒有語法錯誤嗎？', time: currentTime },
            { role: 'assistant', content: '當然，請提供你的程式碼給我。' },
            { role: 'user', content: message, time: currentTime },
        ];
    
        const requestBody = {
            chatLog: newChatLog,
            selectedCharacter: "CodingExpert",
            model: "Llama3-8B"
        };
    
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
    
            if (response.ok) {
                const data = await response.json();
                console.log("AI Response:", data.airesponse);
                setAiResponse(data.airesponse); // 將回應保存並顯示
                setChatLog([
                    ...newChatLog.slice(0, -1), // 移除 "loading"
                    { role: 'assistant', content: data.airesponse }
                ]); // 更新 chatLog 並顯示回應
            } else {
                console.error("Failed to fetch AI response.");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setIsRequestPending(false);
        }
    };

    return (
        <AceEditor
            mode="python"
            theme="github"
            value={code}
            onChange={handleChange}
            name="UNIQUE_ID_OF_DIV"
            editorProps={{ $blockScrolling: true }}
            fontSize={14}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 4,
            }}
            style={{ width: '100%', height: '100%' }}
            onFocus={() => setIsEditorFocused(true)}
            onBlur={() => setIsEditorFocused(false)}
            onLoad={handleEditorLoad}  // 設定 onLoad 事件
        />
    );
}

export default PythonEditor;
