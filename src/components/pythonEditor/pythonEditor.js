import React, { useState } from 'react';
import AceEditor from 'react-ace';

// Import the necessary scripts for Ace
import "ace-builds/src-noconflict/mode-python"; // Python mode
import "ace-builds/src-noconflict/theme-monokai"; // Theme
import "ace-builds/src-noconflict/theme-github"; // GitHub theme


function PythonEditor() {
    const [code, setCode] = useState("# Write your Python code here\n");

    const handleChange = (newCode) => {
        setCode(newCode);
    };

    return (
        <AceEditor
            mode="python"
            theme="github"
            value={code}
            onChange={handleChange}
            name="UNIQUE_ID_OF_DIV"
            editorProps={{ $blockScrolling: true }}
            fontSize={14}
            showPrintMargin={true}
            showGutter={true}
            highlightActiveLine={true}
            setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
                showLineNumbers: true,
                tabSize: 4,
            }}
            style={{ width: '100%', height: '100%' }}
        />
    );
    
}

export default PythonEditor;
