import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Volume2, VolumeX, Settings, User, BarChart3, MessageSquare, ChevronRight, Clock } from 'lucide-react';

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
  const [showInstructions, setShowInstructions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const speakText = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any current speech
    window.speechSynthesis.cancel();
    
    // Clean text for professional speech
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
    
    // Professional voice settings
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 0.9; // Clear volume
    
    // Use the pre-selected professional voice
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`Professional voice: ${selectedVoice.name} (${selectedVoice.lang})`);
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
      speakText("Good day. This is Alex, your AI business consultant. I'm here to help optimize your operations.");
    }
  };

  useEffect(() => {
    scrollToBottom();
    updateJourneyStage();
  }, [messages]);

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

  const findBestVoice = (voices) => {
    console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Priority patterns for professional, high-quality voices
    const voiceRankings = [
      // Tier 1: Premium/Neural voices (highest quality)
      { pattern: /neural|enhanced|premium|natural|edge|professional|business/i, score: 100 },
      
      // Tier 2: Professional male names
      { pattern: /alex|daniel|david|ryan|mark|james|michael|robert|william|thomas/i, score: 90 },
      
      // Tier 3: Professional female names
      { pattern: /samantha|victoria|kate|elizabeth|sarah|emily|anna|claire|susan|helen/i, score: 85 },
      
      // Tier 4: Quality indicators
      { pattern: /compact|hd|high|quality|clear|standard/i, score: 75 },
      
      // Tier 5: Avoid robotic/casual voices
      { pattern: /google|robot|microsoft.*desktop|novelty|funny/i, score: -50 }
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
    
    console.log(`Selected professional voice: ${bestVoice?.name} (${bestVoice?.lang}) - Score: ${bestScore}`);
    return bestVoice || voices[0];
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
          gradient: 'from-slate-50 to-slate-100',
          accent: 'from-blue-600 to-blue-700',
          icon: User
        };
      case 'discovery':
        return {
          gradient: 'from-slate-50 to-slate-100',
          accent: 'from-blue-600 to-blue-700',
          icon: MessageSquare
        };
      case 'exploration':
        return {
          gradient: 'from-slate-50 to-slate-100',
          accent: 'from-blue-600 to-blue-700',
          icon: Settings
        };
      case 'insights':
        return {
          gradient: 'from-slate-50 to-slate-100',
          accent: 'from-blue-600 to-blue-700',
          icon: BarChart3
        };
      case 'completed':
        return {
          gradient: 'from-slate-50 to-slate-100',
          accent: 'from-green-600 to-green-700',
          icon: BarChart3
        };
      default:
        return {
          gradient: 'from-slate-50 to-slate-100',
          accent: 'from-blue-600 to-blue-700',
          icon: User
        };
    }
  };

  const startConversation = () => {
    setConversationStarted(true);
    const welcomeMessage = {
      id: Date.now(),
      sender: 'alex',
      text: "Good day. I'm Alex, your AI business consultant from Glluz Tech. I specialize in identifying strategic AI implementation opportunities that drive measurable ROI for enterprises. To begin our assessment, could you please describe your industry and current business focus?",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    setTimeout(() => {
      inputRef.current?.focus();
      speakText(welcomeMessage.text);
    }, 800);
  };

  const generateAIResponse = async (conversationHistory, userMessage) => {
    const stagePrompts = {
      discovery: "Discovery phase - conduct professional business analysis. Ask strategic questions about their industry, scale, and challenges. Maintain executive-level communication. Keep responses focused and under 3 sentences.",
      exploration: "Exploration phase - analyze their operational challenges and identify AI solution opportunities. Present insights professionally with specific business benefits. Focus on ROI and implementation feasibility.",
      insights: "Insights phase - provide strategic AI recommendations with clear business value propositions. After 2-3 exchanges, offer: 'Would you like me to compile your comprehensive AI strategy roadmap? Simply type \"assessment\" to proceed.' Maintain professional tone throughout."
    };

    const messages = [
      {
        role: "system",
        content: `You are Alex, a senior AI business consultant from Glluz Tech. You are professional, strategic, and focused on delivering measurable business value through AI implementation.

PROFESSIONAL STANDARDS:
- Executive-level communication (no casual language or emojis)
- Concise, strategic responses (2-3 sentences maximum)
- Focus on ROI, efficiency, and competitive advantage
- Ask strategic business questions
- Present solutions with clear value propositions

CURRENT PHASE: ${journeyStage}
${stagePrompts[journeyStage] || stagePrompts.discovery}

RESPONSE GUIDELINES:
- Use professional business terminology
- Ask ONE strategic question per response
- Present AI solutions with quantifiable benefits
- Maintain consultant-to-executive communication style
- Focus on implementation and measurable outcomes

You are conducting a strategic AI assessment for business optimization and competitive advantage.`
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
      return "I apologize for the technical disruption. Please allow me a moment to reconnect and continue our consultation.";
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
        content: `Create a comprehensive AI strategy assessment. Maintain professional business communication throughout.

FORMAT:
"**Strategic AI Implementation Roadmap**

**Business Assessment:** [1-2 sentence summary of their current business situation and AI readiness]

**Recommended AI Solutions:**
1. [Specific AI solution] - [Quantifiable business benefit]
2. [Specific AI solution] - [Quantifiable business benefit]
3. [Specific AI solution] - [Quantifiable business benefit]

**Implementation Strategy:**
• Phase 1: [Most practical first step with timeline]
• Investment Range: [Professional cost estimate]
• Expected ROI: [Realistic timeframe and metrics]

**Next Steps:**
Schedule a detailed consultation with Glluz Tech to begin your AI transformation journey.

*Type 'restart' to conduct a new assessment or contact our team to proceed with implementation.*"

Maintain executive-level communication. Focus on measurable outcomes and strategic value.`
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
      return "**Strategic AI Implementation Roadmap**\n\nWe experienced a technical interruption, but based on our consultation, your organization would benefit significantly from AI implementation to optimize operations and enhance competitive positioning.\n\n**Next Step:** Contact Glluz Tech directly to schedule a comprehensive AI strategy consultation.";
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
    const isAssessmentRequest = /\b(assessment|roadmap|summary|plan|done|finish|complete)\b/i.test(userMessage.text);
    
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
    setTimeout(() => speakText(aiResponse), 300);
  };

  const theme = getJourneyTheme();
  const ThemeIcon = theme.icon;

  if (!conversationStarted) {
    return (
      <>
        <Head>
          <title>Glluz Tech - Enterprise AI Consulting</title>
          <meta name="description" content="Strategic AI implementation consulting for enterprise transformation" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl w-full">
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 lg:px-12 py-6 lg:py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 lg:w-7 lg:h-7 text-blue-600" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Glluz Tech</h1>
                      <p className="text-blue-100 font-medium text-sm lg:text-base">Enterprise AI Consulting</p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 lg:px-4 py-2 border border-white/20">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-white text-xs lg:text-sm font-medium">Alex Available</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="p-6 sm:p-8 lg:p-12">
                <div className="text-center mb-8 lg:mb-12">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
                    Strategic AI Implementation Assessment
                  </h2>
                  <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    Meet Alex, your senior AI business consultant. Receive a comprehensive analysis of AI opportunities 
                    tailored to your industry and operational requirements.
                  </p>
                </div>
                
                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-8 lg:mb-12">
                  <div className="bg-slate-50 rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-slate-200">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <MessageSquare className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-3">Strategic Discovery</h3>
                    <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
                      Comprehensive analysis of your business model, operational challenges, and competitive landscape.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-slate-200">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <Settings className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-3">Solution Architecture</h3>
                    <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
                      Custom AI implementation strategies designed for your specific industry and scale requirements.
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl lg:rounded-2xl p-6 lg:p-8 border border-slate-200 md:col-span-2 lg:col-span-1">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg lg:text-xl font-semibold text-slate-800 mb-3">ROI Assessment</h3>
                    <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
                      Quantifiable impact analysis with projected returns, implementation timelines, and success metrics.
                    </p>
                  </div>
                </div>
                
                {/* CTA Section */}
                <div className="text-center">
                  <button
                    onClick={startConversation}
                    className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 sm:px-12 py-3 sm:py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                  >
                    <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-lg">Begin Strategic Assessment</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  
                  <div className="mt-6 sm:mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
                    <div className="flex items-center justify-center space-x-2 text-slate-500">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Discovery Phase</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-slate-500">
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Solution Design</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-slate-500">
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Impact Analysis</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-slate-500">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Strategic Roadmap</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-slate-50 px-4 sm:px-6 lg:px-12 py-4 lg:py-6 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-slate-500 space-y-2 sm:space-y-0">
                  <div>
                    Estimated consultation time: 10-15 minutes
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Powered by GPT-4</span>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <span>Enterprise Grade</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const getJourneyStageText = () => {
    switch (journeyStage) {
      case 'discovery': return 'Discovery Phase • Business Analysis';
      case 'exploration': return 'Exploration Phase • Solution Architecture';
      case 'insights': return 'Insights Phase • Strategic Recommendations';
      case 'completed': return 'Assessment Complete • Implementation Ready';
      default: return 'Strategic AI Consultation';
    }
  };

  const getJourneyProgress = () => {
    const phases = ['discovery', 'exploration', 'insights', 'completed'];
    const currentIndex = phases.indexOf(journeyStage);
    return Math.max(0, ((currentIndex + 1) / phases.length) * 100);
  };

  const getPhaseInfo = () => {
    const phases = {
      discovery: {
        title: "Discovery Phase",
        description: "Business and operational analysis",
        tips: ["Specify your industry and business model", "Describe operational challenges", "Mention current technology infrastructure"],
        icon: MessageSquare,
        color: "blue"
      },
      exploration: {
        title: "Exploration Phase", 
        description: "Solution architecture and planning",
        tips: ["Detail specific pain points", "Discuss scalability requirements", "Share implementation timeline preferences"],
        icon: Settings,
        color: "blue"
      },
      insights: {
        title: "Insights Phase",
        description: "Strategic recommendations and ROI analysis", 
        tips: ["Ask clarifying questions", "Request specific use cases", "Type 'assessment' for comprehensive roadmap"],
        icon: BarChart3,
        color: "blue"
      },
      completed: {
        title: "Assessment Complete",
        description: "Strategic implementation roadmap ready",
        tips: ["Review recommendations", "Schedule implementation consultation", "Type 'restart' for new assessment"],
        icon: User,
        color: "green"
      }
    };
    return phases[journeyStage] || phases.discovery;
  };

  return (
    <>
      <Head>
        <title>Strategic AI Consultation - Glluz Tech</title>
        <meta name="description" content="Enterprise AI implementation strategy with Alex, senior business consultant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        {/* Professional Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <ThemeIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Glluz Tech</h1>
                    <div className="text-xs sm:text-sm text-slate-500 font-medium">Enterprise AI Consulting</div>
                  </div>
                </div>
                
                <div className="w-px h-10 sm:h-12 bg-slate-200 hidden sm:block"></div>
                
                <div className="flex items-center space-x-2 sm:space-x-4 hidden sm:flex">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-slate-800 font-semibold text-sm sm:text-base">Alex</div>
                    <div className="text-xs text-slate-500 font-medium">Senior AI Consultant</div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-slate-800 font-semibold text-sm sm:text-base">{getJourneyStageText()}</div>
                <div className="text-xs sm:text-sm text-slate-500">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'} • Professional Session
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Progress Panel */}
        <div className="bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              {/* Journey Progress */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="relative">
                      {(() => {
                        const phaseInfo = getPhaseInfo();
                        const PhaseIcon = phaseInfo.icon;
                        return <PhaseIcon className={`w-4 h-4 sm:w-6 sm:h-6 text-${phaseInfo.color}-600`} />;
                      })()}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-slate-800 font-semibold text-sm">{getPhaseInfo().title}</div>
                      <div className="text-xs text-slate-500">{getPhaseInfo().description}</div>
                    </div>
                    <div className="w-px h-6 sm:h-8 bg-slate-200 hidden sm:block"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 sm:w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full bg-gradient-to-r from-${getPhaseInfo().color}-500 to-${getPhaseInfo().color}-600 rounded-full`}
                          animate={{ width: `${getJourneyProgress()}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 font-medium">{Math.round(getJourneyProgress())}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-3 transition-all duration-300 group shadow-sm"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 group-hover:text-slate-700" />
                </button>
              </div>
            </div>

            {/* Expandable Instruction Cards */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Current Phase Tips */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <h3 className="text-slate-800 font-semibold text-sm sm:text-base">Phase Guidelines</h3>
                    </div>
                    <div className="space-y-2">
                      {getPhaseInfo().tips.map((tip, i) => (
                        <div key={i} className="flex items-start space-x-2">
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-600 text-xs sm:text-sm">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Journey Overview */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-4">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <h3 className="text-slate-800 font-semibold text-sm sm:text-base">Assessment Flow</h3>
                    </div>
                    <div className="space-y-3">
                      {['Discovery', 'Exploration', 'Insights', 'Complete'].map((phase, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${i <= ['discovery', 'exploration', 'insights', 'completed'].indexOf(journeyStage) ? 'bg-green-500' : 'bg-slate-300'}`} />
                          <span className={`text-xs sm:text-sm ${i <= ['discovery', 'exploration', 'insights', 'completed'].indexOf(journeyStage) ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                            {phase}
                          </span>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">3-5 min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Professional Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.05,
                    ease: "easeOut"
                  }}
                >
                  <div 
                    className={`max-w-full sm:max-w-4xl rounded-xl sm:rounded-2xl p-4 sm:p-6 ${message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
                    }`}
                  >
                    {message.sender === 'alex' && (
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                          <span className="font-semibold text-slate-800 text-sm sm:text-base">Alex</span>
                          <span className="text-xs text-slate-500 hidden sm:inline">Senior AI Consultant</span>
                          {voiceEnabled && (
                            <div className="flex items-center space-x-2 bg-green-50 px-2 sm:px-3 py-1 rounded-full border border-green-200">
                              <Volume2 className="w-3 h-3 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">Audio Enabled</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="relative">
                      <p className="leading-relaxed text-sm sm:text-base">{message.text}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500">
                        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      {message.sender === 'alex' && (
                        <div className="flex items-center space-x-2 bg-slate-50 px-2 sm:px-3 py-1 rounded-full border border-slate-200">
                          <BarChart3 className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-slate-600 font-medium hidden sm:inline">AI Analysis</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm max-w-full sm:max-w-4xl">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-semibold text-slate-800 text-sm sm:text-base">Alex</span>
                      <div className="flex items-center space-x-2 bg-blue-50 px-2 sm:px-3 py-1 rounded-full border border-blue-200">
                        <BarChart3 className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Analyzing</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <motion.div 
                      className="w-2 h-2 bg-blue-600 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-blue-600 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div 
                      className="w-2 h-2 bg-blue-600 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                    />
                    <span className="text-slate-600 ml-3 text-xs sm:text-sm">Processing your request...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Professional Input Area */}
        <div className="bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-end space-x-2 sm:space-x-4">
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
                  placeholder={`Continue your strategic ${journeyStage} consultation with Alex...`}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-300 text-sm sm:text-base"
                  rows="1"
                  style={{
                    minHeight: '50px',
                    maxHeight: '120px'
                  }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">Professional AI</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={toggleVoice}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-300 border-2 ${
                    voiceEnabled 
                      ? 'bg-green-500 border-green-400 text-white shadow-lg' 
                      : 'bg-slate-200 border-slate-300 text-slate-500'
                  }`}
                  title={voiceEnabled ? 'Voice enabled - Alex will speak' : 'Voice disabled'}
                >
                  {voiceEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 sm:p-3 rounded-xl transition-all duration-300 shadow-lg border border-blue-500"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 space-y-3 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-slate-500">
                <div className="flex items-center space-x-2">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Press Enter to send • Shift+Enter for new line</span>
                </div>
                
                {journeyStage !== 'completed' && (
                  <div className="flex items-center space-x-2 bg-blue-50 px-2 sm:px-3 py-1 rounded-full border border-blue-200">
                    <span className="text-xs text-blue-600 font-medium">
                      {journeyStage === 'discovery' && "Provide specific industry and business details"}
                      {journeyStage === 'exploration' && "Share operational challenges and requirements"}
                      {journeyStage === 'insights' && "Type 'assessment' for comprehensive roadmap"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2 bg-slate-50 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-slate-200">
                  {voiceEnabled ? <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" /> : <VolumeX className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />}
                  <span className="text-xs text-slate-600 font-medium">
                    {voiceEnabled 
                      ? `Voice: ${selectedVoice?.name?.split(' ')[0] || 'Default'}` 
                      : 'Silent Mode'
                    }
                  </span>
                  {voiceEnabled && selectedVoice && (
                    <button 
                      onClick={testVoice}
                      className="text-blue-600 hover:text-blue-700 underline ml-2 text-xs font-medium hidden sm:inline"
                      title="Test current voice"
                    >
                      Test
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2 bg-slate-50 px-2 sm:px-3 py-1 sm:py-2 rounded-full border border-slate-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-slate-600 font-medium">
                    {journeyStage.charAt(0).toUpperCase() + journeyStage.slice(1)} Phase
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}