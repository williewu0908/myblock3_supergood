// import Blockly from "../components/blockly/blockly";
// import ChatWithAI from "../components/chatAI/ChatWithAI"
// import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor'

export default function Home() {
    return (
        <>
            <div className="container">
                {/* <DevNavBar />
                <ChatWithAI /> */}
                <CodeEditor />
                {/* <Blockly /> */}
            </div>
        </>
    );
}
