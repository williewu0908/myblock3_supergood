import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor';
import { XMLProvider } from "@/components/blockly/XMLContext";
import { CodeProvider } from '@/components/dev-components/CodeContext';
import CodeExec from '@/components/dev-components/CodeExec';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
    ChatWithAI: true,
  });

  useEffect(() => {
    const loadingTimer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(loadingTimer);
          return 100;
        }
        return prevProgress + 3.33;
      });
    }, 30);

    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/myblock3/whois', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          window.location.href = 'https://sw-hie-ie.nknu.edu.tw/';
          return;
        }

        const data = await response.json();
        if (!data.username) {
          window.location.href = 'https://sw-hie-ie.nknu.edu.tw/';
        } else {
          // 驗證成功後，停止加載動畫
          clearInterval(loadingTimer);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = 'https://sw-hie-ie.nknu.edu.tw/';
      }
    };

    checkAuthStatus();

    return () => {
      clearInterval(loadingTimer);
    };
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 
            className="animate-spin text-blue-600" 
            size={64} 
            strokeWidth={3}
          />
          <div className="w-64 bg-white rounded-full h-3 overflow-hidden shadow-md">
            <div 
              className="bg-blue-500 h-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-blue-800 font-semibold">
            正在檢查使用者身份... {Math.round(progress)}%
          </p>
        </div>
      </div>
    );
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