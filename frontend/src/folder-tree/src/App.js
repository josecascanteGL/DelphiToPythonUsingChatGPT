import React, { useEffect, useState, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { FaFolder, FaFolderOpen, FaFileAlt, FaRegFolder } from 'react-icons/fa';
import { matchSorter } from 'match-sorter';

const TreeNode = ({ node, onFileClick, depth = 0, selectedFile, isDarkMode }) => {
  const [collapsed, setCollapsed] = useState(true);
  const isDirectory = node.type === 'dir';

  const toggleCollapse = () => setCollapsed(!collapsed);

  const handleClick = () => {
    if (isDirectory) toggleCollapse();
    else onFileClick(node);
  };

  return (
    <div className={`ps-3 border-start ${isDarkMode ? 'border-secondary' : 'border-light'}`} style={{ marginLeft: depth * 10 }}>
      <div
        className={`tree-item d-flex align-items-center py-1 px-2 rounded ${selectedFile === node.name ? 'bg-primary text-white' : isDarkMode ? 'text-light hover:bg-secondary' : 'text-dark hover:bg-light'}`}
        onClick={handleClick}
        role="button"
      >
        <span className="me-2">
          {isDirectory ? (collapsed ? <FaFolder /> : <FaFolderOpen />) : <FaFileAlt />}
        </span>
        <span>{node.name}</span>
      </div>

      {isDirectory && !collapsed && node.contents?.map((child, index) => (
        <TreeNode
          key={index}
          node={child}
          onFileClick={onFileClick}
          depth={depth + 1}
          selectedFile={selectedFile}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  );
};

const App = () => {
  const [treeData, setTreeData] = useState(null);
  const [filteredTree, setFilteredTree] = useState(null);
  const [selectedFile, setSelectedFile] = useState('');
  const [folderFullPath, setFolderPath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [newRepo, setNewRepo] = useState('');
  const [activeTab, setActiveTab] = useState('tree');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chatWidth, setChatWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const chatEndRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const repoName = 'Delphi-samples';
  const repoOwner = 'DeveloppeurPascal';

  useEffect(() => {
    const loadInitialTree = async () => {
      const response = await axios.get(`http://127.0.0.1/loadtree/${repoOwner}/${repoName}`);
      const data = {
        name: repoName,
        type: 'dir',
        contents: response.data.contents
      };
      setTreeData(data);
      setFilteredTree(data);
    };
    loadInitialTree();
  }, []);

  const fuzzyFilterTree = (node, term) => {
    if (!term) return node;
    const matches = matchSorter([node], term, { keys: ['name'] }).length > 0;
    const filteredChildren = node.contents?.map(child => fuzzyFilterTree(child, term)).filter(Boolean);
    if (matches || (filteredChildren && filteredChildren.length)) {
      return { ...node, contents: filteredChildren };
    }
    return null;
  };

  useEffect(() => {
    if (!treeData) return;
    const filtered = fuzzyFilterTree(treeData, searchTerm);
    setFilteredTree(filtered);
  }, [searchTerm, treeData]);

  const handleFileClick = async (fileNode) => {
    const fileName = fileNode.name;
    const folderPath = fileNode.path;
    setFolderPath(folderPath);
    setSelectedFile(fileName);
    setLoadingFile(true);

    const data = {
      owner: repoOwner,
      repo: repoName,
      full_file_name: folderPath
    };

    const response = await axios.post(
      'http://127.0.0.1/loadfile',
      data,
      { headers: { 'Content-Type': 'application/json' } }
    );

    const base64 = response.data.content;
    const decoded = decodeURIComponent(escape(atob(base64)));
    setFileContent(decoded);
    setLoadingFile(false);
  };

  const sendChat = () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const codeBase64 = fileContent ? btoa(unescape(encodeURIComponent(fileContent))) : '';
    fetch('http://127.0.0.1/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, code: codeBase64 }),
    })
      .then((response) => response.json())
      .then((data) => {
        const botMessage = { sender: 'bot', text: data.message || 'No response' };
        setMessages((prev) => [...prev, botMessage]);
      })
      .catch(() => {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Error contacting chat API.' }]);
      });
  };

  const fetchLongTask = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1/execute');
      console.log(response);
      const data = await response;
      setNewRepo(data); // this will re-render the component
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className={`container-fluid py-3 ${isDarkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`} style={{ minHeight: '100vh' }}>
      <h2 className="me-auto fw-bold pb-3 pt-2 d-flex align-items-center">
        <img src="/PCIcon.png" alt="PC Icon" style={{ height: '24px', width: '24px', marginRight: '8px' }} />
        Code Companion
      </h2>
      <h5 className="me-auto fw-bold pb-3 pt-2 d-flex align-items-center">
        <img src="/RepoIcon.png" alt="PC Icon" style={{ height: '24px', width: '24px', marginRight: '8px' }} />
        Repository Name: {repoName}
      </h5>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'tree' ? 'active' : ''}`}
              onClick={() => setActiveTab('tree')}
            >Repo Explorer</button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'process' ? 'active' : ''}`}
              onClick={() => setActiveTab('process')}
            >Process Code</button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
            >Chatbot</button>
          </li>
        </ul>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="darkModeSwitch"
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
          />
          <label className="form-check-label" htmlFor="darkModeSwitch">
            Dark Mode
          </label>
        </div>
      </div>

      {activeTab === 'tree' ? (
        <div className="row">
          <div className={`col-md-3 border-end ${isDarkMode ? 'border-secondary' : 'border-light'}`}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">📂 File Explorer</h5>
            </div>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {filteredTree ? (
              <TreeNode node={filteredTree} onFileClick={handleFileClick} selectedFile={selectedFile} isDarkMode={isDarkMode} />
            ) : (
              <div>No matching files found</div>
            )}
          </div>

          <div className="col-md-9 d-flex resizable-container position-relative">
            <div className="flex-grow-1 pe-2">
              <h5>{selectedFile}</h5>
              {loadingFile ? (
                <div className={isDarkMode ? 'dark-mode-text' : 'light-mode-text'}>Loading file...</div>
              ) : selectedFile ? (
                <div className={`${isDarkMode ? 'bg-secondary text-light' : 'bg-light text-dark'} p-3 rounded border mb-3`}>
                  <SyntaxHighlighter language="pascal" style={isDarkMode ? oneDark : prism}>
                    {fileContent}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <p className={isDarkMode ? 'dark-mode-text' : 'light-mode-text'}>📝 Select a file to view its contents</p>
              )}
            </div>

            <div
              style={{ cursor: 'col-resize', width: '5px', backgroundColor: isDarkMode ? '#444' : '#ccc', marginRight: '4px' }}
              onMouseDown={startResizing}
            />

            <div
              className={`border rounded p-3 ${isDarkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`}
              style={{ width: `${chatWidth}%`, height: '750px', display: 'flex', flexDirection: 'column' }}
            >
              <h6>💬 Chat Assistant</h6>
              <div className="chat-messages mb-3" style={{ flexGrow: 1, overflowY: 'auto' }}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`mb-2 ${msg.sender === 'user' ? 'text-end' : 'text-start'}`}>
                    <div className={`p-2 rounded ${msg.sender === 'user' ? 'bg-primary text-white' : isDarkMode ? 'bg-secondary text-light' : 'bg-light text-dark'}`}>
                      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef}></div>
              </div>
              <div className="mt-auto input-group">
                <input
                  className={`form-control ${isDarkMode ? 'bg-dark text-light border-secondary' : ''}`}
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                />
                <button className="btn btn-primary" onClick={sendChat}>Send</button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'process' ? (
        <div className="p-4 text-center">
          <h4 className={isDarkMode ? 'dark-mode-text' : 'light-mode-text'}>Analyze the entire repository, generate a detailed explanation, and provide a migrated version in Python</h4>
          <p className={isDarkMode ? 'dark-mode-text' : 'light-mode-text'}></p>
          <div className="container mt-5">
            <button onClick={fetchLongTask} className="btn btn-primary" disabled={loading}>
              {loading ? 'Waiting for response...' : 'Process Repository Code'}
            </button>
            {
            newRepo && (
              <div className="alert alert-success mt-3">
                ✅ Repository Creadted!<br />
                <a href = {newRepo}>Git Repoaitory</a>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center" style={{ height: '750px' }}>
          {<iframe
            title="n8n-chatbot"
            src="http://localhost:5678/webhook/bfc9b5aa-0d19-4a86-9a4b-1ea6e72e9054/chat"
            width="100%"
            height="100%"
            frameBorder="0"
          /> }
        </div>
      )}
    </div>
  );
};

export default App;