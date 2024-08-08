import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemText from '@mui/material/ListItemText';
import { styled, alpha } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/material/Button';
import AddBoxIcon from '@mui/icons-material/AddBox';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

function NewCodeDialog({ open, handleClose }) {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            sx={{ zIndex: 9999 }}
            maxWidth="xs"  // 可以設定 maxWidth 为 'xs', 'sm', 'md', 'lg', 'xl' 或 false 以禁用最大寬度
            fullWidth  // 使 Dialog 占滿其容器的寬度
            PaperProps={{
                sx: {
                    padding: 1,  // 設定 Dialog 的padding
                }
            }}
        >
            <DialogTitle>新專案</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    專案名稱請不要超過255個字
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="專案名稱"
                    type="email"
                    fullWidth
                    variant="standard"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                <Button onClick={handleClose}>儲存</Button>
            </DialogActions>
        </Dialog>
    );
}

export default function CodeRepository({ RepositoryOpen, toggleDrawer, repositoryData }) {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const Search = styled('div')(({ theme }) => ({
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.grey.A700, 0.15),
        '&:hover': {
            backgroundColor: alpha(theme.palette.grey.A400, 0.25),
        },
        marginRight: theme.spacing(1),
        marginLeft: 0,
        marginTop: theme.spacing(1),
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(1),
            width: 'auto',
        },
    }));

    const SearchIconWrapper = styled('div')(({ theme }) => ({
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }));

    const StyledInputBase = styled(InputBase)(({ theme }) => ({
        color: 'inherit',
        '& .MuiInputBase-input': {
            padding: theme.spacing(1, 1, 1, 0),
            // vertical padding + font size from searchIcon
            paddingLeft: `calc(1em + ${theme.spacing(4)})`,
            transition: theme.transitions.create('width'),
            width: '100%',
            [theme.breakpoints.up('md')]: {
                width: '20ch',
            },
        },
    }));

    const list = () => (
        <Box
            sx={{ width: 250, }}
            role="presentation"
        >
            <Search>
                <SearchIconWrapper>
                    <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                    placeholder="搜尋專案庫"
                    inputProps={{ 'aria-label': 'search' }}
                />
            </Search>
            <List>
                <ListSubheader component="div" id="nested-list-subheader" sx={{ fontSize: 20, display: 'flex', justifyContent: 'space-between' }} >
                    我的專案
                    <Button variant="contained" disableElevation sx={{ margin: '6px 0' }} size="small" endIcon={<AddBoxIcon />} onClick={handleDialogOpen}>
                        新專案
                    </Button>
                </ListSubheader>
                <Divider />
                {repositoryData.map((text, index) => (
                    <ListItem disablePadding key={text}
                        secondaryAction={
                            <IconButton edge="end" id="option-button" aria-controls="option-menu" aria-haspopup="true" aria-expanded={open ? 'true' : undefined} onClick={handleMenuClick}>
                                <MoreVertIcon />
                            </IconButton>
                        }>
                        <ListItemButton>
                            <ListItemText primary={text} />
                        </ListItemButton>
                    </ListItem>
                ))}
                <Menu
                    id="option-menu"
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    MenuListProps={{
                        'aria-labelledby': 'option-button',
                    }}
                    sx={{
                        zIndex: 9998,
                        boxShadow: 1
                    }}
                >
                    <MenuItem onClick={handleMenuClose}>刪除專案</MenuItem>
                    <MenuItem onClick={handleMenuClose}>更改名稱</MenuItem>
                </Menu>
            </List>
        </Box>
    );

    return (
        <>
            <Drawer
                anchor='left'
                open={RepositoryOpen}
                onClose={toggleDrawer(false)}
                sx={{
                    zIndex: 9997,
                    '& .MuiPaper-root': {
                        "&::-webkit-scrollbar": {
                            width: 0
                        }
                    }
                }}
            >
                {list()}
                <NewCodeDialog open={dialogOpen} handleClose={handleDialogClose} />
            </Drawer>
        </>
    );
}
