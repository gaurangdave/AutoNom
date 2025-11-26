import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../../hooks/useToast';

const SelectionModal = ({ isOpen, onClose, message, onSubmit }) => {
  const [response, setResponse] = useState('');
  const toast = useToast();

  // Clear response when modal closes
  useEffect(() => {
    if (!isOpen) {
      setResponse('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!response.trim()) {
      toast.warning('Please enter a response');
      return;
    }

    // Call onSubmit synchronously - parent handles the rest
    onSubmit(response);
    setResponse('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              Agent Response - Approval Required
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
              <span>🤖</span>
              <span>Agent Message</span>
            </div>
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>
                {message}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-700">
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-300">Your Response:</label>
            <div className="flex gap-3">
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response here..."
                rows={2}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-slate-500 resize-none"
              />
              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 self-end"
              >
                <span>Send</span>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;
