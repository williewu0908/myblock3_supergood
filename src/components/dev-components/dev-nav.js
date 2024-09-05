import * as React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CssBaseline } from '@mui/material';
import CodeRepository from './CodeRepository';

export default function DevNavBar() {
    const [isOpen, setIsOpen] = React.useState(false); // 狀態控制Drawer是否打開
    const [repositoryData, setRepositoryData] = React.useState([]); // 用於儲存後端取得的資料

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setIsOpen(open);

        if (open) {
            fetchData();
        }
    };

    const fetchData = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/searchDB');
            if (response.ok) {
                const data = await response.json();
                setRepositoryData(data); // 更新狀態
            } else {
                console.error('Error fetching data:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    return (
        <>
            <CssBaseline />
            <AppBar position="static" sx={{ flexGrow: 1, p: 0, m: 0, backgroundColor: '#E3E1E1', color: 'black' }}>
                <Toolbar sx={{ p: 0, m: 0 }}>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            myblock3
                        </Typography>
                    </Box>
                    <Button color="inherit">首頁</Button>
                    <Button color="inherit" onClick={toggleDrawer(true)}>專案</Button>
                </Toolbar>
            </AppBar>
            <CodeRepository RepositoryOpen={isOpen} toggleDrawer={toggleDrawer} repositoryData={repositoryData} fetchData={fetchData}/>
        </>
    );
}
