import React, { useEffect, useRef } from 'react';

const PythonFlowchart = ({ code }) => {
    const ref = useRef(null);

    useEffect(() => {
        // Cleanup function to handle unmounting
        let isActive = true;

        const loadFlowchart = async () => {
            if (typeof window !== 'undefined' && code && ref.current) {
                try {
                    const flowchart = await import('flowchart.js');
                    const diagramCode = `
                        st=>start: Start|past:>http://www.google.com[blank]
                        e=>end: End|future:>http://www.google.com
                        op1=>operation: Execute Python Code|current
                        cond=>condition: Code Correct?|invalid
                        io=>inputoutput: Catch result|request

                        st->op1->cond
                        cond(yes)->io->e
                        cond(no)->op1`;

                    const diagram = flowchart.parse(diagramCode);
                    diagram.drawSVG(ref.current);
                } catch (error) {
                    console.error('Failed to load the flowchart.js library', error);
                }
            }
        };

        loadFlowchart();

        return () => {
            isActive = false;
            if (ref.current) {
                ref.current.innerHTML = ''; // Clean up the SVG to prevent duplicate diagrams
            }
        };
    }, [code]);

    return (
        <div style={{ width: '100%', minHeight: '300px', border: '1px solid #ccc', display:'flex', justifyContent:'center'}}>
            <div ref={ref} />
        </div>
    );
};

export default PythonFlowchart;
