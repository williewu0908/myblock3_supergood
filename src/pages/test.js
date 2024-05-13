import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from "@/components/dev-components/code-editor";
import PythonFlowchart from "@/components/flowchart/pythonFlowchart";

export default function Test() {
    return (
        <>
            <PythonFlowchart code="def greet(name):\n    print(f'Hello, {name}!')" />
        </>
    );
}