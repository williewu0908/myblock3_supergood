import Head from 'next/head'
import Script from 'next/script';
import styles from './blockly.module.css';
import blockly_compressed from 'blockly/blockly_compressed';
import blocks_compressed from 'blockly/blocks_compressed';
import javascript_compressed from 'blockly/javascript_compressed';
import python_compressed from 'blockly/python_compressed';
import React, { useState, useEffect, useContext } from 'react';
// import './script.js';

if (typeof window !== "undefined") {
  window.Blockly = blockly_compressed;
  window.blocks = blocks_compressed;
  window.javascript = javascript_compressed;
  window.python = python_compressed;
}


function Tabs() {
  return (
    <div className={styles.tabButtons} style={{display:'none'}}>
      <button id="tab_blocks" className={styles.tabon + ' ' + styles.tabButton}>積木</button>
      <button id="tab_javascript" className={styles.taboff + ' ' + styles.tabButton}>javascript</button>
      <button id="tab_python" className={styles.taboff + ' ' + styles.tabButton}>Python</button>
      <button id="tab_xml" className={styles.taboff + ' ' + styles.tabButton}>XML</button>
      <button id="tab_json" className={styles.taboff + ' ' + styles.tabButton}>JSON</button>
      <div id="tab_code" className={styles.tabCode}>
        <select id="code_menu" />
      </div>
      <div>
        <button id="trashButton" className={styles.notext} title="...">
          <img src="blockly/media/1x1.gif" className={styles.trash + ' ' + styles.icon21} />
        </button>
        <button id="linkButton" className={styles.notext} title="...">
          <img src="blockly/media/1x1.gif" className={styles.link + ' ' + styles.icon21} />
        </button>
        <button id="runButton" className={styles.notext + ' ' + styles.primary} title="...">
          <img src="blockly/media/1x1.gif" className={styles.run + ' ' + styles.icon21} />
        </button>
      </div>
    </div>
  )
}


function Content() {
  const [localContentXML, setLocalContentXML] = useState('');

  // Observe changes in the content_blocks element
  useEffect(() => {
    const xmlTextarea = document.getElementById('content_xml');
    const contentBlocks = document.getElementById('content_blocks');

    // Create a MutationObserver to watch for changes in content_blocks
    const observer = new MutationObserver(() => {
      // Update localContentXML with the new value of content_xml
      setLocalContentXML(xmlTextarea.value);
    });

    // Start observing content_blocks for changes
    observer.observe(contentBlocks, { childList: true, subtree: true, attributes: true });

    // Cleanup the observer on component unmount
    return () => {
      observer.disconnect();
    };
  });

  return (
    <div className={styles.contentContainer}>
      <div id="content_blocks" className={styles.content} />
      <pre id="content_javascript" className={styles.content + ' prettyprint lang-js'} />
      <pre id="content_python" className={styles.content + ' prettyprint lang-py'} />
      <pre id="content_php" className={styles.content + ' prettyprint lang-php'} />
      <pre id="content_lua" className={styles.content + ' prettyprint lang-lua'} />
      <pre id="content_dart" className={styles.content + ' prettyprint lang-dart'} />
      <textarea
        id="content_xml"
        className={styles.content}
        wrap="off"
        value={localContentXML}
        onChange={(e) => setLocalContentXML(e.target.value)}
      />
      <textarea id="content_json" className={styles.content} wrap="off" defaultValue={""} />
    </div>
  );
}



function Header() {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="google" value="notranslate" />
        <title>Blockly Demo:</title>
      </Head>

      <Script
        src="/blockly/src/blocklyScript.js"
        strategy="lazyOnload"
        onLoad={() =>
          console.log(`JavaScript正確地載入，blocklyScript.js 已被定義`)
        }
        defer
      />
    </>
  )
}

export default function HomePage() {
  return (
    <div id='blockly_block' width="100%" height="100%">
      <Header />
      <select id="languageMenu" style={{display:'none'}}/>
      <Tabs />
      <div width="100%" height="100%" id="content_area"></div>
      <Content />
    </div>
  );
}