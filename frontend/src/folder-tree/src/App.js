import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import TreeNode from './components/TreeNode';
import FileViewer from './components/FileViewer';
import ChatAssistant from './components/ChatAssistant';
import RepoProcessor from './components/RepoProcessor';
import {
  REPO_NAME,
  REPO_OWNER,
  API_ROOT_URL,
  TREE_API_URL,
  FILE_API_URL,
  CHAT_IFRAME_SRC,
} from './constants';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const chatEndRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${TREE_API_URL}/${REPO_OWNER}/${REPO_NAME}`).then((response) => {
      const data = { name: REPO_NAME, type: 'dir', contents: response.data.contents };
      setTreeData(data);
      setFilteredTree(data);
    });
  }, []);

  const fuzzyFilterTree = (node, term) => {
    if (!term) return node;
    const match = node.name.toLowerCase().includes(term.toLowerCase());
    const filteredChildren = node.contents
      ?.map((child) => fuzzyFilterTree(child, term))
      .filter(Boolean);
    return match || (filteredChildren && filteredChildren.length)
      ? { ...node, contents: filteredChildren }
      : null;
  };

  useEffect(() => {
    if (treeData) {
      setFilteredTree(fuzzyFilterTree(treeData, searchTerm));
    }
  }, [searchTerm, treeData]);

  const handleFileClick = async (fileNode) => {
    setSelectedFile(fileNode.name);
    setFolderPath(fileNode.path);
    setLoadingFile(true);

    const response = await axios.post(
      FILE_API_URL,
      {
        owner: REPO_OWNER,
        repo: REPO_NAME,
        full_file_name: fileNode.path,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const decoded = decodeURIComponent(escape(atob(response.data.content)));
    setFileContent(decoded);
    setLoadingFile(false);
  };

  const sendChat = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    setInput('');

    const codeBase64 = fileContent ? btoa(unescape(encodeURIComponent(fileContent))) : '';
    fetch(`${API_ROOT_URL}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, code: codeBase64 }),
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.message || 'No response' }]);
      })
      .catch(() =>
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Error contacting chat API.' }])
      );
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
    if (newWidth >= 20 && newWidth <= 60) setChatWidth(newWidth);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizing);
      document.addEventListener('mouseup', stopResizing);
    }
    return () => {
      document.removeEventListener('mousemove', handleResizing);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  return (
    <div className={`container-fluid py-3 ${isDarkMode ? 'bg-dark text-light' : 'bg-white text-dark'}`}>
      <h2 className="me-auto fw-bold pb-3 pt-2 d-flex align-items-center">
        <img src="/assets/pc_icon.png" alt="PC Icon" className="icon" />
        Code Companion
      </h2>
      <h5 className="me-auto fw-bold pb-3 pt-2 d-flex align-items-center">       
        Repository Name: {REPO_NAME}
      </h5>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <ul className="nav nav-tabs">
          {['tree', 'process', 'new'].map((tab) => (
            <li key={tab} className="nav-item">
              <button className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'tree' ? 'Repo Explorer' : tab === 'process' ? 'Process Code' : 'Chatbot'}
              </button>
            </li>
          ))}
        </ul>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="darkModeSwitch"
            checked={isDarkMode}
            onChange={() => setIsDarkMode(!isDarkMode)}
          />
          <label className="form-check-label" htmlFor="darkModeSwitch">Dark Mode</label>
        </div>
      </div>

      {activeTab === 'tree' && (
        <div className="row">
          <div className={`col-md-3 border-end ${isDarkMode ? 'border-secondary' : 'border-light'}`}>
            <h5 className="mb-2">📂 File Explorer</h5>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {filteredTree ? (
              <TreeNode
                node={filteredTree}
                onFileClick={handleFileClick}
                selectedFile={selectedFile}
                isDarkMode={isDarkMode}
              />
            ) : (
              <div>No matching files found</div>
            )}
          </div>
          <div className="col-md-9 d-flex resizable-container position-relative">
            <FileViewer {...{ selectedFile, isDarkMode, loadingFile, fileContent }} />
            <div className="resizer" onMouseDown={startResizing} />
            <ChatAssistant
              {...{ messages, input, setInput, sendChat, chatEndRef, isDarkMode, chatWidth }}
            />
          </div>
        </div>
      )}

      {activeTab === 'process' && (
        <RepoProcessor {...{ loading, setLoading, newRepo, setNewRepo }} />
      )}

      {activeTab === 'new' && (
        <div className="p-4 text-center" style={{ height: '750px' }}>
          <iframe title="n8n-chatbot" src={CHAT_IFRAME_SRC} width="100%" height="100%" frameBorder="0" />
        </div>
      )}
    </div>
  );
};

export default App;
