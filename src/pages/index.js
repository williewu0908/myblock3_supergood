import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor';
import { XMLProvider } from "@/components/blockly/XMLContext";
import { CodeProvider } from '@/components/dev-components/CodeContext';
import CodeExec from '@/components/dev-components/CodeExec';
import Loader from '@/components/loader/Loader';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
    ChatWithAI: true,
  });

  useEffect(() => {
    // 固定顯示 Loader 3 秒
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // 清理定時器
    return () => clearTimeout(timer);
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

  return (
    <>
      {isLoading && <Loader />}
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
