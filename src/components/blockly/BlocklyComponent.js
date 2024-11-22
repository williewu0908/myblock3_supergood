import React, { useCallback, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from '@/components/blockly/BlocklyComponent.module.css';
import * as Blockly from 'blockly/core';
import { pythonGenerator } from 'blockly/python';
import * as locale from 'blockly/msg/zh-hant';

import 'blockly/blocks';
import { BlockMirrorTextToBlocks } from '@/components/blockly/blocks/text_to_blocks';


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

// 儲存Blockly產生的xml到IndexedDB
function saveWorkspaceToIndexedDB(workspaceXML) {
  if (!db) {
    console.error('IndexedDB is not initialized');
    return;
  }

  const xmlString = new XMLSerializer().serializeToString(workspaceXML);
  var transaction = db.transaction(['codeStore'], 'readwrite');
  var objectStore = transaction.objectStore('codeStore');
  var request = objectStore.put({ id: 'workspace_xml', code: xmlString });

  request.onsuccess = function () {
    // console.log('XML from Workspace saved to IndexedDB :' + xmlString);
  };

  request.onerror = function (event) {
    console.error('Error saving workspace XML to IndexedDB:', event.target.errorCode);
  };
}

// 載入IndexedDB儲存的xml到Blockly
function loadWorkspaceFromIndexedDB(callback) {
  if (!db) {
    console.error('IndexedDB is not initialized');
    callback(null);
    return;
  }

  var transaction = db.transaction(['codeStore'], 'readonly');
  var objectStore = transaction.objectStore('codeStore');
  var request = objectStore.get('workspace_xml');

  request.onsuccess = function (event) {
    const result = event.target.result;
    if (result && result.code) {
      // console.log('Workspace XML loaded from IndexedDB:', result.code);
      // 使用 DOMParser 將字符串轉換回 XML
      // const parser = new DOMParser();
      // const workspaceXML = parser.parseFromString(result.code, 'text/xml');
      callback(result.code);  // 將工作區的數據傳回去
    } else {
      console.log('No workspace XML found in IndexedDB');
      callback(null);
    }
  };

  request.onerror = function (event) {
    console.error('Error loading workspace XML from IndexedDB:', event.target.errorCode);
    callback(null);
  };
}

const BlocklyComponent = forwardRef((props, ref) => {
  const blocklyArea = useRef(); // 工作區的父容器
  const blocklyDiv = useRef(); // 工作區的DOM容器
  const toolbox = useRef(); // 參考工具箱容器
  let primaryWorkspace = useRef(); // 儲存主要的Blockly工作區

  function saveCodeToIndexedDB(code) {
    return new Promise((resolve, reject) => {
      // console.log('WorkSpace Python:' + code);
      var transaction = db.transaction(['codeStore'], 'readwrite');
      var objectStore = transaction.objectStore('codeStore');
      var request = objectStore.put({ id: 'python_code', code: code });

      request.onsuccess = function (event) {
        // console.log('Code saved to IndexedDB');
        resolve();
      };

      request.onerror = function (event) {
        console.error('Error saving code to IndexedDB:', event.target.errorCode);
        reject(event.target.errorCode);
      };
    });
  }

  function cleanGeneratedPythonCode(code) {
    // 移除將變數初始化為 `None` 的語句，並去除僅跟在「變數名稱 = None」後的空白行
    code = code.replace(/^\s*\w+\s*=\s*None\s*\n(\s*\n)*/gm, '');
    // 去掉 `__name__` 後的數字
    code = code.replace(/__name__\d+/g, '__name__');
    return code;
  }

  const handleWorkspaceChange = useCallback(() => {
    if (localStorage.getItem('isLoading') === 'true') {
      console.log('Workspace is loading. Changes are ignored.');
      return; // 如果正在載入，則退出
    }
  
    const code = pythonGenerator.workspaceToCode(primaryWorkspace.current);
    const xml = Blockly.Xml.workspaceToDom(primaryWorkspace.current);
    saveWorkspaceToIndexedDB(xml);
    saveCodeToIndexedDB(cleanGeneratedPythonCode(code))
      .then(() => {
        window.dispatchEvent(new CustomEvent('blockUpdated', {
          detail: {
            code: code,
            source: 'BlocklyComponent',
          },
        }));
      });
  }, []);
  

  const handlePythonCodeUpdate = (newCode) => {
    if (primaryWorkspace.current) {
      try {
        // 清除現有的塊
        primaryWorkspace.current.clear();

        // 使用 BlockMirrorTextToBlocks 將 Python 代碼轉換為積木
        const converter = new BlockMirrorTextToBlocks();
        const blocks = converter.convertSource('', newCode);

        // 將轉換後的積木加載到工作區
        // console.log(blocks.xml);
        const xml = Blockly.utils.xml.textToDom(blocks.xml);
        Blockly.Xml.domToWorkspace(xml, primaryWorkspace.current);
      } catch (error) {
        console.error('Error converting Python to blocks:', error);
      }
    }
  };

  // 曝露給父組件的方法
  useImperativeHandle(ref, () => ({
    pythonCode: () => {
      generateCode();
    },
    saveCode: () => {
      const xml = Blockly.Xml.workspaceToDom(primaryWorkspace.current);
      // console.log(xml);
      return xml;
    },
    loadCode: (xml) => {
      const xmlText = Blockly.utils.xml.textToDom(xml);
      Blockly.Xml.domToWorkspace(xmlText, primaryWorkspace.current);
    }
  }));

  // 用來生成python代碼的方法，當用戶點擊按鈕時調用
  const generateCode = () => {
    var code = pythonGenerator.workspaceToCode(primaryWorkspace.current);
    saveCodeToIndexedDB(code);
    // console.log(code);
  };

  const restoreWorkspaceState = useCallback((xml) => {
    if (primaryWorkspace.current && xml) {
      const xmlText = Blockly.utils.xml.textToDom(xml);
      Blockly.Xml.domToWorkspace(xmlText, primaryWorkspace.current);
    }
  }, []);

  // 根據畫面大小自適應blockly工作區大小
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
      blocklyDivElement.style.height = element.offsetHeight + 'px';
    } else {
      blocklyDivElement.style.height = element.offsetHeight + 'px';
    }
    
    

    // Make the Blockly workspace resize to fit its parent's dimensions.
    Blockly.svgResize(primaryWorkspace.current);
  };
  const handleCodeUpdate = (event) => {
    if (event.detail && event.detail.source === 'pythonEditor') {
      const newCode = event.detail.code;
      // 在這裡執行你想要的方法
      handlePythonCodeUpdate(newCode);
    }
  };

  useEffect(() => {
    // if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const { initialXml, children, ...rest } = props;

      // 初始化 IndexedDB，並在初始化完成後進行後續操作
      initIndexedDB(() => {
        // 初始化 Blockly 工作區
        primaryWorkspace.current = Blockly.inject(blocklyDiv.current, {
          toolbox: toolbox.current,
          ...rest,
        });

        // 嘗試從 IndexedDB 中載入已儲存的工作區狀態
        loadWorkspaceFromIndexedDB((workspaceXML) => {
          if (workspaceXML) {
            restoreWorkspaceState(workspaceXML);
          }
        });

        // 當窗口大小改變時調用 `resizeBlocklyWorkspace`
        window.addEventListener('resize', resizeBlocklyWorkspace);
        window.addEventListener('codeUpdated', handleCodeUpdate);


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
          window.removeEventListener('codeUpdated', handleCodeUpdate);
          primaryWorkspace.current.dispose();
        }
      };
    }
  , [primaryWorkspace, toolbox, blocklyDiv, props]);

  // 在工作區變化時自動保存
  // const handleWorkspaceChange = useCallback(() => {
  //   const json = JSON.stringify(Blockly.serialization.workspaces.save(primaryWorkspace.current), null, 2);
  //   saveWorkspaceToIndexedDB(json);
  // }, []);

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
          loadWorkspaceFromIndexedDB((workspaceXML) => {
            if (workspaceXML) {
              restoreWorkspaceState(workspaceXML);
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
