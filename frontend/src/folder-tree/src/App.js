import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const TreeNode = ({ node, onFileClick }) => {
  const [collapsed, setCollapsed] = useState(true);
  const isDirectory = node.type === 'dir';

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

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
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const data = {
        name: 'root',
        type: 'dir',
        contents: [
          {
            name: 'calculator',
            type: 'dir',
            contents: [
              {
                name: 'calculator.py',
                type: 'file'
              }
            ]
          },
          {
            name: 'README.md',
            type: 'file'
          }
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

  return (
    <div className="container-fluid mt-3">
      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'tree' ? 'active' : ''}`}
            onClick={() => setActiveTab('tree')}
          >
            Tree View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'process' ? 'active' : ''}`}
            onClick={() => setActiveTab('process')}
          >
            Process Full Repo
          </button>
        </li>
      </ul>

      {/* Main Layout */}
      {activeTab === 'tree' ? (
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 border-end">
            <h5 className="mb-3">📂 File Explorer</h5>
            {treeData ? (
              <ul className="list-group list-group-flush">
                <TreeNode node={treeData} onFileClick={handleFileClick} />
              </ul>
            ) : (
              <div>Loading...</div>
            )}
          </div>

          {/* File View */}
          <div className="col-md-9">
            <h5>📝 File Viewer</h5>
            {selectedFile ? (
              <div className="bg-light p-3 rounded border mb-3">
                <h6>{selectedFile}</h6>
                <pre className="mt-2 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {fileContent}
                </pre>
              </div>
            ) : (
              <div className="text-muted mb-3">Select a file to view its contents</div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-muted">
          <h4>📦 Process Full Repository</h4>
          <p>Feature coming soon. You’ll be able to run analysis and batch processing here.</p>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        className="btn btn-primary rounded-pill"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
        }}
        onClick={() => setChatOpen(!chatOpen)}
      >
        {chatOpen ? 'Close Chat' : 'Chat 💬'}
      </button>

      {/* Floating Chat Panel */}
      {chatOpen && (
        <div
          className="shadow border bg-white"
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '25vw',
            height: '60vh',
            zIndex: 999,
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        >
          <iframe
            title="n8n-chatbot"
            src="https://your-n8n-chatbot-url.com"
            width="100%"
            height="100%"
            frameBorder="0"
          />
        </div>
      )}
    </div>
  );
};

export default App;
