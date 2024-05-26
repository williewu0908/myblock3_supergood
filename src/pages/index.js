import Blockly from "../components/blockly/blockly";
import ChatWithAI from "../components/chatAI/ChatWithAI"

export default function Home() {
    return (
        <div className="container">
            <ChatWithAI/>
            <h1>測驗與開發介面的入口應該在這裡
                <Blockly />
            </h1>
        </div>
    );
}
