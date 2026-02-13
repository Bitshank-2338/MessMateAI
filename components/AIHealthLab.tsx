import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, ChefHat, Dumbbell, AlertTriangle, User, Sparkles, X, Trash2, Download, Upload } from 'lucide-react';
import { ChatMessage, UserProfile, AIMode } from '../types';
import { runHealthLabChat } from '../services/gemini';

interface AIHealthLabProps {
  profile: UserProfile;
}

export const AIHealthLab: React.FC<AIHealthLabProps> = ({ profile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('messMateChatHistory');
      return saved ? JSON.parse(saved) : [
        {
          role: 'model',
          text: `Yo! Welcome to the AI Health Lab. I'm dialed in for your ${profile.weight || 70}kg goal to cut that side fat. What's the agenda today?`,
          timestamp: Date.now()
        }
      ];
    } catch (e) {
      return [
        {
          role: 'model',
          text: `Yo! Welcome to the AI Health Lab. I'm dialed in for your ${profile.weight || 70}kg goal to cut that side fat. What's the agenda today?`,
          timestamp: Date.now()
        }
      ];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('messMateChatHistory', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', text: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Pass the current history + the new message
      const responseText = await runHealthLabChat(messages, text, mode, profile);
      
      const aiMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (selectedMode: AIMode, prompt: string) => {
    setMode(selectedMode);
    handleSend(prompt);
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      const initialMsg: ChatMessage = {
        role: 'model',
        text: `Yo! Welcome to the AI Health Lab. I'm dialed in for your ${profile.weight || 70}kg goal to cut that side fat. What's the agenda today?`,
        timestamp: Date.now()
      };
      setMessages([initialMsg]);
    }
  };

  const handleSaveChat = () => {
    const jsonString = JSON.stringify(messages, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messmate-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadChat = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.every(m => 'role' in m && 'text' in m)) {
          if (window.confirm("This will overwrite your current chat history. Continue?")) {
             setMessages(parsed);
          }
        } else {
          alert("Invalid chat file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to parse chat file.");
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              AI Health Lab
              <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-white/20 text-gray-200 border border-white/10">
                Beta
              </span>
            </h2>
            <p className="text-gray-400 text-xs">
              Context: {profile.location} • {profile.dietType} • {profile.weight || 70}kg
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
             onClick={() => fileInputRef.current?.click()} 
             className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
             title="Load Chat (JSON)"
          >
            <Upload className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleLoadChat} 
            accept=".json" 
            className="hidden" 
          />
          
          <button 
             onClick={handleSaveChat} 
             className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
             title="Save Chat (JSON)"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
             onClick={handleClearChat} 
             className="text-gray-400 hover:text-red-400 hover:bg-white/10 p-2 rounded-lg transition"
             title="Clear Chat History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Actions / Mode Selectors */}
      <div className="bg-gray-50 p-2 grid grid-cols-3 gap-2 shrink-0 border-b border-gray-200">
        <button
          onClick={() => handleQuickAction('recipe', `I have a budget of ₹50 and a ${profile.cookingSetup}. What high-protein snack can I make?`)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition border ${mode === 'recipe' ? 'bg-orange-100 border-orange-200 text-orange-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}
        >
          <ChefHat className={`w-5 h-5 mb-1 ${mode === 'recipe' ? 'text-orange-600' : 'text-gray-400'}`} />
          Recipe Gen
        </button>
        <button
          onClick={() => handleQuickAction('gym', "My side fat isn't moving. Should I do more cardio or lift heavier?")}
          className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition border ${mode === 'gym' ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}
        >
          <Dumbbell className={`w-5 h-5 mb-1 ${mode === 'gym' ? 'text-blue-600' : 'text-gray-400'}`} />
          Gym Buddy
        </button>
        <button
          onClick={() => handleQuickAction('crisis', "Mess served oily food today. How do I balance my macros?")}
          className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition border ${mode === 'crisis' ? 'bg-red-100 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}
        >
          <AlertTriangle className={`w-5 h-5 mb-1 ${mode === 'crisis' ? 'text-red-600' : 'text-gray-400'}`} />
          Mess Crisis
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`flex max-w-[85%] sm:max-w-[75%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-gray-800'}`}>
                  {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-yellow-400" />}
                </div>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  isUser 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                }`}>
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
           <div className="flex justify-start animate-fade-in">
             <div className="flex max-w-[75%] gap-2">
               <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-yellow-400" />
               </div>
               <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
             <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything... (e.g., 'What to eat with Matki?')"
              className="w-full border border-gray-300 rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
              disabled={loading}
            />
            {input && (
              <button 
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-gray-900 text-white p-3 rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          AI advice can be inaccurate. Always prioritize your health safety.
        </p>
      </div>
    </div>
  );
};