import * as React from 'react';
import { Box } from '@mui/material';

export default function ThreeEqualBoxes() {
    return (
        <Box sx={{ width: '100%', height: '500px', display: 'flex' }}>
            <Box sx={{ width: '33.333%', height: '100%', backgroundColor: '#FF5733' }} />
            <Box sx={{ width: '33.333%', height: '100%', backgroundColor: '#33C1FF' }} />
            <Box sx={{ width: '33.333%', height: '100%', backgroundColor: '#8E44AD' }}></Box>
        </Box>
    );
}

