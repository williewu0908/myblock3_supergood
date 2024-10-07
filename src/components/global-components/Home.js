// components/Home.js
import { useState } from 'react';
import ChatWithAI from "../chatAI/ChatWithAI";
import DevNavBar from "../dev-components/dev-nav";
import CodeEditor from '../dev-components/code-editor';
import { JSONProvider } from "../blockly/JSONContext";

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
        <div className="container">
            <JSONProvider>
                <DevNavBar toggleViewState={toggleViewState} />
                <ChatWithAI />
                <CodeEditor viewState={viewState} />
            </JSONProvider>
        </div>
    );
}