import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

const TreeNode = ({ node, onFileClick }) => {
  const [collapsed, setCollapsed] = useState(true);
  const isDirectory = node.type === 'dir';

  const handleToggle = () => setCollapsed(!collapsed);

  return (
    <li className="list-group-item border-0 px-1 py-1">
      <div
        role="button"
        onClick={isDirectory ? handleToggle : () => onFileClick(node)}
        className={`d-flex align-items-center ${isDirectory ? 'fw-bold' : ''}`}
      >
        <span className="me-2">{isDirectory ? (collapsed ? '▶️' : '🔽') : '📄'}</span>
        {node.name}
      </div>

      {isDirectory && !collapsed && node.contents && (
        <ul className="list-group list-group-flush ms-4">
          {node.contents.map((child, index) => (
            <TreeNode key={index} node={child} onFileClick={onFileClick} />
          ))}
        </ul>
      )}
    </li>
  );
};

const App = () => {
  const [treeData, setTreeData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [activeTab, setActiveTab] = useState('tree');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const [chatWidth, setChatWidth] = useState(30); // %
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = {
        name: 'root',
        type: 'dir',
        contents: [
          {
            name: 'calculator',
            type: 'dir',
            contents: [{ name: 'calculator.py', type: 'file' }]
          },
          { name: 'README.md', type: 'file' }
        ]
      };
      setTreeData(data);
    };

    fetchData();
  }, []);

  const handleFileClick = (fileNode) => {
    setSelectedFile(fileNode.name);
    setFileContent(`// Contents of ${fileNode.name}\nprint("Hello from ${fileNode.name}")`);
  };

 const sendChat = () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const codeBase64 = fileContent
      ? btoa(unescape(encodeURIComponent(fileContent)))
      : '';

    fetch('http://ec2-52-90-95-78.compute-1.amazonaws.com/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input,
        code: codeBase64
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const botMessage = { sender: 'bot', text: data.message || 'No response' };
        setMessages((prev) => [...prev, botMessage]);
      })
      .catch((error) => {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Error contacting chat API.' },
        ]);
        console.error('Chat error:', error);
      });
  };


  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  const handleResizing = (e) => {
    if (!isResizing) return;
    const container = document.querySelector('.resizable-container');
    const containerWidth = container.getBoundingClientRect().width;
    const newWidth = ((containerWidth - e.clientX + container.offsetLeft) / containerWidth) * 100;
    if (newWidth >= 20 && newWidth <= 60) {
      setChatWidth(newWidth);
    }
  };

  useEffect(() => {
    const onMouseMove = (e) => handleResizing(e);
    const onMouseUp = () => stopResizing();

    if (isResizing) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="container-fluid mt-3">
      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'tree' ? 'active' : ''}`} onClick={() => setActiveTab('tree')}>
            Tree View
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'process' ? 'active' : ''}`} onClick={() => setActiveTab('process')}>
            Process Full Repo
          </button>
        </li>
      </ul>

      {activeTab === 'tree' ? (
        <div className="row">
          {/* File tree */}
          <div className="col-md-3 border-end">
            <h5>📂 File Explorer</h5>
            {treeData ? (
              <ul className="list-group list-group-flush">
                <TreeNode node={treeData} onFileClick={handleFileClick} />
              </ul>
            ) : (
              <div>Loading...</div>
            )}
          </div>

          {/* File viewer and resizable chat panel */}
          <div className="col-md-9 d-flex resizable-container" style={{ position: 'relative' }}>
            {/* File Viewer */}
            <div className="flex-grow-1 pe-2">
              <h5>📝 File Viewer</h5>
              {selectedFile ? (
                <div className="bg-light p-3 rounded border mb-3">
                  <h6>{selectedFile}</h6>
                  <pre className="mt-2 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                    {fileContent}
                  </pre>
                </div>
              ) : (
                <div className="text-muted">Select a file to view its contents</div>
              )}
            </div>

            {/* Resizer */}
            <div
              style={{
                cursor: 'col-resize',
                width: '5px',
                backgroundColor: '#ddd',
                marginRight: '4px',
              }}
              onMouseDown={startResizing}
            />

            {/* Chat Panel */}
            <div
              className="border rounded p-3 bg-white"
              style={{
                width: `${chatWidth}%`,
                height: '400px',
                overflowY: 'auto',
              }}
            >
              <h6>💬 Chat Assistant</h6>
              <div className="chat-messages mb-3" style={{ maxHeight: '300px', overflowY: 'scroll' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`mb-2 ${msg.sender === 'user' ? 'text-end' : 'text-start'}`}>
                    <div className={`p-2 rounded ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-light'}`}>
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                />
                <button className="btn btn-primary" onClick={sendChat}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-muted">
          <h4>📦 Process Full Repository</h4>
          <p>Feature coming soon.</p>
        </div>
      )}
    </div>
  );
};

export default App;
