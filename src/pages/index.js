import ChatWithAI from "../components/chatAI/ChatWithAI";
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor';
import { JSONProvider } from "@/components/blockly/JSONContext";
import { useState } from 'react';

export default function Home() {
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
  });

  const toggleViewState = (newState) => {
    setViewState(newState);
  };

  return (
    <>
      <div className="container">
        <JSONProvider>
          <DevNavBar toggleViewState={toggleViewState} />
          <ChatWithAI />
          <CodeEditor viewState={viewState} />
        </JSONProvider>
      </div>
    </>
  );
}
