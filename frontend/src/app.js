import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Recursive component to display folder structure
const TreeNode = ({ node }) => {
  const isDirectory = node.type === 'dir';

  return (
    <li className="list-group-item">
      <div>
        <strong>{isDirectory ? '📁' : '📄'} {node.name}</strong>
      </div>
      {isDirectory && node.contents && (
        <ul className="list-group list-group-flush ms-4 mt-2">
          {node.contents.map((child, index) => (
            <TreeNode key={index} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const App = () => {
  const [treeData, setTreeData] = useState(null);

  // Simulate API call
  useEffect(() => {
    const fetchData = async () => {
      // Simulated API response
      const data = {
        name: "root",
        type: "dir",
        contents: [
          {
            name: "calculator",
            type: "dir",
            contents: [
              {
                name: "calculator.py",
                type: "file"
              }
            ]
          }
        ]
      };

      // Simulate network delay
      setTimeout(() => {
        setTreeData(data);
      }, 500);
    };

    fetchData();
  }, []);

  return (
    <div className="container mt-5">
      <h2 className="mb-4">📂 File Explorer</h2>
      {treeData ? (
        <ul className="list-group">
          <TreeNode node={treeData} />
        </ul>
      ) : (
        <div className="text-muted">Loading file structure...</div>
      )}
    </div>
  );
};

export default App;
