import React, { useEffect, useState, useRef } from 'react';

const FlowchartTest = () => {
    const [code, setCode] = useState('');
    const ref = useRef(null);
    const previousCodeRef = useRef('');

    useEffect(() => {
        let isMounted = true;

        const getCodeFromDB = async () => {
            const request = indexedDB.open('codeDatabase');

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['codeStore'], 'readonly');
                const store = transaction.objectStore('codeStore');

                const getRequest = store.get('python_code');

                getRequest.onsuccess = (event) => {
                    const result = event.target.result;
                    if (result && isMounted) {
                        const newCode = result.code;
                        if (newCode !== previousCodeRef.current) {
                            previousCodeRef.current = newCode;
                            setCode(newCode);
                        }
                    } else {
                        console.log('No data found for key "python_code".');
                    }
                };

                getRequest.onerror = (event) => {
                    console.error('Error getting data from codeStore', event);
                };
            };

            request.onerror = (event) => {
                console.error('Error opening database', event);
            };
        };

        const intervalId = setInterval(() => {
            getCodeFromDB();
        }, 1000); // 每秒檢查一次

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
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
        const defaultDiagramCode = `op2=>operation: a = 1
                op4=>operation: b = 2
                cond7=>condition: if (a < b)
                sub11=>subroutine: print('a is less than b')
                sub15=>subroutine: print('a is not less than b')

                op2->op4
                op4->cond7
                cond7(yes)->sub11
                cond7(no)->sub15`;

        initFlowchart(defaultDiagramCode); // 初始化預設流程圖

        // 當代碼改變時，發送請求到Flask後端並獲取新的流程圖程式碼
        const fetchFlowchart = async () => {
            if (code) {

                try {
                    const result = await axios.post('http://127.0.0.1:5000/test', {
                        code: pythonCode,
                    });
                    console.log(result.data.diagramCode);
                } catch (err) {
                    console.log(err.response ? err.response.data.error : 'Unknown error');
                }
                // try {
                //     const response = await fetch('http://127.0.0.1:5000/flowchart', {
                //         method: 'POST',
                //         headers: {
                //             'Content-Type': 'application/json'
                //         },
                //         body: JSON.stringify({ code })
                //     });

                //     if (response.ok) {
                //         const { diagramCode } = await response.json();
                //         initFlowchart(diagramCode); // 使用後端返回的流程圖程式碼渲染流程圖
                //     } else {
                //         console.error('Failed to fetch diagram code:', response.statusText);
                //     }
                // } catch (error) {
                //     console.error('Error fetching diagram code:', error);
                // }
            }
        };

        fetchFlowchart();
    }, [code]); // 監聽 code 的改變

    return (
        <>
            <div style={{ width: '100%', minHeight: '300px', border: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}>
                <div ref={ref} />
            </div>
            <pre>{code}</pre>
        </>
    );
};

export default FlowchartTest;
