import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ChatWithAI from "../components/chatAI/ChatWithAI";
import DevNavBar from "../components/dev-components/dev-nav";
import CodeEditor from '../components/dev-components/code-editor';
import { JSONProvider } from "../components/blockly/JSONContext";

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

  return (
    <>
      <div className="container">
        <JSONProvider>
          {/* <ChatWithAI viewState={viewState} /> */}
          <DevNavBar toggleViewState={toggleViewState} />
          <CodeEditor viewState={viewState} />
        </JSONProvider>
      </div>
    </>
  );
}
