import React, { useEffect, useRef } from 'react';

const PythonFlowchart = ({ code }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && code && ref.current) {
            import('flowchart.js').then(flowchart => {
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
            });
        }
    }, [code]);

    return (
        <div>
            <h1>Python Code Flowchart</h1>
            <div ref={ref} />
        </div>
    );
};

export default PythonFlowchart;
