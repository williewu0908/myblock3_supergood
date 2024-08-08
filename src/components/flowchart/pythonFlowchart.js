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
    }, [contextCode]);

    return (
        <div style={{ width: '100%', minHeight: '300px', border: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}>
            <div ref={ref} />
        </div>
    );
};

export default PythonFlowchart;
