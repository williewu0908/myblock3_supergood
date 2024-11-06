import React, { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CssBaseline } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import styles from './CodeExec.module.css';

export default function CodeExec() {
    return (
        <div id={styles.CodeExecContainer}>
            <div className={styles.boxtitle}>
                <h2>執行程式碼</h2>
            </div>
            <IconButton aria-label="play" size="large">
                <PlayArrowIcon fontSize="inherit" />
            </IconButton>
            <pre
                id={styles.DisplayResult}
                dangerouslySetInnerHTML={{ __html: content.content }}
                style={{ width: '100%', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            </pre>
        </div>
    )
}