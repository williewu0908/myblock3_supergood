import * as React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemText, ListSubheader, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function DevNavBar() {
    const [isOpen, setIsOpen] = React.useState(false); // 狀態控制Drawer是否打開

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setIsOpen(open);
    };

    const drawerContent = (
        <Box
            sx={{ width: 250, display: 'flex', flexDirection: 'column', position:'fixed' }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
        >
            <List
                subheader={
                    <ListSubheader component="div" style={{backgroundColor:'#E3E1E1', color:'black'}}>
                        專案目錄
                    </ListSubheader>
                }
            >
                {['helloworld', '剪刀石頭布', '猜數字', '泡沫演算法'].map((text, index) => (
                    <ListItem key={text} disablePadding>
                        <ListItemButton>
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Box sx={{ mt: 'auto', p: 2 }}>
                <Fab color="primary" aria-label="add" size="small" onClick={() => console.log('Add new item')}>
                    <AddIcon />
                </Fab>
            </Box>
        </Box>
    );

    return (
        <>
            <CssBaseline />
            <AppBar position="static" sx={{ flexGrow: 1, p: 0, m: 0, backgroundColor: '#E3E1E1', color:'black' }}>
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
            <Drawer
                anchor='left'
                open={isOpen}
                onClose={toggleDrawer(false)}
                PaperProps={{
                    sx: {
                        backgroundColor: "#E3E1E1",
                        color: "black",
                    }
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
}

