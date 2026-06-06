import React from 'react';
import { clsx } from 'clsx';
import { Mail, MailOpen } from 'lucide-react';

const EmailList = ({ emails, selectedId, onSelect }) => {
  if (!emails || emails.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No emails found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {emails.map((email) => (
        <div
          key={email.id}
          onClick={() => onSelect(email)}
          className={clsx(
            'p-4 cursor-pointer hover:bg-gray-100 transition-colors',
            selectedId === email.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent',
            !email.isRead && 'font-semibold bg-white'
          )}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2 overflow-hidden">
              {email.isRead ? (
                <MailOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              ) : (
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
              <span className="truncate text-sm text-gray-900">
                {email.sender?.emailAddress?.name || email.sender?.emailAddress?.address}
              </span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
              {new Date(email.receivedDateTime).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <h4 className="text-sm text-gray-800 mb-1 line-clamp-1">{email.subject}</h4>
          <p className="text-xs text-gray-500 line-clamp-2">{email.bodyPreview}</p>
        </div>
      ))}
    </div>
  );
};

export default EmailList;
