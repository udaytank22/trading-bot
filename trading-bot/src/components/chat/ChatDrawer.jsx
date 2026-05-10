import React, { useState } from "react";

const mockUsers = [
  { id: 1, name: "Alice Cooper", status: "online", lastMsg: "See you at the meeting", avatar: "AC" },
  { id: 2, name: "Bob Martin", status: "offline", lastMsg: "Offer sent", avatar: "BM" },
  { id: 3, name: "Charlie Day", status: "online", lastMsg: "Everything is confirmed", avatar: "CD" },
  { id: 4, name: "Diana Prince", status: "online", lastMsg: "Need the specs", avatar: "DP" },
];

const ChatDrawer = ({ isOpen, onClose }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([
    { sender: "them", type: "text", text: "Hello! How can I help you today?" },
    { sender: "me", type: "text", text: "I'm looking for the status of CGO-1001" },
    { sender: "them", type: "doc", fileName: "Shipment_Manifest_CGO1001.pdf", fileSize: "1.2 MB" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages([...messages, { sender: "me", type: "text", text: newMessage }]);
    setNewMessage("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const newMsg = {
      sender: "me",
      type: isImage ? "image" : "doc",
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + " KB",
      url: URL.createObjectURL(file),
    };

    setMessages([...messages, newMsg]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`relative w-full max-w-sm bg-[#1a1d23] h-full shadow-2xl border-l border-[#2a2d33] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2a2d33] flex items-center justify-between bg-[#1a1d23]">
          {selectedUser ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {selectedUser.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">{selectedUser.name}</h3>
                  <span className="text-[10px] text-emerald-400">Online</span>
                </div>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-bold text-white">Messages</h2>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedUser ? (
            <div className="p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === "me" ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl text-sm ${
                    msg.sender === "me" 
                      ? 'bg-purple-600 text-white rounded-tr-none' 
                      : 'bg-[#2a2d33] text-gray-200 rounded-tl-none'
                  } ${msg.type === 'text' ? 'px-4 py-2' : 'overflow-hidden border border-[#3a3d43]'}`}>
                    
                    {msg.type === 'text' && msg.text}

                    {msg.type === 'image' && (
                      <div className="p-1 bg-[#1a1d23]">
                        <img src={msg.url} alt="Shared" className="w-full h-auto rounded-xl object-cover max-h-[200px]" />
                        <div className="px-2 py-1.5 flex justify-between items-center bg-[#1a1d23]">
                           <span className="text-[10px] text-gray-400 truncate">{msg.fileName}</span>
                           <span className="text-[10px] text-gray-500">{msg.fileSize}</span>
                        </div>
                      </div>
                    )}

                    {msg.type === 'doc' && (
                      <div className="p-3 flex items-center gap-3 bg-[#1a1d23]/50">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0 border border-red-500/20">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-200 truncate">{msg.fileName || "document.pdf"}</p>
                          <p className="text-[10px] text-gray-500">{msg.fileSize || "1.5 MB"}</p>
                        </div>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#2a2d33]">
              {mockUsers.map(user => (
                <button 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#2a2d33] flex items-center justify-center text-sm font-bold text-gray-300 border border-[#3a3d43]">
                      {user.avatar}
                    </div>
                    {user.status === "online" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1a1d23] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-bold text-white truncate">{user.name}</span>
                      <span className="text-[10px] text-gray-500">2h ago</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.lastMsg}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer (Chat Input) */}
        {selectedUser && (
          <div className="p-4 border-t border-[#2a2d33] bg-[#1a1d23]">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <label className="p-2 rounded-lg bg-[#2a2d33] text-gray-400 hover:text-white cursor-pointer transition-colors border border-[#3a3d43] hover:border-gray-500 flex items-center justify-center">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </label>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#0c0e12] border border-[#2a2d33] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button 
                type="submit"
                className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDrawer;
