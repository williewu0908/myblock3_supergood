import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import styles from './CodeExec.module.css';

// 獲取 IndexedDB 中的 Python 代碼
const getPythonCodeFromIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('codeDatabase', 1);

        openRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('codeStore')) {
                db.createObjectStore('codeStore', { keyPath: 'id' });
            }
        };

        openRequest.onerror = (event) => {
            console.error('開啟資料庫錯誤:', event.target.errorCode);
            reject(event.target.errorCode);
        };

        openRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['codeStore'], 'readonly');
            const store = transaction.objectStore('codeStore');
            const getRequest = store.get('python_code');

            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    resolve(getRequest.result.code);
                } else {
                    resolve("");
                }
            };

            getRequest.onerror = () => {
                console.error('獲取代碼錯誤:', getRequest.error);
                reject(getRequest.error);
            };
        };
    });
};

export default function CodeExec() {
    const [isCodeAvailable, setIsCodeAvailable] = useState(false);
    const [output, setOutput] = useState("");

    // 載入 Skulpt 庫的函數
    const loadSkulpt = () => {
        const loadScript = (src) =>
            new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });

        return Promise.all([
            loadScript('https://cdn.jsdelivr.net/gh/skulpt/skulpt-dist/skulpt.min.js'),
            loadScript('https://cdn.jsdelivr.net/gh/skulpt/skulpt-dist/skulpt-stdlib.js')
        ]);
    };

    useEffect(() => {
        // 載入 Skulpt
        loadSkulpt().then(() => {
            console.log('Skulpt 已載入');
        }).catch((error) => {
            console.error('載入 Skulpt 失敗:', error);
        });

        async function checkCodeAvailability() {
            const code = await getPythonCodeFromIndexedDB();
            setIsCodeAvailable(code.trim() !== ""); // 檢查是否有代碼
        }

        const handleCheckCodeAvailabilityTrigger = () => {
            checkCodeAvailability();
        };

        // 監聽 pythonEditor 的改變
        window.addEventListener('checkCodeAvailabilityTrigger', handleCheckCodeAvailabilityTrigger);

        checkCodeAvailability();

        return () => {
            window.removeEventListener('checkCodeAvailabilityTrigger', handleCheckCodeAvailabilityTrigger);
        };
    }, []);

    const runPythonCode = async () => {
        const code = await getPythonCodeFromIndexedDB();
        console.log('Code to Execute: '+ code);
        setOutput(""); // 清空輸出

        // 配置 Skulpt 的輸出函數
        function outf(text) {
            setOutput((prevOutput) => prevOutput + text);
        }

        function builtinRead(file) {
            if (Sk.builtinFiles === undefined || Sk.builtinFiles.files[file] === undefined) {
                throw "File not found: '" + file + "'";
            }
            return Sk.builtinFiles.files[file];
        }

        // 確認 Skulpt 已經載入後再配置
        if (window.Sk) {
            window.Sk.configure({
                output: outf,
                read: builtinRead,
                __future__: window.Sk.python3,
            });

            try {
                const myPromise = window.Sk.misceval.asyncToPromise(() =>
                    window.Sk.importMainWithBody("<stdin>", false, code, true)
                );

                await myPromise;
                console.log("執行成功");
            } catch (err) {
                console.error("執行錯誤:", err.toString());
                setOutput(<span style={{ color: 'red' }}>{err.toString()}</span>);
            }
        }
    };

    return (
        <div id={styles.CodeExecContainer}>
            <div className={styles.boxtitle}>
                <h2>執行程式碼</h2>
                <IconButton
                    aria-label="play"
                    size="large"
                    sx={{ color: '#a55b6d' }}
                    onClick={runPythonCode}
                    disabled={!isCodeAvailable}
                >
                    <PlayArrowIcon fontSize="inherit" />
                </IconButton>
            </div>
            <pre
                id={styles.DisplayResult}
                style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            >
                {output}
            </pre>
            <div id="mycanvas"></div>
        </div>
    );
}
