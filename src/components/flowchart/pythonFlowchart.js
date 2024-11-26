import React, { useEffect, useRef, useContext, useState } from 'react';
import { CodeContext } from '@/components/dev-components/CodeContext';

const PythonFlowchart = () => {
    const { contextCode } = useContext(CodeContext);
    const ref = useRef(null);
    const containerRef = useRef(null);
    const [lastValidDiagram, setLastValidDiagram] = useState('');
    const prevCodeRef = useRef(contextCode); // 新增：用於追踪前一個 contextCode 值

    useEffect(() => {
        // 檢查 contextCode 是否真的改變
        if (prevCodeRef.current === contextCode) {
            return; // 如果沒有改變，直接返回
        }
        prevCodeRef.current = contextCode; // 更新前一個值

        const initFlowchart = async (diagramCode) => {
            if (typeof window !== 'undefined' && ref.current) {
                ref.current.innerHTML = '';
                try {
                    const flowchart = await import('flowchart.js');
                    const diagram = flowchart.parse(diagramCode);
                    
                    diagram.drawSVG(ref.current, {
                        'line-width': 2,
                        'scale': 0.8,
                        'flowstate': {
                            'past': { 'fill': '#CCCCCC', 'font-size': 12 },
                            'current': { 'fill': '#ffffff', 'font-size': 12 },
                            'future': { 'fill': '#FFFFFF', 'font-size': 12 },
                            'invalid': { 'fill': '#FFFFFF', 'font-size': 12 },
                            'request': { 'fill': '#FFFFFF', 'font-size': 12 }
                        }
                    });

                    const svg = ref.current.querySelector('svg');
                    if (svg) {
                        svg.style.maxWidth = '100%';
                        svg.style.height = 'auto';
                    }

                    setLastValidDiagram(diagramCode);
                } catch (error) {
                    console.error('Flowchart rendering error:', error);
                    if (lastValidDiagram) {
                        const flowchart = await import('flowchart.js');
                        const diagram = flowchart.parse(lastValidDiagram);
                        diagram.drawSVG(ref.current);
                    }
                }
            }
        };

        const fetchFlowchart = async () => {
            if (!contextCode || contextCode.trim() === '') {
                if (ref.current) {
                    ref.current.innerHTML = '';
                }
                setLastValidDiagram('');
                return;
            }

            try {
                const response = await fetch('/myblock3/api/flowchart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: contextCode })
                });

                const data = await response.json();

                if (response.ok && data.success && data.diagramCode) {
                    try {
                        await initFlowchart(data.diagramCode);
                        console.log('Flowchart updated successfully');
                    } catch (renderError) {
                        console.error('Failed to render new flowchart:', renderError);
                        if (lastValidDiagram) {
                            await initFlowchart(lastValidDiagram);
                        }
                    }
                } else {
                    const errorMessage = data.error || 'Unknown error';
                    console.log('Server response error:', errorMessage);
                    
                    if (lastValidDiagram) {
                        await initFlowchart(lastValidDiagram);
                    }
                }
            } catch (error) {
                console.error('Network or parsing error:', error);
                if (lastValidDiagram) {
                    await initFlowchart(lastValidDiagram);
                }
            }
        };

        fetchFlowchart();

        // 匯出功能的事件監聽器設置
        const handleExportFlowchart = () => {
            if (ref.current) {
                const svg = ref.current.querySelector('svg');
                if (!svg) {
                    console.error("No SVG found for export");
                    return;
                }

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

                    const pngUrl = canvas.toDataURL('image/png');
                    const downloadLink = document.createElement('a');
                    downloadLink.href = pngUrl;
                    downloadLink.download = 'flowchart.png';
                    downloadLink.click();

                    URL.revokeObjectURL(url);
                };

                img.src = url;
            }
        };

        const handleExportEvent = () => {
            handleExportFlowchart();
        };

        window.addEventListener('exportFlowchart', handleExportEvent);

        return () => {
            window.removeEventListener('exportFlowchart', handleExportEvent);
        };

    }, [contextCode]); // 只依賴 contextCode

    return (
        // JSX 部分保持不變
        <div ref={containerRef} style={{ 
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{ 
                flex: '1 1 auto',
                overflow: 'auto',
                width: '100%',
                height: '100%',
                position: 'relative',
                padding: '16px',
                boxSizing: 'border-box',
                backgroundColor: '#fff'
            }}>
                <div style={{
                    position: 'relative',
                    width: 'fit-content',
                    minWidth: '100%',
                    margin: '0 auto'
                }}>
                    <div ref={ref} style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '100%'
                    }}/>
                </div>
            </div>
        </div>
    );
};

export default PythonFlowchart;
