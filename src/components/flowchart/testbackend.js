import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const TestBackend = () => {
    const [pythonCode, setPythonCode] = useState('');
    const [response, setResponse] = useState('');
    const [error, setError] = useState('');
    const flowchartRef = useRef(null);

    const handleSubmit = async () => {
        try {
            const result = await axios.post('http://127.0.0.1:5000/flowchart', {
                code: pythonCode,
            });
            setResponse(result.data.diagramCode);
            console.log(result.data.diagramCode);
            setError('');
        } catch (err) {
            setResponse('');
            setError(err.response ? err.response.data.error : 'Unknown error');
        }
    };

    useEffect(() => {
        const renderFlowchart = async () => {
            if (response && flowchartRef.current) {
                try {
                    const { default: flowchart } = await import('flowchart.js');
                    const diagram = flowchart.parse(response);
                    diagram.drawSVG(flowchartRef.current);
                } catch (error) {
                    console.error('Failed to load the flowchart.js library', error);
                }
            }
        };

        renderFlowchart();
    }, [response]);

    return (
        <div>
            <textarea
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                placeholder="Enter your Python code here"
                rows="10"
                cols="50"
            />
            <br />
            <button onClick={handleSubmit}>Send Code</button>
            <div>
                {response && <p>Response: {response}</p>}
                {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            </div>
            <div style={{ width: '100%', minHeight: '300px', border: '1px solid #ccc', display: 'flex', justifyContent: 'center' }}>
                <div ref={flowchartRef} />
            </div>
        </div>
    );
};

export default TestBackend;
