import React, { useState, useEffect } from 'react';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import styles from './CodeExec.module.css';

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
                    resolve("");
                }
            };

            getRequest.onerror = function () {
                console.error('Error fetching code:', getRequest.error);
                reject(getRequest.error);
            };
        };
    });
};

export default function CodeExec() {
    const [isCodeAvailable, setIsCodeAvailable] = useState(false);

    useEffect(() => {
        async function checkCodeAvailability() {
            const code = await getPythonCodeFromIndexedDB();
            setIsCodeAvailable(code.trim() !== ""); // 如果有代碼，則啟用按鈕
        }
        const handleCheckCodeAvailabilityTrigger = () => {
            checkCodeAvailability();
        };

        // 監聽pythonEditor的改變
        window.addEventListener('checkCodeAvailabilityTrigger', handleCheckCodeAvailabilityTrigger);

        checkCodeAvailability();

        return () => {
            window.removeEventListener('checkCodeAvailabilityTrigger', handleCheckCodeAvailabilityTrigger);
        };
    }, []);

    return (
        <div id={styles.CodeExecContainer}>
            <div className={styles.boxtitle}>
                <h2>執行程式碼</h2>
                <IconButton
                    aria-label="play"
                    size="large"
                    sx={{ color: '#a55b6d' }}
                    disabled={!isCodeAvailable} // 按鈕根據代碼可用性禁用
                >
                    <PlayArrowIcon fontSize="inherit" />
                </IconButton>
            </div>
            <pre
                id={styles.DisplayResult}
                style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
            >
            </pre>
        </div>
    );
}
