import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { IconButton } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import styles from "@/components/dev-components/CodeExec.module.css";

const CodeExec = forwardRef((props, ref) => {
    const [isCodeAvailable, setIsCodeAvailable] = useState(false);
    const [output, setOutput] = useState("");
    const [error, setError] = useState(""); // 新增 error 状态来保存错误信息
    const [pyodide, setPyodide] = useState(null);

    // 初始化 Pyodide
    useEffect(() => {
        const loadPyodide = async () => {
            try {
                const pyodideModule = await fetch(
                    "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
                )
                    .then((res) => res.text())
                    .then((scriptContent) => {
                        const script = document.createElement("script");
                        script.type = "text/javascript";
                        script.textContent = scriptContent;
                        document.body.appendChild(script);
                        return window.loadPyodide;
                    });

                const pyodideInstance = await pyodideModule({
                    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
                });

                setPyodide(pyodideInstance);
                console.log("Pyodide 已成功加載");

                // 設置 stdout 捕獲
                pyodideInstance.setStdout({
                    batched: (msg) => {
                        setOutput((prevOutput) => prevOutput + msg + "\n");
                    },
                });

            } catch (error) {
                console.error("加載 Pyodide 失敗:", error);
                setError(`加載 Pyodide 失敗: ${error.message}`); // 设置错误信息
            }
        };

        loadPyodide();
    }, []);


    // 從 IndexedDB 獲取 Python 代碼
    const getPythonCodeFromIndexedDB = async () => {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open("codeDatabase", 1);

            openRequest.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("codeStore")) {
                    db.createObjectStore("codeStore", { keyPath: "id" });
                }
            };

            openRequest.onerror = (event) => {
                console.error("開啟資料庫錯誤:", event.target.errorCode);
                reject(event.target.errorCode);
            };

            openRequest.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(["codeStore"], "readonly");
                const store = transaction.objectStore("codeStore");
                const getRequest = store.get("python_code");

                getRequest.onsuccess = () => {
                    if (getRequest.result) {
                        resolve(getRequest.result.code);
                    } else {
                        resolve("");
                    }
                };

                getRequest.onerror = () => {
                    console.error("獲取代碼錯誤:", getRequest.error);
                    reject(getRequest.error);
                };
            };
        });
    };

    // 檢查是否有代碼
    const checkCodeAvailability = async () => {
        const code = await getPythonCodeFromIndexedDB();
        setIsCodeAvailable(code.trim() !== "");
    };

    // 初始化代碼可用性檢查
    useEffect(() => {
        const handleCheckCodeAvailabilityTrigger = () => {
            checkCodeAvailability();
        };

        window.addEventListener(
            "checkCodeAvailabilityTrigger",
            handleCheckCodeAvailabilityTrigger
        );

        checkCodeAvailability();

        return () => {
            window.removeEventListener(
                "checkCodeAvailabilityTrigger",
                handleCheckCodeAvailabilityTrigger
            );
        };
    }, []);

    // 執行 Python 代碼
    const runPythonCode = async () => {
        const code = await getPythonCodeFromIndexedDB();
        console.log("執行的代碼:", code);
        setOutput(""); // 清空輸出
        setError(""); // 清空錯誤

        if (!pyodide) {
            setError("Pyodide 尚未加載完成，請稍後再試。");
            return;
        }

        try {
            await pyodide.runPythonAsync(code);
        } catch (error) {
            setError(`錯誤: ${error.message || "未知錯誤"}`); // 捕获并显示错误
        }
    };

    // 暴露方法給父組件
    useImperativeHandle(ref, () => ({
        getPythonCodeFromIndexedDB,
        runPythonCode,
    }));

    return (
        <div id={styles.CodeExecContainer}>
            <div className={styles.boxtitle}>
                <h2>執行結果</h2>
                <IconButton
                    aria-label="play"
                    size="large"
                    sx={{ color: "#a55b6d" }}
                    onClick={runPythonCode}
                    disabled={!isCodeAvailable}
                >
                    <PlayArrowIcon fontSize="inherit" />
                </IconButton>
            </div>
            <pre
                id={styles.DisplayResult}
                style={{
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    color: error ? "red" : "inherit", // 如果有錯誤，顯示為紅色
                }}
            >
                {error || output} {/* 如果有錯誤信息則顯示錯誤，否則顯示正常輸出 */}
            </pre>
        </div>
    );
});

export default CodeExec;
