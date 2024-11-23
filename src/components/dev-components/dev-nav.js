import * as React from 'react';
import { useContext } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, CssBaseline } from '@mui/material';
import CodeRepository from '@/components/dev-components/CodeRepository';
import { CodeContext } from '@/components/dev-components/CodeContext';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Menu from '@mui/material/Menu';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import Divider from '@mui/material/Divider';
import Blockly from 'blockly/core'; // 確保導入 Blockly

function SwitchesGroup({ state, handleChange }) {
    return (
        <FormControl component="fieldset" variant="standard">
            <FormGroup sx={{ paddingLeft: 2 }}>
                <FormControlLabel
                    control={
                        <Switch checked={state.Blockly} onChange={handleChange} name="Blockly" />
                    }
                    label="積木"
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.FlowChart} onChange={handleChange} name="FlowChart" />
                    }
                    label="活動圖"
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.Code} onChange={handleChange} name="Code" />
                    }
                    label="程式碼"
                />
                <FormControlLabel
                    control={
                        <Switch checked={state.ChatWithAI} onChange={handleChange} name="ChatWithAI" />
                    }
                    label="AI聊天室"
                />
            </FormGroup>
        </FormControl>
    );
}

export default function DevNavBar({ toggleViewState }) {
    const [isOpen, setIsOpen] = React.useState(false); // 狀態控制Drawer是否打開
    const [repositoryData, setRepositoryData] = React.useState(); // 用於儲存後端取得的資料
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false); //控制顯示儲存的圖標
    const [canSave, setCanSave] = React.useState(false);
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [currentProject, setCurrentProject] = React.useState('新專案');
    const [originXML, setOriginXML] = React.useState('');
    const { contextCode, setContextCode } = useContext(CodeContext);
    const [state, setState] = React.useState({
        Blockly: true,
        FlowChart: true,
        Code: true,
        ChatWithAI: true,
    });
    const codeRepositoryRef = React.useRef(null);

    // React.useEffect(() => {
    //     const currentJSON = getXML();  // 獲取當前的 JSON

    //     // 如果專案是 'MyBlock3' 或當前 JSON 與原始 JSON 一樣
    //     if (currentProject === 'MyBlock3' || currentJSON === originXML) {
    //         setCanSave(true); // 按鈕無法保存
    //         console.log('save button disabled');
    //     } else {
    //         setCanSave(false);  // 按鈕可以保存
    //         console.log('save button enabled');
    //     }

    // }, [getXML()]); // 依賴 currentProject 和 getXML 返回的 JSON 值

    React.useEffect(() => {
        if (currentProject === '新專案') {
            setCanSave(true); // 按鈕無法保存
            console.log('save button disabled');
        } else {
            setCanSave(false);  // 按鈕可以保存
            console.log('save button enabled');
        }

    }); // 依賴 currentProject 和 getXML 返回的 JSON 值

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
            fetchProjects();
        }
    };

    // 取得現在所有專案的名字
    const fetchProjects = async () => {
        try {
            const response = await fetch('/myblock3/api/projects', { method: 'GET' });
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

    React.useEffect(() => {
        if (!codeRepositoryRef.current) {
            console.log('CodeRepository ref not initialized');
            return;
        }
    
        const loadLatestProject = async () => {
            try {
                const response = await fetch('/myblock3/api/projects', { method: 'GET' });
                if (response.ok) {
                    const data = await response.json();
                    const projects = data.projects;
    
                    if (projects && projects.length > 0) {
                        const latestProject = projects.sort((a, b) => 
                            new Date(b.updated_at) - new Date(a.updated_at)
                        )[0];
                        
                        console.log('Latest project:', latestProject);
                        try {
                            setTimeout(() => {
                                codeRepositoryRef.current.loadProjectsigle(latestProject);
                            }, 1000);
                            setTimeout(() => {
                                codeRepositoryRef.current.loadProjectsigle(latestProject);
                            }, 2000);
                            setTimeout(() => {
                                codeRepositoryRef.current.loadProjectsigle(latestProject);
                            }, 3000);
                            console.log('Project loaded successfully');
                        } catch (loadError) {
                            console.error('Error loading project:', loadError);
                        }
    
                        setCurrentProject(latestProject.project_name);
                    }
                } else {
                    console.error('Error fetching data:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        loadLatestProject();
    }, []);
    

    // 儲存已存在專案的變更
    const saveProject = async (project) => {
        try {
            setIsSaving(true);
            
            // 使用 CodeContext 中的 contextCode
            const code = contextCode; 
    
            // 1. 先檢查專案是否已經存在
            const listResponse = await fetch("/myblock3/api/projects", {
                method: "GET",
                credentials: 'include', // 確保攜帶 cookie 和驗證資訊
                headers: {
                    "Content-Type": "application/json"
                }
            });
    
            const listData = await listResponse.json();
            const projectExists = listData.projects.some(p => p.project_name === project);
    
            // 2. 根據專案是否存在，選擇不同的 API 端點和方法
            let apiUrl, method, requestBody;
    
            if (projectExists) {
                // 如果專案已存在，使用更新 API
                apiUrl = `/myblock3/api/projects/${project}/content`;
                method = "PUT";
                requestBody = { code: code };
            } else {
                // 如果專案不存在，使用創建 API
                apiUrl = "/myblock3/api/projects";
                method = "POST";
                requestBody = { 
                    project_name: project, 
                    code: code 
                };
            }
    
            // 3. 發送 API 請求
            const response = await fetch(apiUrl, {
                method: method,
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
    
            const data = await response.json();
    
            if (response.ok) {
                console.log(projectExists ? "Project updated:" : "Project created:", data);
                fetchProjects(); // 重新獲取專案列表
                setShowSuccess(true);
                
                // 1秒後隱藏成功圖案
                setTimeout(() => {
                    setShowSuccess(false);
                }, 1500);
                
                setIsSaving(false);
            } else {
                console.error(projectExists ? "Failed to update project:" : "Failed to create project:", data);
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
                            myBlock 3
                        </Typography>
                        <Typography variant="h6" component="div" sx={{ color: 'rgb(90, 90, 90)', fontSize: 10, paddingTop: 0.5 }}>
                            利用 AI 來幫您編寫程式碼 v3.10-202401109
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
                        id="changeUI"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                            'aria-labelledby': 'changeUIButton',
                        }}
                        disableScrollLock={true}
                    >
                        <SwitchesGroup state={state} handleChange={handleChange} />
                    </Menu>
                    <Button disabled={canSave} loading={isSaving} onClick={() => saveProject(currentProject)} sx={{ transition: '0.3s ease' }}>
                        {showSuccess ? <CheckCircleIcon color="success" /> : <SaveIcon />}
                    </Button>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <Box component="div" sx={{ fontSize: 22, paddingLeft: 3, color: 'rgb(90, 90, 90)' }}>
                        {currentProject}
                    </Box>
                </Toolbar>
            </AppBar>
            <CodeRepository RepositoryOpen={isOpen} toggleDrawer={toggleDrawer} repositoryData={repositoryData} fetchProjects={fetchProjects} loading={isLoading} setCurrentProject={handleProjectName} setOriginXML={setOriginXML} ref={codeRepositoryRef} currentProject={currentProject}/>
        </>
    );
}
