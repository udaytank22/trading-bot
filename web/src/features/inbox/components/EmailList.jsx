import React from 'react';
import { clsx } from 'clsx';

const EmailList = ({ emails, selectedId, onSelect, folder }) => {
  if (!emails || emails.length === 0) {
    return (
      <div className="p-8 text-center text-stone-500 dark:text-stone-400">
        No emails found.
      </div>
    );
  }

  return (
    <div className="divide-y divide-stone-250/70 dark:divide-stone-800">
      {emails.map((email) => {
        const isSelected = selectedId === email.id;
        const displayName = folder === 'sent' && email.to && email.to.length > 0
          ? `To: ${email.to[0].name || email.to[0].address}`
          : (email.sender?.emailAddress?.name || email.sender?.emailAddress?.address);

        return (
          <div
            key={email.id}
            onClick={() => onSelect(email)}
            className={clsx(
              'p-5 cursor-pointer transition-colors relative border-l-[3px] focus:outline-none select-none',
              isSelected
                ? 'bg-[#EAF3EF] dark:bg-[#1a3328] border-[#0A5C43] dark:border-emerald-500'
                : 'bg-white dark:bg-[#181a20] hover:bg-stone-50/50 dark:hover:bg-stone-850 border-transparent'
            )}
          >
            <div className="flex justify-between items-baseline mb-1">
              <span className={clsx(
                'truncate text-sm text-[#1C2024] dark:text-stone-100 font-semibold',
                !email.isRead && 'font-bold'
              )}>
                {displayName}
              </span>
              <span className="text-xs text-stone-450 dark:text-stone-500 whitespace-nowrap ml-2 font-medium">
                {new Date(email.receivedDateTime).toLocaleDateString(undefined, { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <h4 className="text-sm text-stone-800 dark:text-stone-200 mb-1 line-clamp-1 font-semibold">
              {email.subject}
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed font-normal">
              {email.bodyPreview}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default EmailList;
