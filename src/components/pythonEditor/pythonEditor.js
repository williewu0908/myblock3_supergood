import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";

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


function PythonEditor() {
    const [code, setCode] = useState("# Write your Python code here\n");

    useEffect(() => {
        const fetchCode = async () => {
            const fetchedCode = await getPythonCodeFromIndexedDB();
            setCode(fetchedCode);
        };

        fetchCode().catch(console.error);

        const handleCodeUpdate = () => {
            fetchCode().catch(console.error);
        };

        window.addEventListener('codeUpdated', handleCodeUpdate);

        return () => window.removeEventListener('codeUpdated', handleCodeUpdate);
    }, []);

    const handleChange = (newCode) => {
        setCode(newCode);
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
        />
    );
}

export default PythonEditor;
