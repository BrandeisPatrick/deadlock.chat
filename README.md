# 🎯 Deadlock.chat

**A comprehensive web app for analyzing Deadlock match data, hero statistics, and player performance.**

🌐 **Live Site**: [https://www.deadlock.chat](https://www.deadlock.chat)

## ✨ Features

- **🔍 Match Analysis**: Search and analyze individual matches with detailed statistics
- **🦸 Hero Stats**: Comprehensive hero performance analytics with win rates, K/D/A ratios, and meta insights
- **📊 Item Analytics**: Track item usage, effectiveness, and build optimization data
- **👤 Player Search**: Look up player profiles and match history via Steam integration
- **📱 Mobile Responsive**: Fully optimized for mobile and desktop experiences
- **⚡ Real-time Data**: Live data from the official Deadlock API with intelligent caching

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Steam API key (for player search functionality)

### Installation

```bash
# Clone the repository
git clone https://github.com/BrandeisPatrick/deadlock-chat.git
cd deadlock-chat

# Install dependencies
npm install

# Build CSS assets
npm run build-css

# Start development server (using Vercel CLI)
vercel dev
```

### Environment Variables

Create a `.env.local` file or set up environment variables in your deployment:

```env
STEAM_API_KEY=your_steam_api_key_here
```

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Styling**: Tailwind CSS with custom responsive design
- **Charts**: Chart.js for data visualizations
- **API**: Serverless functions (Vercel) with CORS handling
- **Data Sources**:
  - [Deadlock API](https://api.deadlock-api.com) for match/hero data
  - [Steam API](https://steamcommunity.com/dev) for player profiles
- **Hosting**: Vercel with edge functions

## 📁 Project Structure

```
├── api/                    # Serverless API functions
│   ├── deadlock-proxy.mjs  # Deadlock API proxy
│   ├── steam-api.mjs       # Steam API utilities
│   └── steam-user.mjs      # Player profile endpoint
├── public/                 # Static frontend assets
│   ├── js/                 # JavaScript modules
│   │   ├── components/     # UI components
│   │   └── services/       # Data services
│   ├── sections/          # HTML page sections
│   └── styles/           # CSS stylesheets
├── src/                   # Source files for build process
└── vercel.json           # Deployment configuration
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 Found a Bug?
- Check if it\'s already reported in [Issues](https://github.com/BrandeisPatrick/deadlock-chat/issues)
- Create a new issue with detailed reproduction steps

### 💡 Feature Ideas?
- Open a [Feature Request](https://github.com/BrandeisPatrick/deadlock-chat/issues/new)
- Describe the feature and its benefits to users

### 🔧 Want to Code?

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing code style
4. **Test thoroughly** - ensure the app works on mobile and desktop
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to your branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### 🎯 Areas We Need Help With

- **🎨 UI/UX Improvements**: Better mobile experience, accessibility enhancements
- **📊 Data Visualizations**: New chart types, interactive features
- **🔧 Performance**: Optimization, caching improvements
- **🧪 Testing**: Unit tests, integration tests, end-to-end testing
- **📖 Documentation**: Code comments, API documentation, tutorials
- **🌐 Internationalization**: Multi-language support
- **♿ Accessibility**: Screen reader support, keyboard navigation

## 📊 Development Commands

```bash
# Development
npm run build-css          # Build Tailwind CSS (watch mode)
npm run build-css-prod     # Build production CSS (minified)

# Deployment
vercel                     # Deploy preview
vercel --prod             # Deploy to production
```

## 🔧 API Documentation

### Deadlock API
- **Base URL**: `https://api.deadlock-api.com/v1/`
- **Assets**: `https://assets.deadlock-api.com/v2/`
- **Rate Limiting**: 1 request per second (handled automatically)

### Key Endpoints Used
- `/analytics/hero-stats` - Hero performance statistics
- `/analytics/scoreboards/heroes` - Hero leaderboards
- `/matches/{id}/metadata` - Detailed match information
- `/players/{id}/match-history` - Player match history

## 🚦 Roadmap

- [ ] **User Authentication**: Implement secure user login and registration.
- [ ] **Database Integration**: Connect to a database for storing hero and item statistics.
- [ ] **AI Chat Guidance**: Develop an AI-powered chat for in-match item recommendations and strategic advice.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Deadlock Community** for game data and feedback
- **Deadlock API Team** for providing comprehensive game statistics
- **Contributors** who help improve the platform
- **Valve** for creating Deadlock

## 📞 Support

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/BrandeisPatrick/deadlock-chat/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/BrandeisPatrick/deadlock-chat/discussions)
- **📧 Contact**: Open an issue for direct contact

---

**⭐ Star this repo if you find it helpful!**

Made with ❤️ for the Deadlock community