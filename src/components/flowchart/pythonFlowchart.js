import React, { useEffect, useState, useRef } from 'react';

// 異步函數從IndexedDB獲取Python代碼
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

const PythonFlowchart = () => {
    const [code, setCode] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        // 從IndexedDB獲取代碼並設置到狀態中
        const fetchCode = async () => {
            const fetchedCode = await getPythonCodeFromIndexedDB();
            setCode(fetchedCode);
        };

        fetchCode().catch(console.error);
    }, []);

    useEffect(() => {
        // 初始化流程圖函數
        const initFlowchart = async (diagramCode) => {
            if (typeof window !== 'undefined' && ref.current) {
                try {
                    const flowchart = await import('flowchart.js');
                    const diagram = flowchart.parse(diagramCode);
                    diagram.drawSVG(ref.current);
                } catch (error) {
                    console.error('Failed to load the flowchart.js library', error);
                }
            }
        };

        // 預設流程圖程式碼
        const defaultDiagramCode = `st=>start: Start|past:>http://www.google.com[blank]
                        e=>end: End|future:>http://www.google.com
                        op1=>operation: Execute Python Code|current
                        cond=>condition: Code Correct?|invalid
                        io=>inputoutput: Catch result|request

                        st->op1->cond
                        cond(yes)->io->e
                        cond(no)->op1;`;

        initFlowchart(defaultDiagramCode); // 初始化預設流程圖

        // 當代碼改變時，發送請求到Flask後端並獲取新的流程圖程式碼
        const fetchFlowchart = async () => {
            if (code) {
                try {
                    const response = await fetch('http://127.0.0.1:5000/flowchart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ code })
                    });

                    if (response.ok) {
                        const { diagramCode } = await response.json();
                        initFlowchart(diagramCode); // 使用後端返回的流程圖程式碼渲染流程圖
                        console.log('diagramcode', diagramCode);
                    } else {
                        console.error('Failed to fetch diagram code:', response.statusText);
                    }
                } catch (error) {
                    console.error('Error fetching diagram code:', error);
                }
            }
        };

        fetchFlowchart();
    }, [code]); // 監聽 code 的改變

    return (
        <div style={{ width: '100%', minHeight: '300px', border: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}>
            <div ref={ref} />
        </div>
    );
};

export default PythonFlowchart;
