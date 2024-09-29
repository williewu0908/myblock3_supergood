import * as React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CssBaseline } from '@mui/material';
import CodeRepository from './CodeRepository';
import { useJSON } from '../blockly/JSONContext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Menu from '@mui/material/Menu';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Divider from '@mui/material/Divider';

function SwitchesGroup({ state, handleChange }) {
    return (
        <FormControl component="fieldset" variant="standard">
            <FormGroup sx={{ paddingLeft: 2 }}>
                <FormControlLabel
                    control={
                        <Switch checked={state.Blockly} onChange={handleChange} name="Blockly" />
                    }
                    label="Blockly"
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.FlowChart} onChange={handleChange} name="FlowChart" />
                    }
                    label="流程圖"
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.Code} onChange={handleChange} name="Code" />
                    }
                    label="程式碼"
                />
            </FormGroup>
        </FormControl>
    );
}

export default function DevNavBar({ toggleViewState }) {
    const [isOpen, setIsOpen] = React.useState(false); // 狀態控制Drawer是否打開
    const [repositoryData, setRepositoryData] = React.useState([]); // 用於儲存後端取得的資料
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false); //控制顯示儲存的圖標
    const [canSave, setCanSave] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [currentProject, setCurrentProject] = React.useState('新專案');
    const [originJSON, setOriginJSON] = React.useState('');
    const { getJSON } = useJSON(); // 獲取getJSON方法
    const [state, setState] = React.useState({
        Blockly: true,
        FlowChart: true,
        Code: true,
    });

    // React.useEffect(() => {
    //     const currentJSON = getJSON();  // 獲取當前的 JSON

    //     // 如果專案是 'MyBlock3' 或當前 JSON 與原始 JSON 一樣
    //     if (currentProject === 'MyBlock3' || currentJSON === originJSON) {
    //         setCanSave(true); // 按鈕無法保存
    //         console.log('save button disabled');
    //     } else {
    //         setCanSave(false);  // 按鈕可以保存
    //         console.log('save button enabled');
    //     }

    // }, [getJSON()]); // 依賴 currentProject 和 getJSON 返回的 JSON 值

    React.useEffect(() => {
        if (currentProject === '新專案') {
            setCanSave(true); // 按鈕無法保存
            console.log('save button disabled');
        } else {
            setCanSave(false);  // 按鈕可以保存
            console.log('save button enabled');
        }

    }); // 依賴 currentProject 和 getJSON 返回的 JSON 值

    const handleChange = (event) => {
        setState({
            ...state,
            [event.target.name]: event.target.checked,
        });
        toggleViewState({
            ...state,
            [event.target.name]: event.target.checked,
        });
    };

    const toggleDrawer = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setIsOpen(open);

        if (open) {
            setIsLoading(true);
            fetchData();
        }
    };

    // 取得現在所有專案的名字
    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:5000/searchDB?username=${username}');
            if (response.ok) {
                const data = await response.json();
                setRepositoryData(data); // 更新狀態
                setIsLoading(false);
            } else {
                console.error('Error fetching data:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // 儲存已存在專案的變更
    const saveProject = async (project) => {
        try {
            setIsSaving(true);
            const JSONcode = getJSON(); // 獲取當前工作區的JSON
            const requestBody = {
                projectname: project,
                JSONcode: JSONcode
            };

            const response = await fetch("http://127.0.0.1:5000/saveProject", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                withCredentials: true, // 設置為 include 以確保憑證被包含在請求中
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Project update:", data);
                fetchData();
                setOriginJSON(JSONcode);
                setShowSuccess(true); // 儲存成功，顯示成功圖案
                // 1秒後隱藏成功圖案
                setTimeout(() => {
                    setShowSuccess(false);
                }, 1500);
                setIsSaving(false);
            } else {
                console.error("Failed to update project:", data);
            }

        } catch (error) {
            console.error("Error:", error);
        }
    };

    // 傳送取得專案名稱的方法給子組件
    const handleProjectName = (data) => {
        setCurrentProject(data);
    }

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleSwitchOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <CssBaseline />
            <AppBar position="static" sx={{ flexGrow: 1, p: 0, m: 0, backgroundColor: '#E3E1E1', color: 'rgb(60, 60, 60)' }}>
                <Toolbar sx={{ p: 0, m: 0 }}>
                    <Box sx={{ flexGrow: 1, display: 'flex', height: 52, float: 'left', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="h1" component="div" sx={{ fontSize: 26 }}>
                            MyBlock 3
                        </Typography>
                        <Typography variant="h6" component="div" sx={{ color: 'rgb(90, 90, 90)', fontSize: 10, paddingTop: 0.5 }}>
                            一款入門的線上編譯諮詢系統 v3.00-20240928
                        </Typography>
                    </Box>
                    <Button color="inherit">首頁</Button>
                    <Button color="inherit" onClick={toggleDrawer(true)}>專案</Button>
                    <Button
                        aria-haspopup="true"
                        color="inherit"
                        aria-expanded={open ? 'true' : undefined}
                        onClick={handleSwitchOpen}
                    >
                        畫面選項
                    </Button>
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'basic-button',
                        }}
                    >
                        <SwitchesGroup state={state} handleChange={handleChange} />
                    </Menu>
                    <Button disabled={canSave} loading={isSaving} onClick={() => saveProject(currentProject)} sx={{ transition: '0.3s ease' }}>
                        {showSuccess ? <CheckCircleIcon color="success" /> : <SaveIcon />}
                    </Button>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <Box component="div" sx={{ fontSize: 22, paddingLeft: 3, color: 'rgb(90, 90, 90)'}}>
                        {currentProject}
                    </Box>
                </Toolbar>
            </AppBar>
            <CodeRepository RepositoryOpen={isOpen} toggleDrawer={toggleDrawer} repositoryData={repositoryData} fetchData={fetchData} loading={isLoading} setCurrentProject={handleProjectName} setOriginJSON={setOriginJSON} />
        </>
    );
}
