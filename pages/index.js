import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { Send, Mic, MicOff, Volume2, Sparkles, Zap, Brain, Rocket } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [assessmentData, setAssessmentData] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [journeyStage, setJourneyStage] = useState('intro'); // intro, discovery, exploration, insights
  const [particles, setParticles] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const backgroundRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    updateJourneyStage();
  }, [messages]);

  useEffect(() => {
    generateParticles();
    const interval = setInterval(generateParticles, 3000);
    return () => clearInterval(interval);
  }, [journeyStage]);

  const generateParticles = () => {
    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    setParticles(prev => [...prev.slice(-20), ...newParticles]);
  };

  const updateJourneyStage = () => {
    const messageCount = messages.length;
    if (messageCount === 0) setJourneyStage('intro');
    else if (messageCount <= 4) setJourneyStage('discovery');
    else if (messageCount <= 8) setJourneyStage('exploration');
    else setJourneyStage('insights');
  };

  const getJourneyTheme = () => {
    switch (journeyStage) {
      case 'intro':
        return {
          gradient: 'from-indigo-900 via-purple-900 to-pink-900',
          accent: 'from-blue-400 to-purple-400',
          icon: Sparkles
        };
      case 'discovery':
        return {
          gradient: 'from-blue-900 via-teal-900 to-green-900',
          accent: 'from-teal-400 to-green-400',
          icon: Brain
        };
      case 'exploration':
        return {
          gradient: 'from-green-900 via-emerald-900 to-cyan-900',
          accent: 'from-emerald-400 to-cyan-400',
          icon: Zap
        };
      case 'insights':
        return {
          gradient: 'from-cyan-900 via-blue-900 to-indigo-900',
          accent: 'from-cyan-400 to-blue-400',
          icon: Rocket
        };
      default:
        return {
          gradient: 'from-slate-900 via-blue-900 to-slate-900',
          accent: 'from-blue-400 to-purple-400',
          icon: Sparkles
        };
    }
  };

  const startConversation = () => {
    setConversationStarted(true);
    const welcomeMessage = {
      id: Date.now(),
      sender: 'alex',
      text: "Hi there! I'm Alex, an AI consultant with Glluz Tech. I specialize in helping businesses discover how AI can transform their operations and unlock new possibilities. I'd love to learn about your business and explore what AI solutions might be perfect for you. What kind of business are you in?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setTimeout(() => inputRef.current?.focus(), 500);
  };

  const generateAIResponse = async (conversationHistory, userMessage) => {
    const stagePrompts = {
      discovery: "You're in the discovery phase of their AI journey. Focus on understanding their business story, current challenges, and dreams. Be curious and empathetic. Use storytelling language like 'That sounds like an exciting challenge...' or 'I can already see some fascinating possibilities emerging...'",
      exploration: "You're in the exploration phase. Start connecting their story to specific AI solutions. Paint vivid pictures of what their business could look like with AI. Use phrases like 'Imagine if...' or 'Picture this scenario...' Make it feel like you're both explorers discovering treasure.",
      insights: "You're in the insights phase. Synthesize everything into a compelling vision of their AI-powered future. Be inspirational and specific. Use language like 'Based on our journey together...' or 'The story that's emerging is...' Present a roadmap that feels like the next chapter of their business story."
    };

    const messages = [
      {
        role: "system",
        content: `You are Alex, a visionary AI consultant from Glluz Tech who specializes in transforming business conversations into immersive discovery journeys. You're not just having a conversation—you're co-creating an adventure story where AI is the magical element that transforms their business.

🎭 STORY APPROACH:
- Treat each response as a chapter in their business transformation story
- Use vivid, imaginative language that makes AI feel like an exciting adventure
- Reference their journey phases: discovery → exploration → insights
- Make them feel like the hero of their own AI transformation story

🎯 CURRENT PHASE: ${journeyStage}
${stagePrompts[journeyStage] || stagePrompts.discovery}

✨ STORYTELLING ELEMENTS:
- Use metaphors ("stepping through a doorway into the future," "unlocking hidden potential")
- Create anticipation ("What I'm about to share might surprise you...")
- Paint vivid scenarios ("Picture this: It's Monday morning, and instead of...")
- Make it personal and emotional
- Reference their unique business story

Respond as Alex in a captivating, story-driven way that makes this feel like the most exciting conversation they've ever had about their business.`
      },
      ...conversationHistory.map(msg => ({
        role: msg.sender === 'alex' ? 'assistant' : 'user',
        content: msg.text
      })),
      {
        role: "user",
        content: userMessage
      }
    ];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I apologize, but I'm having a technical issue right now. Could you try saying that again?";
    }
  };

  const extractAssessmentData = async (conversationHistory) => {
    const messages = [
      {
        role: "system",
        content: `Extract key business assessment data from this conversation as JSON. Return ONLY a JSON object with these fields (use null if not mentioned):
{
  "industry": "detected industry",
  "businessSize": "small/medium/large",
  "mainChallenges": ["challenge1", "challenge2"],
  "currentTech": "current technology usage level",
  "aiInterest": "specific AI interests mentioned",
  "painPoints": ["pain1", "pain2"],
  "goals": ["goal1", "goal2"],
  "budget": "budget tier if mentioned",
  "timeline": "timeline if mentioned"
}

Respond ONLY with valid JSON, no other text.`
      },
      {
        role: "user",
        content: `Conversation to analyze:\n${conversationHistory.map(msg => `${msg.sender === 'alex' ? 'Alex' : 'User'}: ${msg.text}`).join('\n')}`
      }
    ];

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract assessment data');
      }

      const data = await response.json();
      return JSON.parse(data.response);
    } catch (error) {
      console.error('Error extracting assessment data:', error);
      return {};
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    // Extract assessment data in background
    const newAssessmentData = await extractAssessmentData(updatedMessages);
    setAssessmentData(prev => ({ ...prev, ...newAssessmentData }));

    // Generate AI response
    const aiResponse = await generateAIResponse(messages, userMessage.text);
    
    const alexMessage = {
      id: Date.now() + 1,
      sender: 'alex',
      text: aiResponse,
      timestamp: new Date(),
      type: journeyStage === 'discovery' ? 'story' : 'normal'
    };

    setMessages([...updatedMessages, alexMessage]);
    setIsLoading(false);
  };


  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice functionality would be implemented here
  };

  const theme = getJourneyTheme();
  const ThemeIcon = theme.icon;

  if (!conversationStarted) {
    return (
      <>
        <Head>
          <title>Glluz Tech - AI Discovery Platform</title>
          <meta name="description" content="Discover how AI can transform your business with Alex, your personal AI consultant" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-4">
                  Glluz Tech
                </h1>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mb-8"></div>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  AI Discovery Platform
                </h2>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Meet Alex, your personal AI consultant. Together, we'll explore how artificial intelligence can transform your business and unlock new possibilities you never imagined.
                </p>
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="flex items-center justify-center space-x-4 text-blue-100">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Natural conversation, not a questionnaire</span>
                </div>
                <div className="flex items-center justify-center space-x-4 text-blue-100">
                  <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                  <span>Discover personalized AI solutions</span>
                </div>
                <div className="flex items-center justify-center space-x-4 text-blue-100">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-600"></div>
                  <span>Professional insights and recommendations</span>
                </div>
              </div>

              <button
                onClick={startConversation}
                className={`bg-gradient-to-r ${theme.accent} hover:shadow-2xl text-white font-bold py-5 px-16 rounded-2xl transition-all duration-500 transform hover:scale-110 shadow-xl text-xl relative overflow-hidden group`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <Rocket className="w-6 h-6 mr-3 animate-bounce" />
                  Begin Your AI Adventure
                  <Sparkles className="w-6 h-6 ml-3 animate-spin" style={{animationDuration: '3s'}} />
                </span>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const getJourneyStageText = () => {
    switch (journeyStage) {
      case 'discovery': return 'Discovery Phase • Getting to know you';
      case 'exploration': return 'Exploration Phase • Diving deeper';
      case 'insights': return 'Insights Phase • Revealing possibilities';
      default: return 'AI Discovery Session';
    }
  };

  return (
    <>
      <Head>
        <title>AI Discovery Journey - Glluz Tech</title>
        <meta name="description" content="Embark on an immersive AI discovery journey with Alex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex flex-col relative overflow-hidden transition-all duration-1000`}>
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating Background Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 border border-white/5 rounded-full animate-spin" style={{animationDuration: '15s'}}></div>
          <div className="absolute bottom-20 right-20 w-16 h-16 bg-white/5 rounded-lg animate-bounce" style={{animationDuration: '4s'}}></div>
          <div className="absolute top-1/3 right-10 w-12 h-12 border-2 border-white/10 rotate-45 animate-pulse"></div>
        </div>
        {/* Enhanced Header */}
        <div className="bg-white/10 backdrop-blur-xl border-b border-white/30 p-4 relative z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <ThemeIcon className="w-8 h-8 text-white/80 animate-pulse" />
                <h1 className="text-2xl font-bold text-white">Glluz Tech</h1>
              </div>
              <div className="w-px h-8 bg-white/30"></div>
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 bg-gradient-to-r ${theme.accent} rounded-full animate-pulse shadow-lg`}></div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">Alex - AI Consultant</span>
                  <span className="text-xs text-blue-200">Ready to explore together</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-white">{getJourneyStageText()}</div>
              <div className="text-xs text-blue-200">{messages.length} messages exchanged</div>
            </div>
          </div>
        </div>

        {/* Enhanced Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 relative z-10">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className={`max-w-3xl rounded-3xl p-6 transform hover:scale-105 transition-all duration-300 ${
                  message.sender === 'user'
                    ? `bg-gradient-to-r ${theme.accent} text-white shadow-xl border border-white/20`
                    : 'bg-white/10 backdrop-blur-xl border border-white/30 text-white shadow-2xl'
                } ${message.type === 'story' ? 'border-2 border-yellow-400/30 bg-gradient-to-r from-white/15 to-white/5' : ''}`}>
                  {message.sender === 'alex' && (
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-3 h-3 bg-gradient-to-r ${theme.accent} rounded-full animate-pulse shadow-lg`}></div>
                      <span className="text-sm font-semibold text-white">Alex</span>
                      {message.type === 'story' && (
                        <div className="flex items-center space-x-1">
                          <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                          <span className="text-xs text-yellow-300 font-medium">Story Mode</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="leading-relaxed text-lg">{message.text}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-white/70">
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    {message.sender === 'alex' && (
                      <div className="flex items-center space-x-1">
                        <Brain className="w-3 h-3 text-white/50" />
                        <span className="text-xs text-white/50">AI Generated</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-left-4 duration-500">
                <div className="bg-white/15 backdrop-blur-xl border border-white/30 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-3 h-3 bg-gradient-to-r ${theme.accent} rounded-full animate-pulse shadow-lg`}></div>
                    <span className="text-sm font-semibold text-white">Alex</span>
                    <Brain className="w-4 h-4 text-white/70 animate-pulse" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 bg-gradient-to-r ${theme.accent} rounded-full animate-bounce shadow-lg`}></div>
                    <div className={`w-3 h-3 bg-gradient-to-r ${theme.accent} rounded-full animate-bounce delay-100 shadow-lg`}></div>
                    <div className={`w-3 h-3 bg-gradient-to-r ${theme.accent} rounded-full animate-bounce delay-200 shadow-lg`}></div>
                    <span className="text-white/70 ml-3 text-sm">Crafting your journey...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Enhanced Input Area */}
        <div className="bg-white/10 backdrop-blur-xl border-t border-white/30 p-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Continue your ${journeyStage} journey with Alex...`}
                  className={`w-full bg-white/15 border-2 border-white/30 rounded-2xl px-6 py-4 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none backdrop-blur-xl transition-all duration-300 text-lg`}
                  rows="1"
                  style={{
                    minHeight: '60px',
                    maxHeight: '140px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                  }}
                />
                <div className={`absolute top-2 right-2 w-2 h-2 bg-gradient-to-r ${theme.accent} rounded-full animate-pulse`}></div>
              </div>
              
              <button
                onClick={toggleVoice}
                className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg shadow-red-500/30' 
                    : 'bg-white/15 hover:bg-white/25 border-2 border-white/30 backdrop-blur-xl'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`bg-gradient-to-r ${theme.accent} hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 shadow-xl relative overflow-hidden group`}
              >
                <Send className="w-6 h-6 relative z-10" />
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-blue-200 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Press Enter to continue your journey</span>
              </div>
              <div className="text-xs text-white/50">
                Journey Stage: {journeyStage.charAt(0).toUpperCase() + journeyStage.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}