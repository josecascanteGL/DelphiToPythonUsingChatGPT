import React from 'react';

const RepoProcessor = ({ loading, setLoading, newRepo, setNewRepo }) => {
  const fetchLongTask = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1/execute');
      const data = await response.json();
      setNewRepo(data); // this will re-render the component
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 text-center">
      <h4>Analyze the entire repository, generate a detailed explanation, and provide a migrated version in Python</h4>
      <div className="container mt-5">
        <button onClick={fetchLongTask} className="btn btn-primary" disabled={loading}>
          {loading ? 'Waiting for response...' : 'Process Repository Code'}
        </button>
        {newRepo && (
          <div className="alert alert-success mt-3">
            ✅ Repository Created!<br />
            <a href={newRepo}>Git Repository</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepoProcessor;
