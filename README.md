 # Glluz Tech - AI Discovery Platform

A sophisticated conversational AI assessment platform where users engage in natural conversations with Alex, an AI consultant, to discover personalized AI solutions for their business.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- OpenAI API Key
- Git

### Local Development

1. **Clone or create the project:**
```bash
mkdir glluz-ai-assessment
cd glluz-ai-assessment
```

2. **Copy all the project files** (package.json, pages/, styles/, etc.) into this directory

3. **Install dependencies:**
```bash
npm install
```

4. **Set up environment variables:**
   - Copy `.env.local` file to your project root
   - Make sure your OpenAI API key is in `.env.local`

5. **Run development server:**
```bash
npm run dev
```

6. **Open your browser** to `http://localhost:3000`

## 🌐 Deploy to Vercel (Recommended)

### Option 1: Deploy from Local Files

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Add environment variables in Vercel dashboard:**
   - Go to your project dashboard
   - Settings → Environment Variables
   - Add: `OPENAI_API_KEY` with your API key

### Option 2: Deploy from GitHub

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository
   - Add environment variable: `OPENAI_API_KEY`
   - Deploy!

## 📁 Project Structure

```
glluz-ai-assessment/
├── pages/
│   ├── index.js          # Main React component
│   ├── _app.js           # App wrapper
│   └── api/
│       ├── chat.js       # OpenAI chat endpoint
│       └── assess.js     # Assessment data extraction
├── styles/
│   └── globals.css       # Global styles with Tailwind
├── package.json          # Dependencies
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
├── next.config.js        # Next.js configuration
├── .env.local           # Environment variables
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key
- `NODE_ENV`: Environment (production/development)

### OpenAI Settings
- Model: GPT-4
- Max tokens: 500 (chat), 300 (assessment)
- Temperature: 0.7 (chat), 0.3 (assessment)

## 🎯 Features

- **Natural Conversation Flow**: Alex engages users in organic dialogue
- **Invisible Assessment**: Data extraction happens in background
- **Real-time Chat**: Modern messaging interface with typing indicators
- **Voice-Ready Interface**: Built for future voice integration
- **Mobile Responsive**: Works on all devices
- **Professional Design**: Glassmorphism UI with Glluz Tech branding

## 🚨 Troubleshooting

### Common Issues

**API Key Error:**
- Check `.env.local` file exists
- Verify OpenAI API key is correct
- Restart development server after adding env vars

**Build Errors:**
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version (requires 18+)

**Deployment Issues:**
- Ensure environment variables are set in Vercel dashboard
- Check build logs for specific errors
- Verify all files are uploaded correctly

### Deployment Checklist

- [ ] All project files copied to directory
- [ ] `npm install` completed successfully
- [ ] `.env.local` file created with API key
- [ ] Local development server works (`npm run dev`)
- [ ] Environment variables added to Vercel dashboard
- [ ] Custom domain configured (optional)

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Keep your OpenAI API key secure
- Set usage limits on your OpenAI account
- Monitor API usage in OpenAI dashboard

## 📈 Scaling

For high-traffic deployment, consider:
- Adding rate limiting
- Implementing user authentication
- Setting up monitoring and analytics
- Optimizing API costs with response caching

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check Vercel deployment logs
4. Ensure OpenAI API key has sufficient credits

## 📄 License

Private project for Glluz Tech.

---

**Ready to launch your AI Discovery Platform!** 🚀

Your users will experience an engaging conversation with Alex that helps them discover the perfect AI solutions for their business needs.