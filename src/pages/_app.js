import '@/components/global-components/global.css';
import { XMLProvider } from "@/components/blockly/XMLContext";
import { CodeProvider } from '@/components/dev-components/CodeContext'

export default function App({ Component, pageProps }) {
  return (
    <XMLProvider>
      <CodeProvider>
        <Component {...pageProps} />
      </CodeProvider>
    </XMLProvider>
  );
}