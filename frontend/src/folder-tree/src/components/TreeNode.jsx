import React, { useState } from 'react';
import { FaFolder, FaFolderOpen, FaFileAlt } from 'react-icons/fa';

const TreeNode = ({ node, onFileClick, depth = 0, selectedFile, isDarkMode }) => {
  const [collapsed, setCollapsed] = useState(true);
  const isDirectory = node.type === 'dir';

  const toggleCollapse = () => setCollapsed(!collapsed);
  const handleClick = () => isDirectory ? toggleCollapse() : onFileClick(node);

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

export default TreeNode;
