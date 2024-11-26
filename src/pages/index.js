import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor';
import { XMLProvider } from "@/components/blockly/XMLContext";
import { CodeProvider } from '@/components/dev-components/CodeContext';
import CodeExec from '@/components/dev-components/CodeExec';

export default function Index() {
  const router = useRouter();
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
    ChatWithAI: true,
  });

  // 檢查用戶登入狀態
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/myblock3/whois', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          // 如果響應不是 200，重定向到登入頁面
          window.location.href = 'https://sw-hie-ie.nknu.edu.tw/';
          return;
        }

        const data = await response.json();
        if (!data.username) {
          // 如果沒有用戶名，也重定向到登入頁面
          window.location.href = 'https://sw-hie-ie.nknu.edu.tw/';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // 發生錯誤時重定向到登入頁面
        window.location.href = 'https://sw-hie-ie.nknu.edu.tw/';
      }
    };

    checkAuthStatus();
  }, []); // 空依賴數組表示只在組件首次渲染時執行

  const toggleViewState = (newState) => {
    setViewState(newState);
  };

  const codeExecRef = useRef();
  const codeEditorRef = useRef();
  
  const handlegenerateXML = (pythonCode) => {
    if (codeEditorRef.current) {
      codeEditorRef.current.generateXML(pythonCode);
    }
  }

  return (
    <>
      <div className="container">
        <XMLProvider>
          <CodeProvider>
            <DevNavBar 
              toggleViewState={toggleViewState} 
              handlegenerateXML={handlegenerateXML}
            />
            <CodeEditor 
              viewState={viewState} 
              codeExecRef={codeExecRef} 
              ref={codeEditorRef}
            />
          </CodeProvider>
        </XMLProvider>
        <CodeExec ref={codeExecRef} />
      </div>
    </>
  );
}
