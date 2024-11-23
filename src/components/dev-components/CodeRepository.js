import * as React from 'react';
import { useContext } from 'react';
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
import Skeleton from '@mui/material/Skeleton';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { useXML } from '@/components/blockly/XMLContext';
import { CodeContext } from '@/components/dev-components/CodeContext';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const clearIndexedDB = async () => {
    return new Promise((resolve, reject) => {
        const openRequest = indexedDB.open('codeDatabase', 1);

        openRequest.onerror = function (event) {
            console.error('Error opening database:', event.target.errorCode);
            reject(event.target.errorCode);
        };

        openRequest.onsuccess = function (event) {
            const db = event.target.result;
            const transaction = db.transaction(['codeStore'], 'readwrite');
            const store = transaction.objectStore('codeStore');
            const clearRequest = store.clear();

            clearRequest.onsuccess = function () {
                console.log('IndexedDB cleared successfully');
                resolve();
            };

            clearRequest.onerror = function () {
                console.error('Error clearing store:', clearRequest.error);
                reject(clearRequest.error);
            };
        };
    });
};

// 新增專案
function NewCodeDialog({ open, handleClose, fetchProjects, existingProjects, setOriginXML, currentProject }) {
    const [userInput, setUserInput] = React.useState('');
    const [isExist, setIsExist] = React.useState(false);
    const { contextCode, setContextCode } = React.useContext(CodeContext);
    const { setXML, getXML } = useXML(); // 獲取getXML方法

    // 儲存到資料庫
    const handleSubmit = async (event) => {
        event.preventDefault();

        const trimmedUserInput = userInput.trim();
        if (!trimmedUserInput) return;

        // 檢查輸入的名稱是否存在
        console.log('existingProjects', existingProjects)
        const projectExists = existingProjects.projects.includes(trimmedUserInput || 'Myblock3');
        if (projectExists) {
            setIsExist(true);
            return;
        }

        try {
            if (currentProject = '新專案') {
                const requestBody = {
                    project_name: trimmedUserInput,
                    code: '', // 空程式碼
                    blockly_code: '' // 留空
                };

                const response = await fetch("/myblock3/api/projects", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: 'include',
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();

                if (response.ok) {
                    console.log("Project added:", data);
                    // 設置新增專案的初始 JSON
                    setOriginXML(getXML());
                    // 更新專案列表
                    fetchProjects();
                } else {
                    console.error("Failed to add project:", data);
                }
            } else {
                const requestBody = {
                    project_name: trimmedUserInput,
                    code: contextCode, // 使用 contextCode 儲存程式碼
                    blockly_code: '' // 留空
                };

                const response = await fetch("/myblock3/api/projects", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: 'include',
                    body: JSON.stringify(requestBody)
                });

                const data = await response.json();
                if (response.ok) {
                    console.log("Project added:", data);
                    // 設置新增專案的初始 JSON
                    try {
                        await clearIndexedDB(); // 清空 IndexedDB
                        console.log('IndexedDB cleared successfully');
                    } catch (error) {
                        console.error('Error clearing IndexedDB:', error);
                    }
                    setXML('')
                    setContextCode('')
                    // 更新專案列表
                    fetchProjects();
                } else {
                    console.error("Failed to add project:", data);
                }
            }



        } catch (error) {
            console.error("Error:", error);
        }

        setUserInput('');
        handleClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            sx={{ zIndex: 9999 }}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    padding: 1,
                }
            }}
        >
            {currentProject = '新專案' ? <DialogTitle>另存新檔</DialogTitle> : <DialogTitle>新專案</DialogTitle>}
            <DialogContent>
                <DialogContentText>
                    專案名稱請不要超過255個字
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="專案名稱"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    error={isExist}
                    helperText={isExist ? "專案名稱已存在" : ""}
                />

            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                <Button onClick={handleSubmit}>儲存</Button>
            </DialogActions>
        </Dialog>
    );
}

function RenameDialog({ open, handleClose, selectedProject, renameProject }) {
    const [newName, setNewName] = React.useState('');

    const handleRename = () => {
        if (newName.trim()) {
            renameProject(selectedProject, newName);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            sx={{ zIndex: 9999 }}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    padding: 1,
                }
            }}
        >
            <DialogTitle>更改名稱</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    專案名稱請不要超過255個字
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="專案名稱"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>取消</Button>
                <Button onClick={handleRename}>儲存</Button>
            </DialogActions>
        </Dialog>
    );
}

const CodeRepository = React.forwardRef(({ RepositoryOpen, toggleDrawer, repositoryData, fetchProjects, loading, setCurrentProject, setOriginXML, currentProject }, ref) => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [selectedProject, setSelectedProject] = React.useState(null);
    const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
    const { getXML } = useXML(); // 獲取getXML方法
    const { setXML } = useXML(); // 獲取setXML方法
    const { contextCode, setContextCode } = React.useContext(CodeContext);
    const open = Boolean(anchorEl);
    const [searchQuery, setSearchQuery] = React.useState(''); // 搜尋狀態
    const searchInputRef = React.useRef(null);

    // 打開輸入新專案名稱的視窗
    const handleDialogOpen = () => {
        setDialogOpen(true);
    };

    // 關閉輸入新專案名稱的視窗
    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    // 點擊專案名稱，取得專案名稱
    const handleMenuClick = (event, key) => {
        setSelectedProject(key);
        setAnchorEl(event.currentTarget);
    };

    // 關閉專案目錄
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedProject(null);
    };

    // 打開更改專案名稱的視窗
    const handleRenameDialogOpen = (project) => {
        setSelectedProject(project);
        setRenameDialogOpen(true);
    };

    // 關閉更改專案名稱的視窗
    const handleRenameDialogClose = () => {
        setRenameDialogOpen(false);
    };

    // 刪除專案
    const deleteProject = async (project) => {
        try {
            console.log(project)
            const response = await fetch(`/myblock3/api/projects/${project.project_name}`, {
                method: "DELETE",
                credentials: 'include',  // 加入這行以發送 cookies
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Project deleted:", data);
                fetchProjects(); // Refresh data
            } else {
                console.error("Failed to delete project:", data);
            }
        } catch (error) {
            console.error("Error deleting project:", error);
        }
        handleMenuClose();
    };

    // 重新命名專案
    const renameProject = async (oldProjectName, newProjectName) => {
        try {
            const response = await fetch(`/myblock3/api/projects/${oldProjectName.project_name}/name`, {
                method: "PUT",
                credentials: 'include',  // 加入這行以發送 cookies
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ project_name: newProjectName })  // 修改傳送的資料格式
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Project renamed:", data);
                fetchProjects(); // Refresh data
                window.location.reload();
            } else {
                console.error("Failed to rename project:", data);
            }
        } catch (error) {
            console.error("Error renaming project:", error);
        }
        handleRenameDialogClose();
        handleMenuClose();
    };

    const updatePythonCodeInIndexedDB = async (newCode) => {
        return new Promise((resolve, reject) => {
            const openRequest = indexedDB.open('codeDatabase', 1);

            openRequest.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('codeStore')) {
                    db.createObjectStore('codeStore', { keyPath: 'id' });
                }
            };

            openRequest.onsuccess = function (event) {
                const db = event.target.result;
                const transaction = db.transaction(['codeStore'], 'readwrite');
                const store = transaction.objectStore('codeStore');

                // 使用相同的 id 更新 code
                const putRequest = store.put({
                    id: 'python_code',
                    code: newCode
                });

                putRequest.onsuccess = function () {
                    resolve();
                };

                putRequest.onerror = function (event) {
                    console.error('Error updating code:', event.target.error);
                    reject(event.target.error);
                };
            };

            openRequest.onerror = function (event) {
                console.error('Error opening database:', event.target.error);
                reject(event.target.error);
            };
        });
    };


    //載入先前的專案old
    const loadProject = async (project) => {
        try {
            const response = await fetch(`/myblock3/api/projects/${project.project_name}/code`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Project loaded:", data);
                localStorage.setItem('isLoading', 'true'); // 儲存載入狀態，以暫停xml同步到python
                const event = new Event('isLoadingChanged');
                window.dispatchEvent(event);
                try {
                    // 更新程式碼
                    await updatePythonCodeInIndexedDB(data.code);
                    console.log('Current code:', currentCode);
                } catch (error) {
                    console.error('Operation failed:', error);
                }
                setTimeout(() => {
                    localStorage.setItem('isLoading', 'false');
                }, 100);
                setContextCode(data.code)
                setXML('')
                setCurrentProject(project.project_name); // 更新當前項目名稱
            } else {
                console.error("Failed to load project:", data);
            }
        } catch (error) {
            console.error("Error loading project:", error);
        }
        handleMenuClose();
        try {
            const response = await fetch(`/myblock3/api/projects/${project.project_name}/code`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Project loaded:", data);
                localStorage.setItem('isLoading', 'true'); // 儲存載入狀態，以暫停xml同步到python
                const event = new Event('isLoadingChanged');
                window.dispatchEvent(event);
                try {
                    // 更新程式碼
                    await updatePythonCodeInIndexedDB(data.code);
                    console.log('Current code:', currentCode);
                } catch (error) {
                    console.error('Operation failed:', error);
                }
                setTimeout(() => {
                    localStorage.setItem('isLoading', 'false');
                }, 100);
                setContextCode(data.code)
                setXML('')
                setCurrentProject(project.project_name); // 更新當前項目名稱
            } else {
                console.error("Failed to load project:", data);
            }
        } catch (error) {
            console.error("Error loading project:", error);
        }
        handleMenuClose();
    };



    React.useImperativeHandle(ref, () => ({
        loadProject,
    }));


    // 搜尋過濾專案
    const filteredProjects = repositoryData?.projects?.filter((project) =>
        project.project_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setSearchQuery(e.target.value); // 當按下 Enter 時更新搜尋查詢
        }
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
            sx={{ width: 250 }}
            role="presentation"
        >
            <Search>
                <SearchIconWrapper>
                    <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                    placeholder="搜尋專案庫"
                    inputProps={{ 'aria-label': 'search' }}
                    onKeyDown={handleKeyDown} // 監聽 Enter 鍵
                    inputRef={searchInputRef} // 綁定 ref
                    defaultValue={searchQuery}
                />
            </Search>
            <List>
                <ListSubheader component="div" id="nested-list-subheader" sx={{ fontSize: 20, display: 'flex', justifyContent: 'space-between' }} >
                    我的專案
                    {
                        currentProject === '新專案' ?
                            <Button variant="contained" disableElevation sx={{ margin: '6px 0', backgroundColor: 'rgb(40, 187, 155)' }} size="small" endIcon={<SaveAsIcon />} onClick={handleDialogOpen}>
                                另存新檔
                            </Button>
                            :
                            <Button variant="contained" disableElevation sx={{ margin: '6px 0' }} size="small" endIcon={<AddBoxIcon />} onClick={handleDialogOpen}>
                                新專案
                            </Button>
                    }
                </ListSubheader>
                <Divider />
                {loading ? (
                    Array.from(new Array(5)).map((_, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%'
                            }}
                        >
                            <Skeleton animation="wave" variant="rounded" width={220} height={46} sx={{ marginTop: 2 }} />
                        </Box>
                    ))
                ) : (
                    filteredProjects.map((project, index) => (
                        <ListItem
                            disablePadding
                            key={project.id}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    id="option-button"
                                    aria-controls="option-menu"
                                    aria-haspopup="true"
                                    aria-expanded={open ? 'true' : undefined}
                                    onClick={(event) => handleMenuClick(event, project)}
                                >
                                    <MoreVertIcon />
                                </IconButton>
                            }
                        >
                            <ListItemButton onClick={() => loadProject(project)}>
                                <ListItemText primary={project.project_name} />
                            </ListItemButton>
                        </ListItem>
                    ))

                )}
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
                    <MenuItem onClick={() => deleteProject(selectedProject)}>刪除專案</MenuItem>
                    <MenuItem onClick={() => handleRenameDialogOpen(selectedProject)}>更改名稱</MenuItem>
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
                disableScrollLock={true}
            >
                {list()}
                <NewCodeDialog open={dialogOpen} handleClose={handleDialogClose} fetchProjects={fetchProjects} existingProjects={repositoryData} setOriginXML={setOriginXML} currentProject={currentProject} />
                <RenameDialog open={renameDialogOpen} handleClose={handleRenameDialogClose} renameProject={renameProject} selectedProject={selectedProject} />
            </Drawer>
        </>
    );
});

export default CodeRepository;
