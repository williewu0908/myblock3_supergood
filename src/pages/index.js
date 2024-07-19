import ChatWithAI from "../components/chatAI/ChatWithAI"
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor'

export default function Home() {
    return (
        <>
            <div className="container">
                <DevNavBar />
                <ChatWithAI />
                <CodeEditor />
            </div>
<<<<<<< HEAD
            <ChatWithAI />
=======
>>>>>>> b528e83deee143ff920e891b27d01012712fa0ab
        </>
    );
}
