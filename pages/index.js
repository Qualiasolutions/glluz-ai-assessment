import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, VolumeX, Sparkles, Zap, Brain, Rocket, Star, Layers, Cpu } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [assessmentData, setAssessmentData] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [journeyStage, setJourneyStage] = useState('intro'); // intro, discovery, exploration, insights, completed
  const [particles, setParticles] = useState([]);
  const [audioWaveform, setAudioWaveform] = useState(Array(32).fill(0));
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyzerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeAudioVisualization = () => {
    if (!audioContextRef.current && window.AudioContext) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 64;
      
      // Create oscillator for simulated audio visualization during speech
      const oscillator = audioContextRef.current.createOscillator();
      oscillator.connect(analyzerRef.current);
      analyzerRef.current.connect(audioContextRef.current.destination);
      
      // Start audio visualization animation
      const animateWaveform = () => {
        if (isSpeaking) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          // Simulate speech waveform with random values during speaking
          const simulatedData = Array(32).fill(0).map(() => 
            Math.random() * 100 + (Math.sin(Date.now() * 0.01) * 50 + 50)
          );
          setAudioWaveform(simulatedData);
        } else {
          // Gentle ambient waveform when not speaking
          const ambientData = Array(32).fill(0).map((_, i) => 
            Math.sin(Date.now() * 0.001 + i * 0.5) * 10 + 15
          );
          setAudioWaveform(ambientData);
        }
        requestAnimationFrame(animateWaveform);
      };
      animateWaveform();
    }
  };

  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    // Initialize audio visualization
    initializeAudioVisualization();
    
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
    
    // Use the pre-selected best voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`🎤 Alex speaking with: ${selectedVoice.name} (${selectedVoice.lang})`);
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

  const testVoice = () => {
    if (selectedVoice) {
      speakText("Hey! This is Alex with the new voice. Pretty cool, right?");
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
    const loadVoices = () => {
      if (window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Auto-select best voice if none selected
        if (!selectedVoice && voices.length > 0) {
          const bestVoice = findBestVoice(voices);
          setSelectedVoice(bestVoice);
        }
      }
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  useEffect(() => {
    // Initialize audio visualization once on mount
    initializeAudioVisualization();
  }, []);

  const findBestVoice = (voices) => {
    console.log('🎤 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Priority patterns for cool, high-quality voices
    const voiceRankings = [
      // Tier 1: Premium/Neural voices (highest quality)
      { pattern: /neural|enhanced|premium|natural|edge/i, score: 100 },
      
      // Tier 2: Cool male names
      { pattern: /alex|daniel|david|ryan|mark|tom|james|chris|mike|aaron|ben|jack|max/i, score: 90 },
      
      // Tier 3: Cool female names (often higher quality than male defaults)
      { pattern: /samantha|victoria|kate|zoe|emma|sarah|emily|anna|ava|claire|grace/i, score: 85 },
      
      // Tier 4: International cool names
      { pattern: /arthur|pierre|hans|carlos|antonio|giovanni|diego|luis|olivier/i, score: 80 },
      
      // Tier 5: Quality indicators
      { pattern: /compact|hd|high|quality/i, score: 75 },
      
      // Tier 6: Avoid robotic/bad voices
      { pattern: /google|robot|microsoft.*desktop/i, score: -50 }
    ];
    
    let bestVoice = null;
    let bestScore = -100;
    
    voices.forEach(voice => {
      let score = 0;
      
      // Apply pattern scoring
      voiceRankings.forEach(ranking => {
        if (ranking.pattern.test(voice.name)) {
          score += ranking.score;
        }
      });
      
      // Bonus for non-default voices
      if (!voice.default) score += 20;
      
      // Bonus for English variants
      if (voice.lang.startsWith('en')) score += 30;
      if (voice.lang === 'en-US') score += 10;
      
      // Track the best voice
      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    });
    
    console.log(`🎤 Selected voice: ${bestVoice?.name} (${bestVoice?.lang}) - Score: ${bestScore}`);
    return bestVoice || voices[0];
  };

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
        
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
          {/* Premium floating elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
                animate={{
                  x: [Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200)],
                  y: [Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800), Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800)],
                  scale: [0.5, 1.5, 0.5],
                  opacity: [0.2, 0.8, 0.2]
                }}
                transition={{
                  duration: 20 + Math.random() * 20,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 2
                }}
                style={{
                  left: Math.random() * 100 + '%',
                  top: Math.random() * 100 + '%'
                }}
              />
            ))}
          </div>
          
          {/* Geometric background patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-32 h-32 border border-blue-400/30 rounded-full animate-pulse" style={{animationDuration: '8s'}}></div>
            <div className="absolute bottom-32 right-32 w-24 h-24 border-2 border-purple-400/30 rotate-45 animate-spin" style={{animationDuration: '12s'}}></div>
            <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg animate-bounce" style={{animationDuration: '6s'}}></div>
          </div>
          
          <motion.div 
            className="max-w-3xl w-full text-center relative z-10"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div 
              className="bg-white/5 backdrop-blur-2xl rounded-[2rem] p-16 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.4)] relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Premium glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5 opacity-60"></div>
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
              <div className="mb-12 relative z-10">
                <motion.div
                  className="flex items-center justify-center mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Cpu className="w-12 h-12 text-blue-400 mr-4 animate-pulse" />
                  <h1 className="text-6xl font-black text-white tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                    Glluz Tech
                  </h1>
                </motion.div>
                
                <motion.div 
                  className="flex items-center justify-center mb-8"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full shadow-lg shadow-blue-400/50"></div>
                  <Star className="w-4 h-4 text-blue-400 mx-4 animate-spin" style={{animationDuration: '4s'}} />
                  <div className="w-32 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent rounded-full shadow-lg shadow-purple-400/50"></div>
                </motion.div>
                
                <motion.h2 
                  className="text-3xl font-bold text-white mb-6 tracking-wide"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  AI Discovery Platform
                </motion.h2>
                
                <motion.p 
                  className="text-xl text-gray-200 mb-8 leading-relaxed max-w-2xl mx-auto font-light"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                >
                  Meet <span className="font-semibold text-blue-300">Alex</span>, your personal AI consultant. Experience premium-grade artificial intelligence as we explore transformative solutions tailored specifically for your business vision.
                </motion.p>
              </div>
              
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, staggerChildren: 0.2 }}
              >
                {[
                  { icon: Brain, text: "Neural conversation flow", color: "blue" },
                  { icon: Layers, text: "Premium AI architecture", color: "purple" },
                  { icon: Zap, text: "Professional-grade insights", color: "cyan" }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 + i * 0.2 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <item.icon className={`w-8 h-8 text-${item.color}-400 mx-auto mb-3 group-hover:animate-pulse`} />
                    <p className="text-gray-200 text-sm font-medium text-center leading-relaxed">
                      {item.text}
                    </p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.button
                onClick={startConversation}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold py-6 px-20 rounded-2xl transition-all duration-500 shadow-[0_16px_32px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.4)] text-xl relative overflow-hidden group border border-white/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="relative z-10 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Rocket className="w-7 h-7 mr-4" />
                  </motion.div>
                  Begin Premium AI Experience
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-7 h-7 ml-4" />
                  </motion.div>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.button>
            </motion.div>
          </motion.div>
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

      <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col relative overflow-hidden transition-all duration-1000`}>
        {/* Premium Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Neural network pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 1200 800">
              <defs>
                <pattern id="neural-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                  <circle cx="50" cy="50" r="1" fill="currentColor" opacity="0.3" />
                  <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                  <line x1="50" y1="50" x2="50" y2="150" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#neural-grid)" className="text-blue-400" />
            </svg>
          </div>
          
          {/* Floating particles with motion */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 shadow-lg"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
              }}
              animate={{
                scale: [0.5, 1.2, 0.5],
                opacity: [0.2, 0.8, 0.2],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay
              }}
            />
          ))}
        </div>
        
        {/* Premium geometric elements */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <motion.div 
            className="absolute top-20 left-20 w-32 h-32 border-2 border-blue-400/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute bottom-32 right-32 w-24 h-24 border-2 border-purple-400/30"
            animate={{ rotate: -360, scale: [1, 1.2, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg"
            animate={{ y: [-20, 20, -20] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        {/* Premium Header */}
        <motion.div 
          className="bg-gray-900/20 backdrop-blur-2xl border-b border-white/10 relative z-10"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Header glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"></div>
          
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-6"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <ThemeIcon className="w-10 h-10 text-blue-400 relative z-10" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Glluz Tech</h1>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                  </div>
                </div>
                
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
                
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full shadow-lg shadow-green-400/50">
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">Alex</div>
                    <div className="text-xs text-gray-300 font-medium">AI Consultant • Online</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="text-right"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-white font-bold text-lg">{getJourneyStageText()}</div>
                <div className="text-sm text-gray-300">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'} • Premium Experience
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Premium Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -50, scale: 0.9 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                >
                  <motion.div 
                    className={`max-w-4xl rounded-[2rem] p-8 relative group ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-blue-600 text-white shadow-[0_20px_40px_rgba(59,130,246,0.3)] border border-white/20'
                        : 'bg-gray-900/30 backdrop-blur-2xl border border-white/10 text-white shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
                    } ${message.type === 'story' ? 'border-2 border-yellow-400/40 bg-gradient-to-br from-yellow-900/20 to-orange-900/20' : ''}`}
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Message glow effect */}
                    <div className="absolute inset-0 rounded-[2rem] opacity-50">
                      {message.sender === 'user' ? (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-[2rem]"></div>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-blue-500/5 rounded-[2rem]"></div>
                      )}
                    </div>
                    
                    {message.sender === 'alex' && (
                      <motion.div 
                        className="flex items-center space-x-4 mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="relative">
                          <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full shadow-lg shadow-green-400/50">
                            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-30"></div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-white">Alex</span>
                        {voiceEnabled && (
                          <div className="flex items-center space-x-3 bg-green-500/20 px-4 py-2 rounded-full border border-green-400/30">
                            <Volume2 className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-green-300 font-medium">Audio</span>
                            {isSpeaking && (
                              <div className="flex items-center space-x-1">
                                {audioWaveform.slice(0, 8).map((height, i) => (
                                  <motion.div
                                    key={i}
                                    className="bg-green-400 rounded-full"
                                    style={{ width: '2px' }}
                                    animate={{ height: Math.max(height / 8, 2) }}
                                    transition={{ duration: 0.1 }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {message.type === 'story' && (
                          <div className="flex items-center space-x-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-400/30">
                            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                            <span className="text-xs text-yellow-300 font-medium">Enhanced Mode</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                    
                    <div className="relative z-10">
                      <p className="leading-relaxed text-lg font-medium">{message.text}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                      <div className="text-sm text-white/60 font-medium">
                        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {message.sender === 'alex' && (
                        <div className="flex items-center space-x-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                          <Brain className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-white/60 font-medium">AI Response</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(0,0,0,0.4)] relative">
                  {/* Loading glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-[2rem]"></div>
                  
                  <div className="flex items-center space-x-4 mb-6 relative z-10">
                    <div className="relative">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-lg shadow-blue-400/50">
                        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-30"></div>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-white">Alex</span>
                    <div className="flex items-center space-x-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                      <Brain className="w-4 h-4 text-blue-400 animate-pulse" />
                      <span className="text-xs text-blue-300 font-medium">Processing</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 relative z-10">
                    <motion.div 
                      className="w-4 h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className="w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div 
                      className="w-4 h-4 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full shadow-lg"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                    />
                    <motion.span 
                      className="text-white/80 ml-4 text-lg font-medium"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Analyzing and crafting response...
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Premium Input Area */}
        <motion.div 
          className="bg-gray-900/20 backdrop-blur-2xl border-t border-white/10 relative z-10"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Input area glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"></div>
          
          <div className="max-w-5xl mx-auto p-8">
            <div className="flex items-end space-x-6">
              <div className="flex-1 relative">
                <motion.textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Continue your premium ${journeyStage} experience with Alex...`}
                  className="w-full bg-gray-900/30 border-2 border-white/20 rounded-2xl px-8 py-6 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 resize-none backdrop-blur-xl transition-all duration-300 text-lg font-medium shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  rows="1"
                  style={{
                    minHeight: '80px',
                    maxHeight: '160px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                  }}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                />
                {/* Input indicator */}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                  <span className="text-xs text-gray-400 font-medium">Premium AI</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-3">
                <motion.button
                  onClick={toggleVoice}
                  className={`p-5 rounded-2xl transition-all duration-300 border-2 relative ${
                    voiceEnabled 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400/50 shadow-[0_8px_32px_rgba(34,197,94,0.3)]' 
                      : 'bg-gradient-to-r from-red-500 to-pink-600 border-red-400/50 shadow-[0_8px_32px_rgba(239,68,68,0.3)]'
                  } ${isSpeaking ? 'animate-pulse scale-110' : ''}`}
                  title={voiceEnabled ? 'Voice enabled - Alex will speak' : 'Voice disabled'}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {voiceEnabled ? <Volume2 className="w-7 h-7 text-white" /> : <VolumeX className="w-7 h-7 text-white" />}
                </motion.button>
                
                {/* Real-time Audio Visualization */}
                {voiceEnabled && (
                  <div className="flex items-end space-x-1 h-8">
                    {audioWaveform.map((height, i) => (
                      <motion.div
                        key={i}
                        className={`bg-gradient-to-t rounded-full ${
                          isSpeaking 
                            ? 'from-green-400 to-emerald-300' 
                            : 'from-blue-400/50 to-purple-400/50'
                        }`}
                        style={{ width: '3px' }}
                        animate={{ 
                          height: Math.max(height / 4, 4),
                          opacity: isSpeaking ? 1 : 0.6 
                        }}
                        transition={{ 
                          duration: 0.1,
                          ease: "easeOut"
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              <motion.button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-5 rounded-2xl transition-all duration-300 shadow-[0_8px_32px_rgba(59,130,246,0.3)] border-2 border-blue-400/50 relative overflow-hidden group"
                whileHover={{ scale: !inputMessage.trim() || isLoading ? 1 : 1.1 }}
                whileTap={{ scale: !inputMessage.trim() || isLoading ? 1 : 0.95 }}
              >
                <Send className="w-7 h-7 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </motion.button>
            </div>
            
            <motion.div 
              className="flex items-center justify-between mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center space-x-3 text-gray-300">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium">Press Enter to send • Shift+Enter for new line</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  {voiceEnabled ? <Volume2 className="w-4 h-4 text-green-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                  <span className="text-xs text-gray-300 font-medium">
                    {voiceEnabled 
                      ? `Voice: ${selectedVoice?.name?.split(' ')[0] || 'Default'}` 
                      : 'Silent Mode'
                    }
                  </span>
                  {voiceEnabled && selectedVoice && (
                    <button 
                      onClick={testVoice}
                      className="text-blue-400 hover:text-blue-300 underline ml-2 text-xs font-medium"
                      title="Test current voice"
                    >
                      Test
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-300 font-medium">
                    {journeyStage.charAt(0).toUpperCase() + journeyStage.slice(1)} Mode
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}