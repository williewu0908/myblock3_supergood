import React, { useState } from 'react';
import { Box } from '@mui/material';
import Blockly from "../blockly/blockly";
import styles from './CodeEditor.module.css';
import PythonEditor from '../pythonEditor/pythonEditor';
import PythonFlowchart from '../flowchart/pythonFlowchart';

export default function CodeEditor() {
    const [code, setCode] = useState(`def add_numbers(num1, num2):
    result = num1 + num2
    return result

number1 = 5
number2 = 3
sum_result = add_numbers(number1, number2)
print("The sum of", number1, "and", number2, "is", sum_result)`);

    // 假設這是從 Blockly 或 PythonEditor 來的代碼更新
    const handleCodeUpdate = (newCode) => {
        setCode(newCode);
    };

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
            <Box sx={{ flex: 1, width:0, height: '100%', backgroundColor: '#F8F8F8' }}>
                <div className={styles.boxtitle}>
                    <h1>Blockly</h1>
                </div>
                <div className={styles.boxcontainer} id='blockly_container'>
                    <Blockly onUpdate={handleCodeUpdate} />
                </div>
            </Box>
            <Box sx={{ flex: 1, flexBasis:1, height: '100%', backgroundColor: '#F8F8F8' }}>
                <div className={styles.boxtitle}>
                    <h1>FlowChart</h1>
                </div>
                <div className={styles.boxcontainer}>
                    <PythonFlowchart code={code} />
                </div>
            </Box>
            <Box sx={{ flex: 1, flexBasis:1, height: '100%', backgroundColor: '#F8F8F8' }}>
                <div className={styles.boxtitle}>
                    <h1>Code</h1>
                </div>
                <div className={styles.boxcontainer}>
                    <PythonEditor code={code} onUpdate={handleCodeUpdate} />
                </div>
            </Box>
        </Box>
    );
}
