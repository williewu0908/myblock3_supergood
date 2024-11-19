import { useState, useRef } from 'react';
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor';
import { XMLProvider } from "@/components/blockly/XMLContext";
import { CodeProvider } from '@/components/dev-components/CodeContext'

import CodeExec from '@/components/dev-components/CodeExec';

export default function Index() {
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
    ChatWithAI: true,
  });

  const toggleViewState = (newState) => {
    setViewState(newState);
  };

  const codeExecRef = useRef(); // 在 CodeExec 中的handleCheckCodeAvailabilityTrigger 和 runPythonCode引用

  return (
    <>
      <div className="container">
        <XMLProvider>
          <CodeProvider>
            {/* <ChatWithAI viewState={viewState} /> */}
            <DevNavBar toggleViewState={toggleViewState} />
            <CodeEditor viewState={viewState} codeExecRef={codeExecRef} />
          </CodeProvider>
        </XMLProvider>
        <CodeExec ref={codeExecRef} />
      </div>
    </>
  );
}
