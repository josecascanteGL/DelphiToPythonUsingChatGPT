import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

const ChatAssistant = ({ messages, input, setInput, sendChat, chatEndRef, isDarkMode, chatWidth }) => (
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
);

export default ChatAssistant;
