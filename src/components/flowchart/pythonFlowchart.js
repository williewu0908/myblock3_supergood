import React, { useEffect, useRef, useContext, useState } from 'react';
import { CodeContext } from '@/components/dev-components/CodeContext';

const PythonFlowchart = () => {
    const { contextCode } = useContext(CodeContext);
    const ref = useRef(null);
    const containerRef = useRef(null);
    const [lastValidDiagram, setLastValidDiagram] = useState('');

    useEffect(() => {
        const initFlowchart = async (diagramCode) => {
            if (typeof window !== 'undefined' && ref.current) {
                ref.current.innerHTML = '';
                try {
                    const flowchart = await import('flowchart.js');
                    const diagram = flowchart.parse(diagramCode);
                    
                    // 設置 SVG 的適應性渲染
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

                    // 調整 SVG 大小以適應容器
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
            // 新增：如果 contextCode 為空，清空流程圖並直接返回
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

    }, [contextCode, lastValidDiagram]);

    return (
        <div 
            ref={containerRef}
            style={{ 
                width: '100%',
                height: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // 防止外層溢出
            }}
        >
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
                <div 
                    style={{
                        position: 'relative',
                        width: 'fit-content',
                        minWidth: '100%',
                        margin: '0 auto'
                    }}
                >
                    <div 
                        ref={ref}
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '100%'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PythonFlowchart;