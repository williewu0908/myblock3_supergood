import React, { useEffect, useRef, useContext } from 'react';
import { CodeContext } from '../dev-components/CodeContext';

const PythonFlowchart = () => {
    const { contextCode } = useContext(CodeContext);
    const ref = useRef(null);

    useEffect(() => {
        const initFlowchart = async (diagramCode) => {
            if (typeof window !== 'undefined' && ref.current) {
                // 清除舊的流程圖
                ref.current.innerHTML = '';
                try {
                    const flowchart = await import('flowchart.js');
                    const diagram = flowchart.parse(diagramCode);
                    diagram.drawSVG(ref.current);
                } catch (error) {
                    console.error('Failed to load the flowchart.js library', error);
                }
            }
        };

        const defaultDiagramCode = `st=>start: Start|past:>http://www.google.com[blank]
                        e=>end: End|future:>http://www.google.com
                        op1=>operation: Execute Python Code|current
                        cond=>condition: Code Correct?|invalid
                        io=>inputoutput: Catch result|request

                        st->op1->cond
                        cond(yes)->io->e
                        cond(no)->op1;`;

        initFlowchart(defaultDiagramCode);

        const fetchFlowchart = async () => {
            if (contextCode) {
                try {
                    const response = await fetch('http://127.0.0.1:5000/flowchart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ code: contextCode })
                    });

                    if (response.ok) {
                        const { diagramCode } = await response.json();
                        initFlowchart(diagramCode);
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

        // 匯出流程圖為 PNG 圖片
        const handleExportFlowchart = () => {
            if (ref.current) {
                const svg = ref.current.querySelector('svg'); // 取得流程圖的 SVG
                if (!svg) {
                    console.error("No SVG found for export");
                    return;
                }

                // 創建一個畫布，將 SVG 轉換為 PNG
                const canvas = document.createElement('canvas');
                const svgData = new XMLSerializer().serializeToString(svg);
                const img = new Image();
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);

                img.onload = () => {
                    canvas.width = svg.clientWidth;
                    canvas.height = svg.clientHeight;
                    const context = canvas.getContext('2d');
                    context.drawImage(img, 0, 0);

                    // 將畫布轉換為 PNG
                    const pngUrl = canvas.toDataURL('image/png');

                    // 創建下載連結
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = 'flowchart.png';
                    downloadLink.click();

                    URL.revokeObjectURL(url); // 釋放 URL
                };

                img.src = url;
            }
        };

        // 監聽自定義的 'exportFlowchart' 事件
        const handleExportEvent = () => {
            handleExportFlowchart();
        };

        window.addEventListener('exportFlowchart', handleExportEvent);

        return () => {
            window.removeEventListener('exportFlowchart', handleExportEvent);
        };

    }, [contextCode]);

    return (
        <div style={{ width: '100%', border: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}>
            <div ref={ref} />
        </div>
    );
};

export default PythonFlowchart;
