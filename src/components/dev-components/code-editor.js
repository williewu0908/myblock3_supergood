import * as React from 'react';
import { Box } from '@mui/material';
import Blockly from "../blockly/blockly";
import styles from './CodeEditor.module.css';
import PythonEditor from '../pythonEditor/pythonEditor';


export default function CodeEditor() {
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex' }}>
            <Box sx={{ width: '33.333%', height: '100%', backgroundColor: '#F8F8F8' }}>
                <div className={styles.boxtitle}>
                    <h1>Blockly</h1>
                </div >
                <div className={styles.boxcontainer} id='blockly_container'>
                    <Blockly />
                </div>
            </Box>
            <Box sx={{ width: '33.333%', height: '100%', backgroundColor: '#F8F8F8' }}>
                <div className={styles.boxtitle}>
                    <h1>FlowChart</h1>
                </div >
                <div className={styles.boxcontainer} >

                </div>
            </Box>
            <Box sx={{ width: '33.333%', height: '100%', backgroundColor: '#F8F8F8' }}>
                <div className={styles.boxtitle}>
                    <h1>Code</h1>
                </div >
                <div className={styles.boxcontainer}>
                    <PythonEditor />
                </div>
            </Box>
        </Box>
    );
}

