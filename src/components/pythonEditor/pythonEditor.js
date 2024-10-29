import React, { useState, useEffect, useContext } from 'react';
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { CodeContext } from '../dev-components/CodeContext';

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
    const [isEditorFocused, setIsEditorFocused] = useState(false); // 用于追踪编辑器是否被聚焦
    const { setContextCode } = useContext(CodeContext);

    // 接收到 blockUpdated 事件後，從 indexedDB 取得 python 程式碼
    useEffect(() => {
        const handleBlockUpdate = async (event) => {
            if (event.detail.source === 'BlocklyComponent' && !isEditorFocused) {
                // 只有当编辑器没有被聚焦时，才从 IndexedDB 获取代码
                const updatedCode = await getPythonCodeFromIndexedDB();
                setCode(updatedCode);
                setContextCode(updatedCode);
            }
        };

        window.addEventListener('blockUpdated', handleBlockUpdate);
        return () => window.removeEventListener('blockUpdated', handleBlockUpdate);
    }, [isEditorFocused]); // 将焦点状态作为依赖

    // 在程式碼編輯區編輯 python 後，觸發 codeUpdated，把 python 程式碼儲存到 indexedDB
    const handleChange = (newCode) => {
        setCode(newCode);
        setContextCode(newCode);
        savePythonCodeToIndexedDB(newCode);
        console.log('codeUpdated:' + newCode);
        window.dispatchEvent(new CustomEvent('codeUpdated', {
            detail: {
                code: newCode,  // 使用从 IndexedDB 获取的代码
                source: 'pythonEditor'
            }
        }));
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
            onFocus={() => setIsEditorFocused(true)}  // 当编辑器获得焦点时设置状态
            onBlur={() => setIsEditorFocused(false)}  // 当编辑器失去焦点时重置状态
        />
    );
}

export default PythonEditor;
