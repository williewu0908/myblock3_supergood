import { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import DevNavBar from "@/components/dev-components/dev-nav";
import CodeEditor from '@/components/dev-components/code-editor';
import { XMLProvider } from "@/components/blockly/XMLContext";
import { CodeProvider } from '@/components/dev-components/CodeContext';
import CodeExec from '@/components/dev-components/CodeExec';

export default function Index() {
  const router = useRouter();
  const [viewState, setViewState] = useState({
    Blockly: true,
    FlowChart: true,
    Code: true,
    ChatWithAI: true,
  });

  const toggleViewState = (newState) => {
    setViewState(newState);
  };

  const codeExecRef = useRef();
  const codeEditorRef = useRef();

  const handlegenerateXML = (pythonCode) => {
    if (codeEditorRef.current) {
      codeEditorRef.current.generateXML(pythonCode);
    }
  }

  return (
    <div>
      {/* 主內容 */}
      <div style={{ flex: 1 }}>
        <XMLProvider>
          <CodeProvider>
            <DevNavBar
              toggleViewState={toggleViewState}
              handlegenerateXML={handlegenerateXML}
            />
            <CodeEditor
              viewState={viewState}
              codeExecRef={codeExecRef}
              ref={codeEditorRef}
            />
          </CodeProvider>
        </XMLProvider>
        <CodeExec ref={codeExecRef} />
      </div>

      {/* 頁腳 */}
      <footer
        style={{
          display: "block",
          width: "100%",
          textAlign: "center",
          background: "#4b5c66",
          color: "white",
          lineHeight: 1.5,
          fontFamily: "'Poppins', sans-serif",
          padding: "15px 0",
        }}
      >
        <p>&emsp;</p>
        <p>
          <a style={{ color: "white" }} href="https://sites.google.com/mail.nknu.edu.tw/cph/home">
            🌏HIE Lab | Ⓖ 🚀 Ⓖ | 🛸 Ⓖ | 🚜 Ⓦ&emsp;
          </a>
        </p>
        <p>
          <a style={{ color: "white" }} href="https://sites.google.com/mail.nknu.edu.tw/iecnknu/%E9%A6%96%E9%A0%81">
            &emsp;🌏NKNU-IEC Ⓖ Ⓕ Ⓑ
          </a>
        </p>
        <p>© 2008-2025 Power by Po-Hsun Cheng (鄭伯壎) and Li-Wei Chen (陳立偉),</p>
        <p>Information Education Center, National Kaohsiung Normal University, Taiwan.</p>
        <p>Source: Yu-Kun Tsai (蔡煜堃), XXX-XXX XXX (陳彥宇), XXX-XXX XXX (吳威廷)</p>
      </footer>
    </div>
  );
}
