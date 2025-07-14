# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Glluz Tech AI Assessment Platform" - a sophisticated conversational AI platform where users engage with Alex, an AI consultant, to discover personalized AI solutions for their business through natural conversation rather than traditional questionnaires.

## Tech Stack & Architecture

- **Framework**: Next.js with React
- **Styling**: Tailwind CSS with glassmorphism design patterns
- **AI Integration**: OpenAI GPT-4 via official SDK
- **Deployment**: Optimized for Vercel platform
- **Environment**: Node.js 18+

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Key Architecture Components

### Frontend Architecture (`pages/index.js`)
- **Single-page application** with two distinct states:
  - Landing page: Professional introduction with glassmorphism UI
  - Chat interface: Real-time conversation with Alex
- **State management**: React hooks managing conversation flow, assessment data, and UI states
- **Dual AI processing**: Simultaneous conversation generation and invisible assessment data extraction

### API Architecture (`pages/api/`)
- **`chat.js`**: OpenAI GPT-4 integration for conversational AI responses
  - Model: GPT-4, 500 max tokens, 0.7 temperature
  - System prompt defines Alex's consultant personality
- **`assess.js`**: Background assessment data extraction
  - Model: GPT-4, 300 max tokens, 0.3 temperature
  - JSON-structured output for business intelligence

### Design System
- **Theme**: Dark gradient background (slate-900 → blue-900 → slate-900)
- **Glassmorphism**: White/10 opacity with backdrop blur and border treatments
- **Typography**: System font stack with professional hierarchy
- **Animations**: Tailwind-based pulse, bounce, and smooth transitions

## Environment Configuration

Required environment variables:
- `OPENAI_API_KEY`: OpenAI API key for GPT-4 access
- `NODE_ENV`: Environment identifier

Environment file: `.env.local` (never commit to version control)

## Core Business Logic

### Conversation Flow
1. **Landing Phase**: Professional introduction with call-to-action
2. **Conversation Initiation**: Alex introduces themselves as AI consultant
3. **Natural Discovery**: Organic conversation without questionnaire feeling
4. **Invisible Assessment**: Background data extraction via separate API call
5. **Continuous Engagement**: Build on previous conversation context

### Assessment Data Structure
```javascript
{
  industry: "detected industry",
  businessSize: "small/medium/large", 
  mainChallenges: ["challenge1", "challenge2"],
  currentTech: "current technology usage level",
  aiInterest: "specific AI interests mentioned",
  painPoints: ["pain1", "pain2"],
  goals: ["goal1", "goal2"],
  budget: "budget tier if mentioned",
  timeline: "timeline if mentioned"
}
```

## Development Patterns

### Component Structure
- Functional components with hooks
- Separation of UI state and business logic
- Real-time message handling with optimistic updates
- Auto-scrolling message container with smooth animations

### API Integration
- Error handling for OpenAI rate limits and authentication
- CORS configuration for cross-origin requests
- Graceful fallbacks for JSON parsing failures
- Usage tracking for cost optimization

### Styling Conventions
- Tailwind utility classes for responsive design
- Custom CSS for scrollbar styling and backdrop effects
- Consistent spacing and typography scale
- Mobile-first responsive breakpoints

## Security & Performance

### Security Measures
- Environment variable protection for API keys
- Input validation for message arrays
- Error message sanitization
- CORS headers configuration

### Performance Optimizations
- Tailwind purge configuration for minimal CSS
- Next.js automatic code splitting
- Image optimization configuration (domains array)
- SWC minification enabled

## Voice Integration Placeholder

The codebase includes UI elements for future voice functionality:
- Microphone toggle button with visual states
- Voice input placeholder in `toggleVoice()` function
- Audio output capability preparation

## Deployment Considerations

### Vercel Deployment
- Automatic builds from `npm run build`
- Environment variables configured in dashboard
- Edge runtime compatibility
- Static optimization for performance

### Monitoring
- OpenAI usage tracking via API responses
- Error logging for debugging
- Performance monitoring recommended for production

## Future Enhancement Areas

- Voice input/output integration
- User authentication and session persistence
- Advanced assessment analytics
- Multi-language support
- Enhanced conversation memory