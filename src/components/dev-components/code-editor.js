import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import BlocklyComponent, { Block, Button, Category, Value, Field, Shadow, COLOR } from '@/components/blockly'
import PythonEditor from '@/components/pythonEditor/pythonEditor';
import PythonFlowchart from '@/components/flowchart/pythonFlowchart';
import styles from '@/components/dev-components/CodeEditor.module.css';
import ChatInterface from '@/components/chatAI/ChatInterface/ChatInterface';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import '@/components/blockly/blocks/customblocks';
import '@/components/blockly/generator/generator';

export default function CodeEditor({ viewState, codeExecRef }) {
  const BlocklyRef = useRef();
  const [isCodeAvailable, setIsCodeAvailable] = useState(false);
  const [code, setCode] = useState(``);

  const handleCodeUpdate = (newCode) => {
    setCode(newCode);
  };

  const handleBlocklyCode = () => {
    if (BlocklyRef.current) {
      BlocklyRef.current.pythonCode(); // 調用子組件的方法
    }
  }

  const executeCode = () => {
    if (codeExecRef.current) {
      codeExecRef.current.runPythonCode();
    }
  };

  async function checkCodeAvailability() {
    const code = await codeExecRef.current.getPythonCodeFromIndexedDB();
    setIsCodeAvailable(code.trim() !== ""); // 檢查是否有代碼
  }

  useEffect(() => {
    const handleCheckCodeAvailabilityTrigger = () => {
      checkCodeAvailability();
    };

    // 監聽 pythonEditor 的改變
    window.addEventListener('checkCodeAvailabilityTrigger', handleCheckCodeAvailabilityTrigger);

    checkCodeAvailability();

    return () => {
      window.removeEventListener('checkCodeAvailabilityTrigger', handleCheckCodeAvailabilityTrigger);
    };
  }, []);

  return (
    <Box sx={{ width: '100%', height: '55%', display: 'flex' }}>
        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.Blockly ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>積木</h2>
          </div>
          <div className={styles.boxcontainer} id='blockly_container'>
            <BlocklyComponent
              readOnly={false}
              trashcan={true}
              media={'media/'}
              move={{
                scrollbars: true,
                drag: true,
                wheel: true,
              }}
              grid={{
                spacing: 20,
                length: 3,
                colour: '#ccc',
                snap: true
              }}
              zoom={{
                controls: true,
                wheel: true,
                startScale: 1.0,
                maxScale: 3,
                minScale: 0.3,
                scaleSpeed: 1.2
              }}
              // toolbox={toolbox} // 這裡傳遞 toolbox
              ref={BlocklyRef}
              viewState={viewState.Blockly}
            >
              <Category name='變數' custom='VARIABLE' colour={COLOR.VARIABLES}>
                {/* <Button text="Create Variable..." callbackKey="createVariable" /> */}
                {/* <Block type="ast_Delete" />
            <Block type="ast_Global" />
            <Block type="ast_Nonlocal" /> */}
                {/* <Block type="ast_Starred" /> */}
              </Category>
              <Category name='函式' colour={COLOR.FUNCTIONS}>
                {/* <Block type="ast_Comp_create_with_container" />
          <Block type="ast_Comp_create_with_for" />
          <Block type="ast_Comp_create_with_if" /> */}
                <Block type="ast_Call" />
                <Block type="print_call" />
                <Block type="ast_FunctionDef" />
                <Block type="ast_Return" />
                <Block type="ast_ReturnFull" />
              </Category>
              <Category name='邏輯判斷' colour={COLOR.LOGIC}>
                <Block type="ast_NameConstantBoolean" />
                <Block type="ast_Compare" />
                <Block type="ast_If" />
                <Block type="ast_IfExp" />
                <Block type="ast_UnaryOpNot" />
                {/* <Block type="ast_Assert" />
          <Block type="ast_AssertFull" /> */}
              </Category>
              <Category name='類別' colour={COLOR.OO}>
                <Block type="ast_ClassDef" />
                {/* <Block type="ast_Attribute" />
          <Block type="ast_AttributeFull" /> */}
              </Category>
              <Category name='迴圈控制' colour={COLOR.CONTROL}>
                <Block type="ast_While" />
                <Block type="ast_With" />
                <Block type="ast_Break" />
                <Block type="ast_For" />
              </Category>
              <Category name='數字&運算符' colour={COLOR.MATH}>
                <Block type='ast_Num' />
                <Block type='ast_abs' />
                <Block type='ast_round' />
                <Block type="ast_max" />
                <Block type="ast_min" />
                <Block type="ast_AugAssign" />
                {/* <Block type='ast_BinOp'/> */}
                <Block type='ast_BinOpFull' />
                <Block type="ast_UnaryOpInvert" />
              </Category>
              <Category name='文字' colour={COLOR.TEXT}>
                {/* <Block type="ast_Image" /> */}
                <Block type="ast_Str" />
                <Block type="ast_input" />
              </Category>
              <Category name='List' colour={COLOR.LIST}>
                {/* <Block type="ast_List_create_with_item" /> */}
                <Block type="ast_List" />
              </Category>
              <Category name='Dictionary' colour={COLOR.DICTIONARY}>
                <Block type="ast_Dict" />
                {/* <Block type="ast_DictComp" /> */}
                <Block type="ast_DictItem" />
              </Category>
              <Category name='Set' colour={COLOR.SET}>
                {/* <Block type="ast_SetComp" /> */}
                <Block type="ast_Set" />
              </Category>
              <Category name='Tuple' colour={COLOR.TUPLE}>
                <Block type="ast_Tuple" />
              </Category>
              <Category name='Sequence' colour={COLOR.SEQUENCES}>
                <Block type="ast_sorted" />
              </Category>
            </BlocklyComponent>
          </div>
        </Box>

        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.FlowChart ? 'block' : 'none' }}>
          <div className={styles.boxtitle}>
            <h2>活動圖</h2>
            <button id={styles.export} onClick={() => {
              window.dispatchEvent(new CustomEvent('exportFlowchart'));
            }}>
              Export
            </button>
          </div>
          <div className={styles.boxcontainer}>
            <PythonFlowchart code={code} />
          </div>
        </Box>

        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.Code ? 'block' : 'none', position: 'relative' }}>
          <div className={styles.boxtitle}>
            <h2>程式碼</h2>
            <IconButton
              aria-label="play"
              size="large"
              sx={{ color: '#a55b6d',
                    marginLeft: 'auto',
                    marginRight: '2px' }}
              onClick={executeCode}
              disabled={!isCodeAvailable}
            >
              <PlayArrowIcon fontSize="inherit" />
            </IconButton>
          </div>
          <div className={styles.boxcontainer}>
            <PythonEditor code={code} onUpdate={handleCodeUpdate} />
          </div>
        </Box>

        <Box sx={{ flex: 1, height: '100%', backgroundColor: '#F8F8F8', display: viewState.ChatWithAI ? 'block' : 'none', overflow: 'auto' }}>
          <div className={styles.boxcontainer} style={{ height: '100%' }}>
            <div className={styles.chatInterfaceContainer}>
              <ChatInterface viewState={viewState} />
            </div>
          </div>
        </Box>
    </Box>
  );
}
