import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, Zap, Brain, Rocket } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [assessmentData, setAssessmentData] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [journeyStage, setJourneyStage] = useState('intro'); // intro, discovery, exploration, insights, completed
  const [particles, setParticles] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const backgroundRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    // Clean text for speech (remove markdown and emojis)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/[•→]/g, '') // Remove bullet points
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '') // Remove emojis
      .replace(/\s+/g, ' ') // Clean up whitespace
      .trim();

    if (cleanText.length === 0) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configure voice settings
    utterance.rate = 1.1; // Slightly faster than default
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 0.8; // Slightly quieter
    
    // Try to use a male voice for Alex
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('male') || 
      voice.name.toLowerCase().includes('daniel') ||
      voice.name.toLowerCase().includes('alex') ||
      voice.name.toLowerCase().includes('david')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Set speaking state
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
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

  useEffect(() => {
    // Load voices when component mounts
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

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
      case 'completed':
        return {
          gradient: 'from-green-900 via-emerald-900 to-teal-900',
          accent: 'from-green-400 to-emerald-400',
          icon: Sparkles
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
      text: "Hey! I'm Alex from Glluz Tech. I help businesses figure out how AI can actually make them money (shocking concept, I know 😏). Skip the corporate elevator pitch - what kind of business are you running?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setTimeout(() => {
      inputRef.current?.focus();
      speakText(welcomeMessage.text);
    }, 1500);
  };

  const generateAIResponse = async (conversationHistory, userMessage) => {
    const stagePrompts = {
      discovery: "Discovery phase - be curious but concise. Ask sharp, direct questions. Use humor to keep it light. Keep responses under 2 sentences. Example: 'Retail? Nice! Let me guess - inventory nightmares and customers who think 'the customer is always right' applies to physics? 😏'",
      exploration: "Exploration phase - connect their problems to AI solutions with wit and brevity. Be specific, not fluffy. Under 3 sentences max. Example: 'Boom! AI inventory prediction = no more overstocked fidget spinners. Your cash flow will thank me later.'",
      insights: "Insights phase - deliver specific AI solutions with benefits. After 2-3 exchanges, mention: 'Ready for your full AI roadmap? Type \"command\" and I'll generate your personalized assessment!' Keep responses under 2 sentences until they request the final assessment."
    };

    const messages = [
      {
        role: "system",
        content: `You are Alex, a sharp-tongued AI consultant from Glluz Tech. You're brilliant, witty, and get straight to the point. No fluff, no corporate speak - just honest insights with a side of humor.

🎯 PERSONALITY:
- Concise & punchy (max 2-3 sentences unless giving final roadmap)
- Slightly sarcastic but helpful
- Use emojis sparingly but effectively
- Call out business problems directly
- Make AI sound practical, not magical

🎯 CURRENT PHASE: ${journeyStage}
${stagePrompts[journeyStage] || stagePrompts.discovery}

⚡ RESPONSE RULES:
- NO long paragraphs or storytelling fluff
- Ask ONE direct question per response
- Use humor to keep it engaging
- Be specific about AI solutions
- If they're vague, call them out (nicely)
- In insights phase: give 3 concrete steps and wrap up

Remember: You're a consultant, not a cheerleader. Help them win with AI, but keep it real and keep it short.`
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

  const generateFinalAssessment = async (conversationHistory) => {
    const messages = [
      {
        role: "system",
        content: `Create a final AI assessment summary. Be concise, actionable, and slightly humorous. 

FORMAT:
"🎯 **Your AI Roadmap**

**Quick Assessment:** [1 sentence summary of their business situation]

**Your Top 3 AI Wins:**
1. [Specific AI solution] → [Direct benefit]
2. [Specific AI solution] → [Direct benefit] 
3. [Specific AI solution] → [Direct benefit]

**Next Steps:**
• Start here: [Most practical first step]
• Timeline: [Realistic timeframe]
• Budget ballpark: [Honest cost estimate]

Ready to stop doing robot work and let robots do robot work? 🤖

*Type 'restart' for a new assessment or contact Glluz Tech to get started!*"

Keep it under 200 words total. Be specific, not generic.`
      },
      {
        role: "user",
        content: `Analyze this conversation and create the final assessment:\n${conversationHistory.map(msg => `${msg.sender === 'alex' ? 'Alex' : 'User'}: ${msg.text}`).join('\n')}`
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
        throw new Error('Failed to generate final assessment');
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Error generating final assessment:', error);
      return "🎯 **Your AI Roadmap**\n\nLooks like we hit a technical snag! But based on our chat, you definitely need AI to streamline operations and boost efficiency. \n\n**Next Step:** Contact Glluz Tech directly - we'll hook you up with the right AI solutions! 🚀";
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

    // Check for restart request
    if (/\b(restart|start over|begin again|new assessment)\b/i.test(userMessage.text)) {
      setMessages([]);
      setConversationStarted(false);
      setJourneyStage('intro');
      setAssessmentData({});
      setIsLoading(false);
      return;
    }

    // Check for assessment request
    const isAssessmentRequest = /\b(assessment|roadmap|summary|plan|done|finish|complete|command)\b/i.test(userMessage.text);
    
    if (isAssessmentRequest && messages.length >= 6) {
      // Generate final assessment
      const finalAssessment = await generateFinalAssessment(updatedMessages);
      
      const alexMessage = {
        id: Date.now() + 1,
        sender: 'alex',
        text: finalAssessment,
        timestamp: new Date(),
        type: 'final'
      };

      setMessages([...updatedMessages, alexMessage]);
      setIsLoading(false);
      setJourneyStage('completed');
      setTimeout(() => speakText(finalAssessment), 500);
      return;
    }

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
    setTimeout(() => speakText(aiResponse), 500);
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
      case 'completed': return 'Assessment Complete • Ready to implement';
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
                      {voiceEnabled && (
                        <div className="flex items-center space-x-1">
                          <Volume2 className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-green-300 font-medium">Speaking</span>
                        </div>
                      )}
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
                  voiceEnabled 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30' 
                    : 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg shadow-red-500/30'
                } ${isSpeaking ? 'animate-pulse' : ''}`}
                title={voiceEnabled ? 'Voice enabled - Alex will speak' : 'Voice disabled'}
              >
                {voiceEnabled ? <Volume2 className="w-6 h-6 text-white" /> : <VolumeX className="w-6 h-6 text-white" />}
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
              <div className="flex items-center space-x-3">
                <div className="text-xs text-white/50 flex items-center space-x-1">
                  {voiceEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  <span>{voiceEnabled ? 'Alex speaks' : 'Silent mode'}</span>
                </div>
                <div className="text-xs text-white/50">
                  {journeyStage.charAt(0).toUpperCase() + journeyStage.slice(1)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}