import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { Loader2, Reply, Trash } from 'lucide-react';

const EmailDetail = ({ email }) => {
  const [fullEmail, setFullEmail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFullEmail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/outlook/emails/${email.id}`);
        setFullEmail(res.data);
      } catch (err) {
        console.error('Failed to load email details', err);
        // Fallback to what we have in list view
        setFullEmail(email);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchFullEmail();
    }
  }, [email.id]);

  if (loading || !fullEmail) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const senderName = fullEmail.sender?.emailAddress?.name;
  const senderEmail = fullEmail.sender?.emailAddress?.address;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{fullEmail.subject}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{senderName}</span>
            <span className="text-gray-500">&lt;{senderEmail}&gt;</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(fullEmail.receivedDateTime).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="Reply">
            <Reply className="w-5 h-5" />
          </button>
          <button className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
            <Trash className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-6 flex-1 overflow-y-auto">
        {fullEmail.body?.contentType === 'html' ? (
          <div 
            className="prose max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: fullEmail.body.content }}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm">
            {fullEmail.body?.content || fullEmail.bodyPreview}
          </pre>
        )}
      </div>
    </div>
  );
};

export default EmailDetail;
