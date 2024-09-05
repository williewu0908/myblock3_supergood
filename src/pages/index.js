import ChatWithAI from "../components/chatAI/ChatWithAI"
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor'
import { JSONProvider } from "@/components/blockly/JSONContext";

export default function Home() {
    return (
        <>
            <div className="container">
                <JSONProvider>
                    <DevNavBar /> {/* 包含了CodeRepository組件 */}
                    <ChatWithAI />
                    <CodeEditor />
                </JSONProvider>
            </div>
        </>
    );
}
