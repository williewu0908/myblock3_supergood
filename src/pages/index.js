import { useState} from 'react';
import DevNavBar from "../components/dev-components/dev-nav";
import CodeEditor from '../components/dev-components/code-editor';
import { XMLProvider } from "../components/blockly/XMLContext";

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
        <XMLProvider>
          {/* <ChatWithAI viewState={viewState} /> */}
          <DevNavBar toggleViewState={toggleViewState} />
          <CodeEditor viewState={viewState} />
        </XMLProvider>
      </div>
    </>
  );
}
