# 🤟 Sign Language Translator - Google Meets Integration

[![Made with Bolt](https://img.shields.io/badge/Made%20with-Bolt-blue)](https://bolt.new)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](https://www.typescriptlang.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands-green)](https://mediapipe.dev/)

> 🏆 **Hackathon Project** - Real-time sign language translator that integrates with Google Meets to convert sign language gestures to text, improving accessibility in video conferencing.

## 🎯 Project Overview

This application provides real-time sign language translation capabilities using computer vision and speech recognition technologies. Built for hackathon submission, it demonstrates the potential for improving accessibility in digital communication platforms.

## ✨ Features

- 🎥 **Live Webcam Feed** - Real-time video capture with hand landmark detection
- 🤲 **Hand Gesture Recognition** - MediaPipe Hands integration for precise gesture tracking
- 🎙️ **Speech-to-Text** - Web Speech API for continuous audio transcription
- 🎨 **Visual Overlay** - Interactive display of detected hand keypoints
- 📱 **Responsive Design** - Modern UI that works across all devices
- ⚡ **Real-time Processing** - Low-latency gesture and speech recognition

## 🏗️ Project Structure

```
sign-language-translator/
├── frontend/          # Next.js application
│   ├── app/          # App router pages
│   ├── components/   # React components
│   └── package.json  # Frontend dependencies
├── backend/          # Future backend services
├── .bolt/           # Bolt.new configuration
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser (Chrome/Edge recommended)
- Camera and microphone permissions

### Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sign-language-translator.git
cd sign-language-translator
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

3. **Run the application**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Hand Detection**: MediaPipe Hands (via CDN)
- **Speech Recognition**: Web Speech API
- **State Management**: React Hooks

### Development Tools
- **TypeScript**: Type safety and better DX
- **ESLint**: Code linting and formatting
- **Autoprefixer**: CSS vendor prefixing

## 🎮 How to Use

1. **Grant Permissions**: Allow camera and microphone access when prompted
2. **Position Hands**: Place your hands in front of the camera
3. **View Detection**: Green lines and red dots show detected hand landmarks
4. **Speak**: Voice will be transcribed in real-time
5. **Monitor Status**: Check the status panels for system health

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| MediaPipe Hands | ✅ | ✅ | ✅ | ✅ |
| Web Speech API | ✅ | ✅ | ⚠️ | ❌ |
| Camera/Mic | ✅ | ✅ | ✅ | ✅ |

**Recommended**: Chrome or Edge for full functionality

## 📋 Week 1 Deliverables ✅

- [x] **Days 1-2**: Repository setup & media access
- [x] **Day 3**: MediaPipe Hands integration  
- [x] **Day 4**: Web Speech API implementation
- [x] **Day 5**: Combined audio/visual processing

## 🔮 Future Roadmap

- 🧠 **Week 2**: Sign language classification model
- 🎯 **Week 3**: Google Meets browser extension
- 🌍 **Week 4**: Multi-language support
- 🤖 **Week 5**: AI-powered gesture learning

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Bolt.new** - For the amazing development platform
- **MediaPipe** - For hand landmark detection
- **Next.js Team** - For the excellent React framework
- **Hackathon Organizers** - For the opportunity to build accessible technology

---

<div align="center">

**Made with ❤️ using [Bolt.new](https://bolt.new)**

*Improving accessibility, one gesture at a time* 🤟

</div> 