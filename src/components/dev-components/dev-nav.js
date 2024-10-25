import * as React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CssBaseline } from '@mui/material';
import CodeRepository from './CodeRepository';
import { useJSON } from '../blockly/JSONContext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Divider from '@mui/material/Divider';
import Blockly from 'blockly/core'; // 確保導入 Blockly

function SwitchesGroup({ state, handleChange }) {
    return (
        <FormControl component="fieldset" variant="standard">
            <FormGroup row sx={{ paddingLeft: 2 }}>
                <FormControlLabel
                    control={
                        <Switch checked={state.Blockly} onChange={handleChange} name="Blockly" />
                    }
                    label="積木"
                    sx={{ 
                        '.MuiFormControlLabel-label': { color: '#FFFFFF' }  // 修改字體顏色
                    }}
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.FlowChart} onChange={handleChange} name="FlowChart" />
                    }
                    label="活動圖"
                    sx={{ 
                        '.MuiFormControlLabel-label': { color: '#FFFFFF' }  // 修改字體顏色
                    }}
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.Code} onChange={handleChange} name="Code" />
                    }
                    label="程式碼"
                    sx={{ 
                        '.MuiFormControlLabel-label': { color: '#FFFFFF' }  // 修改字體顏色
                    }}
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.ChatWithAI} onChange={handleChange} name="ChatWithAI" />
                    }
                    label="AI聊天室"
                    sx={{ 
                        '.MuiFormControlLabel-label': { color: '#FFFFFF' }  // 修改字體顏色
                    }}
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
                <Toolbar sx={{ p: 0, m: 0 ,flexDirection: 'column', backgroundColor: '#333E51', width: '100%', paddingLeft: '0px !important', paddingRight: '0px !important' }}>
                    <Box sx={{ flexGrow: 1, display: 'flex', height: 60, float: 'left', justifyContent: 'center', alignItems: 'flex-end', width: '100%', background: 'linear-gradient(90deg, #f3f4f6 0%, #eae9e3 100%)', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', borderRadius: '.0rem .0rem .3rem .3rem' }}>
                        <Typography variant="h1" component="div" sx={{ fontSize: 45, paddingLeft: 3, paddingBottom: 1.75, fontWeight: 'bold', color: '#333',fontFamily: '"Aref Ruqaa Ink", system-ui'}}>
                            myBlock3
                        </Typography>
                        <Typography variant="h3" component="div" sx={{ color: '#5a5a5a', fontSize: 16, paddingLeft: 2, paddingBottom: 1.5}}>
                            利用 AI 來幫您編寫程式碼
                        </Typography>
                        <Typography variant="h5" component="div" sx={{ color: '#5a5a5a', fontSize: 10, paddingLeft: 1, paddingBottom: 1.5 }}>
                            v3.00 - 20241010
                        </Typography>
                    </Box>
                    <Box sx={{ flexGrow: 1, display: 'flex', height: 80, float: 'left', justifyContent: 'center', alignItems: 'center', width: '100%', borderRadius: '.0rem .0rem .3rem .3rem'}}>
                        <Button 
                            color="inherit" 
                            sx={{
                                backgroundColor: '#F2F3F4', 
                                width: 0.08, maxHeight: 0.5, 
                                marginX: 3, 
                                fontWeight: 'bold', 
                                '&:hover': {
                                    backgroundColor: '#e0e0e0', // 設定 hover 狀態的背景顏色
                                }
                            }}
                        >
                            首頁
                        </Button>
                        <Button 
                            color="inherit" 
                            onClick={toggleDrawer(true)} 
                            sx={{
                                backgroundColor: '#F2F3F4', 
                                width: 0.08, maxHeight: 0.5, 
                                marginX: 3, 
                                fontWeight: 'bold',
                                '&:hover': {
                                    backgroundColor: '#e0e0e0', // 設定 hover 狀態的背景顏色
                                }
                            }}
                        >
                            專案
                        </Button>
                        <Button disabled={canSave} loading={isSaving} onClick={() => saveProject(currentProject)} sx={{ transition: '0.3s ease', backgroundColor: '#F2F3F4', width: 0.08, maxHeight: 0.5, marginX: 3 }}>
                            {showSuccess ? <CheckCircleIcon color="success" /> : <SaveIcon />}
                        </Button>
                        <Divider orientation="vertical" variant="middle" flexItem />
                        <Box component="div" sx={{ fontSize: 22, paddingLeft: 3, color: 'rgb(90, 90, 90)', backgroundColor: '#F2F3F4', width: 0.08, maxHeight: 0.5, marginX: 3 }}>
                            {currentProject}
                        </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1, display: 'flex', height: 50, float: 'left', justifyContent: 'center', alignItems: 'center', width: '100%', borderRadius: '.0rem .0rem .3rem .3rem'}}>
                        <SwitchesGroup state={state} handleChange={handleChange} />
                    </Box>
                </Toolbar>
            </AppBar>
            <CodeRepository RepositoryOpen={isOpen} toggleDrawer={toggleDrawer} repositoryData={repositoryData} fetchData={fetchData} loading={isLoading} setCurrentProject={handleProjectName} setOriginJSON={setOriginJSON} />
        </>
    );
}
