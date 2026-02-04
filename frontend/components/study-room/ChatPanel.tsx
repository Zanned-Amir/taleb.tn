"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      author: "You",
      content: "Hey, ready to study?",
      timestamp: "10:30 AM",
      isOwn: true,
    },
    {
      id: "2",
      author: "John",
      content: "Yes! Let's start with chapter 3",
      timestamp: "10:32 AM",
      isOwn: false,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    // Don't scroll - let user control scroll position
  };

  useEffect(() => {
    // Removed auto-scroll
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: String(messages.length + 1),
        author: "You",
        content: inputValue,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
      };
      setMessages([...messages, newMessage]);
      setInputValue("");
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-gray-700 p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold">Chat</h2>
        <p className="text-sm text-gray-400">1 participant online</p>
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        data-messages-container
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs ${
                message.isOwn
                  ? "bg-blue-600 rounded-lg rounded-tr-none"
                  : "bg-gray-700 rounded-lg rounded-tl-none"
              } p-3`}
            >
              {!message.isOwn && (
                <p className="text-xs text-gray-300 mb-1 font-semibold">
                  {message.author}
                </p>
              )}
              <p className="text-sm text-white break-words">
                {message.content}
              </p>
              <p className="text-xs text-gray-300 mt-1">{message.timestamp}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4 space-y-2 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium flex-shrink-0"
          >
            Send
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition">
            📎 Share
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm transition">
            👍 Reactions
          </button>
        </div>
      </div>
    </div>
  );
}
