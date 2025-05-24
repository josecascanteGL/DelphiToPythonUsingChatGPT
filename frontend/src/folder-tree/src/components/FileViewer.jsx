import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';

const FileViewer = ({ selectedFile, isDarkMode, loadingFile, fileContent }) => (
  <div className="flex-grow-1 pe-2">
    <h5>{selectedFile}</h5>
    {loadingFile ? (
      <div>{isDarkMode ? 'Loading in dark mode...' : 'Loading in light mode...'}</div>
    ) : selectedFile ? (
      <div className={`${isDarkMode ? 'bg-secondary text-light' : 'bg-light text-dark'} p-3 rounded border mb-3`}>
        <SyntaxHighlighter language="pascal" style={isDarkMode ? oneDark : prism}>
          {fileContent}
        </SyntaxHighlighter>
      </div>
    ) : (
      <p>{isDarkMode ? '📝 Select a file to view (dark)' : '📝 Select a file to view (light)'}</p>
    )}
  </div>
);

export default FileViewer;
