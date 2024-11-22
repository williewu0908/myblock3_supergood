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
    const requestQueue = []; // 用於保存未發送的請求

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

    // 接收到 newCodeAdd 事件後，從 IndexedDB 取得 python 程式碼
    useEffect(() => {
        const handleBlockUpdate = async (event) => {
            // console.log('get newCodeAdd');
            if (event.detail.source === 'addCodeToIndexedDB' && !isEditorFocused) {
                // 只有當編輯器沒有被聚焦時，才從 IndexedDB 取得程式碼
                const updatedCode = await getPythonCodeFromIndexedDB();
                setCode(updatedCode);
                setContextCode(updatedCode);
                setLineCount(updatedCode.split('\n').length);  // 更新行數
            }
        };

        window.addEventListener('newCodeAdd', handleBlockUpdate);
        return () => window.removeEventListener('newCodeAdd', handleBlockUpdate);
    }, [isEditorFocused]);

    useEffect(() => {
        const handleAddCommentToLine = (event) => {
            const { lineNumber } = event.detail;
            setCode((prevCode) => {
                const lines = prevCode.split('\n');
                lines[lineNumber - 1] = `# 停用: ${lines[lineNumber - 1]}`; // 添加註解
                const updatedCode = lines.join('\n');
    
                // 更新到 IndexedDB
                savePythonCodeToIndexedDB(updatedCode);
    
                return updatedCode;
            });
        };
    
        window.addEventListener('addCommentToLine', handleAddCommentToLine);
    
        return () => {
            window.removeEventListener('addCommentToLine', handleAddCommentToLine);
        };
    }, []);

    // 檢查 isLoading 狀態，如果是isLoading=true，則從indexedDB載入
    useEffect(() => {
        const checkIsLoadingAndUpdate = async () => {
            if (localStorage.getItem('isLoading') === 'true') {
                console.log("isLoading is true, updating code from IndexedDB...");
                const updatedCode = await getPythonCodeFromIndexedDB();
                setCode(updatedCode);
                setContextCode(updatedCode);
                setLineCount(updatedCode.split('\n').length);  // 更新行數
            }
        };

        // 初次進入檢查
        checkIsLoadingAndUpdate();

        // 每次 storage 改變時檢查
        const handleStorageChange = () => {
            checkIsLoadingAndUpdate();
        };

        useEffect(() => {
            const checkIsLoadingAndUpdate = async () => {
                if (localStorage.getItem('isLoading') === 'true') {
                    console.log("isLoading is true, updating code from IndexedDB...");
                    const updatedCode = await getPythonCodeFromIndexedDB();
                    setCode(updatedCode);
                    setContextCode(updatedCode);
                    setLineCount(updatedCode.split('\n').length); // 更新行數
                }
            };
        
            // 初次進入檢查
            checkIsLoadingAndUpdate();
        
            // 自定義事件
            const handleIsLoadingChange = () => {
                checkIsLoadingAndUpdate();
            };
        
            // 添加字定義事件
            window.addEventListener('isLoadingChanged', handleIsLoadingChange);
        
            return () => {
                window.removeEventListener('isLoadingChanged', handleIsLoadingChange);
            };
        }, []);
        
    }, []);

    // 在程式碼編輯區編輯 python 後，觸發 codeUpdated，把 python 程式碼儲存到 IndexedDB
    const handleChange = (newCode) => {
        const newLineCount = newCode.split('\n').length;
    
        // 延遲執行，以確保 Enter 動作完成後再取得游標位置和行數
        setTimeout(() => {
            const cursorPosition = editorRef.current.getCursorPosition();
    
            // 如果行數增加，且游標在新行開頭，確認是 Enter 鍵新增一行
            if (newLineCount > lineCount && cursorPosition.column === 0) {
                const previousLineCode = newCode.split('\n')[cursorPosition.row - 1];
                // console.log(`第 ${cursorPosition.row} 行的程式碼:`, previousLineCode);
    
                // 加上提示詞
                const message = `${previousLineCode}\n請幫我看看這一行的意義與有沒有語法錯誤，並以一句話簡單回應。`;
    
                // 檢查請求是否在進行中，若沒有才發送新的請求
                if (!isRequestPending) {
                    sendToAI(message, cursorPosition.row);
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
    const sendToAI = async (message, cursorPositionRow) => {
        // 將當前請求加入隊列
        requestQueue.push(message);
    
        // 如果已經有請求處理中，直接返回，等待排隊處理
        if (isRequestPending) return;
    
        // 開始處理請求
        setIsRequestPending(true);
        while (requestQueue.length > 0) {
            const currentMessage = requestQueue.shift(); // 取出隊列中的第一個請求
            try {
                const currentTime = new Date().toLocaleTimeString('it-IT');
                const newChatLog = [
                    // { role: 'system', content: '請扮演一個很厲害的程式工程師，幫忙處理語法錯誤。'},
                    { role: 'user', content: currentMessage},
                ];
    
                const requestBody = {
                    chatLog: newChatLog,
                    selectedCharacter: "CodingExpert",
                    model: "Llama3-8B"
                };
    
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                });
    
                if (response.ok) {
                    const data = await response.json();
                    // console.log("AI Response:", data.airesponse);

                    // 發送 CustomEvent 給 ChatInterface
                    window.dispatchEvent(new CustomEvent('pythonEditorResponse', {
                        detail: {
                            userMessage: currentMessage,
                            aiResponse: data.airesponse,
                            time: currentTime,
                            positionRow: cursorPositionRow
                        }
                    }));
                } else {
                    console.error("Failed to fetch AI response.");
                }
            } catch (error) {
                console.error("Error:", error);
            }
        }
        // 所有請求處理完成後，將 pending 狀態設為 false
        setIsRequestPending(false);
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
