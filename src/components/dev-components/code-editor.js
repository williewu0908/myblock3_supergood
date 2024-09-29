import React, { useState } from 'react';
import { Box } from '@mui/material';
import Blockly from "../blockly/blockly";
import PythonEditor from '../pythonEditor/pythonEditor';
import PythonFlowchart from '../flowchart/pythonFlowchart';
import { CodeProvider } from './CodeContext';
import styles from './CodeEditor.module.css';

export default function CodeEditor({ viewState }) {
  const [code, setCode] = useState(`def add_numbers(num1, num2):
    result = num1 + num2
    return result

number1 = 5
number2 = 3
sum_result = add_numbers(number1, number2)
print("The sum of", number1, "and", number2, "is", sum_result)`);

  const handleCodeUpdate = (newCode) => {
    setCode(newCode);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
      <CodeProvider>
        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.Blockly ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>Blockly</h2>
          </div>
          <div className={styles.boxcontainer} id='blockly_container'>
            <Blockly onUpdate={handleCodeUpdate} />
          </div>
        </Box>

        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.FlowChart ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>流程圖</h2>
          </div>
          <div className={styles.boxcontainer}>
            <PythonFlowchart code={code} />
          </div>
        </Box>

        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.Code ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>程式碼</h2>
          </div>
          <div className={styles.boxcontainer}>
            <PythonEditor code={code} onUpdate={handleCodeUpdate} />
          </div>
        </Box>
      </CodeProvider>
    </Box>
  );
}
