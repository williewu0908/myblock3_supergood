import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor';
import { XMLProvider } from "@/components/blockly/XMLContext";
import { CodeProvider } from '@/components/dev-components/CodeContext';
import CodeExec from '@/components/dev-components/CodeExec';
import Footer from '@/components/footer/footer';

export default function Index() {
  const router = useRouter();
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
    ChatWithAI: true,
  });

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
        {/* 頁腳 */}
        <Footer />
      </div>
    </>
  );
}
