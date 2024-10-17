import React, { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from './BlocklyComponent.module.css';
import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';
import * as locale from 'blockly/msg/zh-hant';

import 'blockly/blocks';

// 設定Blockly的語言
Blockly.setLocale(locale);

var db;
function initIndexedDB(callback) {
  var request = indexedDB.open('codeDatabase', 1);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    var objectStore = db.createObjectStore('codeStore', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('code', 'code', { unique: false });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log('IndexedDB initialized');
    if (callback) callback(); // 通知初始化成功
  };

  request.onerror = function (event) {
    console.error('IndexedDB error:', event.target.errorCode);
  };
}

// 儲存python到IndexedDB
function saveCodeToIndexedDB(code) {
  var transaction = db.transaction(['codeStore'], 'readwrite');
  var objectStore = transaction.objectStore('codeStore');
  var request = objectStore.put({ id: 'python_code', code: code });

  request.onsuccess = function (event) {
    console.log('Code saved to IndexedDB');
    // Emit an event to notify that the code has been updated
    window.dispatchEvent(new CustomEvent('codeUpdated'));
  };

  request.onerror = function (event) {
    console.error('Error saving code to IndexedDB:', event.target.errorCode);
  };
}

// 儲存Blockly產生的json到IndexedDB
function saveWorkspaceToIndexedDB(workspaceJSON) {
  if (!db) {
    console.error('IndexedDB is not initialized');
    return;
  }

  var transaction = db.transaction(['codeStore'], 'readwrite');
  var objectStore = transaction.objectStore('codeStore');
  var request = objectStore.put({ id: 'workspace_json', code: workspaceJSON });

  request.onsuccess = function () {
    console.log('Workspace JSON saved to IndexedDB successfully');
  };

  request.onerror = function (event) {
    console.error('Error saving workspace JSON to IndexedDB:', event.target.errorCode);
  };
}

// 載入IndexedDB儲存的json到Blockly
function loadWorkspaceFromIndexedDB(callback) {
  if (!db) {
    console.error('IndexedDB is not initialized');
    callback(null);
    return;
  }

  var transaction = db.transaction(['codeStore'], 'readonly');
  var objectStore = transaction.objectStore('codeStore');
  var request = objectStore.get('workspace_json');

  request.onsuccess = function (event) {
    const result = event.target.result;
    if (result && result.code) {
      console.log('Workspace JSON loaded from IndexedDB:', result.code);
      callback(result.code);  // 將工作區的數據傳回去
    } else {
      console.log('No workspace JSON found in IndexedDB');
      callback(null);
    }
  };

  request.onerror = function (event) {
    console.error('Error loading workspace JSON from IndexedDB:', event.target.errorCode);
    callback(null);
  };
}

const BlocklyComponent = forwardRef((props, ref) => {
  const blocklyArea = useRef(); // 工作區的父容器
  const blocklyDiv = useRef(); // 工作區的DOM容器
  const toolbox = useRef(); // 參考工具箱容器
  let primaryWorkspace = useRef(); // 儲存主要的Blockly工作區

  useImperativeHandle(ref, () => ({
    pythonCode: () => {
      generateCode();
    },
    saveCode: () => {
      const json = JSON.stringify(Blockly.serialization.workspaces.save(primaryWorkspace.current), null, 2);
      console.log(json);
      return json;
    },
    loadCode: (json) => {
      Blockly.serialization.workspaces.load(json, primaryWorkspace.current);
    }
  }));

  // 用來生成python代碼的方法，當用戶點擊按鈕時調用
  const generateCode = () => {
    var code = pythonGenerator.workspaceToCode(primaryWorkspace.current);
    saveCodeToIndexedDB(code);
    console.log(code);
  };

  const restoreWorkspaceState = useCallback((json) => {
    if (primaryWorkspace.current && json) {
      const state = JSON.parse(json);
      Blockly.serialization.workspaces.load(state, primaryWorkspace.current);
    }
  }, []);

  const resizeBlocklyWorkspace = () => {
    const element = blocklyArea.current;
    const blocklyDivElement = blocklyDiv.current;

    // Compute the absolute coordinates and dimensions of blocklyArea.
    let x = 0;
    let y = 0;
    let currentElement = element;
    do {
      x += currentElement.offsetLeft;
      y += currentElement.offsetTop;
      currentElement = currentElement.offsetParent;
    } while (currentElement);

    // Position blocklyDiv over blocklyArea.
    blocklyDivElement.style.left = x + 'px';
    blocklyDivElement.style.top = y + 'px';
    blocklyDivElement.style.width = element.offsetWidth + 'px';
    
    if (element.offsetHeight > 0){
      blocklyDivElement.style.height = element.offsetHeight - 160 + 'px';
    } else {
      blocklyDivElement.style.height = element.offsetHeight + 'px';
    }
    
    

    // Make the Blockly workspace resize to fit its parent's dimensions.
    Blockly.svgResize(primaryWorkspace.current);
  };

  useEffect(() => {
    const { initialXml, children, ...rest } = props;
  
    // 初始化 IndexedDB，並在初始化完成後進行後續操作
    initIndexedDB(() => {
      // 初始化 Blockly 工作區
      primaryWorkspace.current = Blockly.inject(blocklyDiv.current, {
        toolbox: toolbox.current,
        ...rest,
      });
  
      // 嘗試從 IndexedDB 中載入已儲存的工作區狀態
      loadWorkspaceFromIndexedDB((workspaceJSON) => {
        if (workspaceJSON) {
          restoreWorkspaceState(workspaceJSON);
        }
      });
  
      // 當窗口大小改變時調用 `resizeBlocklyWorkspace`
      window.addEventListener('resize', resizeBlocklyWorkspace);
  
      // 初始化時立即調用 `resizeBlocklyWorkspace`
      resizeBlocklyWorkspace();
  
      // 註冊變化監聽器，確保 workspace 已初始化
      if (primaryWorkspace.current) {
        primaryWorkspace.current.addChangeListener(handleWorkspaceChange);
      }
    });
  
    // 清理函數
    return () => {
      window.removeEventListener('resize', resizeBlocklyWorkspace);
      if (primaryWorkspace.current) {
        primaryWorkspace.current.dispose();
      }
    };
  }, [primaryWorkspace, toolbox, blocklyDiv, props]);
  
  // 在工作區變化時自動保存
  const handleWorkspaceChange = useCallback(() => {
    const json = JSON.stringify(Blockly.serialization.workspaces.save(primaryWorkspace.current), null, 2);
    saveWorkspaceToIndexedDB(json);
  }, []);
  
  // 確保監聽器附加到工作區並在重渲染時移除
  useEffect(() => {
    if (primaryWorkspace.current) {
      // 註冊變化監聽器
      primaryWorkspace.current.addChangeListener(handleWorkspaceChange);
    }
  
    // 清理函數：移除變化監聽器
    return () => {
      if (primaryWorkspace.current) {
        primaryWorkspace.current.removeChangeListener(handleWorkspaceChange);
      }
    };
  }, [primaryWorkspace, handleWorkspaceChange]);
  
  useEffect(() => {
    if (primaryWorkspace.current) {
      if (!props.viewState) {
        // 當顯示狀態恢復時，重新加載狀態並調整大小
        setTimeout(() => {
          resizeBlocklyWorkspace();
          loadWorkspaceFromIndexedDB((workspaceJSON) => {
            if (workspaceJSON) {
              restoreWorkspaceState(workspaceJSON);
            }
          });
        }, 0);
      }
    }
  }, [props.viewState, restoreWorkspaceState]);
  

  // 渲染React組件的部分，返回Blockly工作區和工具箱
  return (
    <div ref={blocklyArea} id='blocklyArea' style={{ flex: 1 }}>
      {/* 這裡是Blockly工作區的容器 */}
      <div ref={blocklyDiv} id={styles.blocklyDiv} />
      {/* 工具箱的內容實際上是隱藏的，因為它只是為Blockly提供塊的XML結構 */}
      <div style={{ display: 'none' }} ref={toolbox}>
        {props.children} {/* 工具箱中包含的代碼塊 */}
      </div>
    </div>
  );
})

export default BlocklyComponent;
