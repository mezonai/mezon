<div align="center">
  <h1>Mezon</h1>
  
  <p align="center">
    <strong>The Live, Work, and Play Platform – the best Discord alternative.</strong>
  </p>

  <p align="center">
    <a href="https://github.com/mezonai/mezon/releases"><img src="https://img.shields.io/github/v/release/mezonai/mezon?style=flat-square" alt="Latest Release"></a>
    <a href="#-license--legal"><img src="https://img.shields.io/github/license/mezonai/mezon?style=flat-square" alt="License"></a>
    <a href="https://github.com/mezonai/mezon/stargazers"><img src="https://img.shields.io/github/stars/mezonai/mezon?style=flat-square" alt="GitHub Stars"></a>
    <a href="https://github.com/mezonai/mezon/issues"><img src="https://img.shields.io/github/issues/mezonai/mezon?style=flat-square" alt="Issues"></a>
    <a href="https://github.com/mezonai/mezon/network/members"><img src="https://img.shields.io/github/forks/mezonai/mezon?style=flat-square" alt="Forks"></a>
  </p>

  <p align="center">
    <a href="https://mezon.ai"><img src="https://img.shields.io/badge/Try%20Live-mezon.ai-blue?style=flat-square" alt="Try Live"></a>
    <a href="https://mezon.ai/invite/1840696977034055680"><img src="https://img.shields.io/badge/Join-Community-purple?style=flat-square" alt="Join Community"></a>
    <a href="#contributing"><img src="https://img.shields.io/badge/Contributions-Welcome-green?style=flat-square" alt="Contributions Welcome"></a>
  </p>
</div>

---

## Mezon Bug Report Community

[Mezon Bug Report Community](https://mezon.ai/invite/1840696977034055680)

## High-performance, lightweight alternative to Discord

Mezon is a Live, Work, and Play platform. It’s perfect for gaming and chilling with friends, or even building a global community. Customize your own space to talk, play, and hang out. Mezon also delivers enterprise-grade performance with sub-millisecond response times and support for millions of concurrent connections.

That performance comes from owning the hot path end to end — a C WebRTC SFU, a C11 native media engine, IO Uring and a binary data plane — instead of stacking generic HTTP and WebRTC middleware.
<div align="center">
  <img width="851" height="315" alt="Mezon Platform Overview" src="https://github.com/user-attachments/assets/0cbc29c7-b8eb-4810-9e88-9efa88e7b43d" />
</div>

### ✨ Key Features

-   **🔒 Security First** - End-to-end encryption, XSS protection, zero-knowledge architecture
-   **⚡ High Performance** - Native C path: [mezon-sfu](https://github.com/mezonai/mezon-sfu) + [libmezia](https://github.com/mezonai/libmezia) + mezon-proto-server (io uring). Sub-millisecond responses, millions of concurrent connections
-   **🌐 Cross-Platform** - Web, Desktop (Windows/macOS/Linux), Mobile (iOS/Android)
-   **🤖 AI-Powered** - Built-in content moderation, real-time translation, meeting summaries
-   **🔧 Extensible** - Custom bots, 100+ integrations, API-first design
-   **💰 Creator Economy** - Built-in monetization, premium memberships, token rewards

### 🎯 Use Cases

| Use Case               | Features                                             |
| ---------------------- | ---------------------------------------------------- |
| **Gaming Communities** | Voice chat, tournaments, streaming integration       |
| **Professional Teams** | Channels, file sharing, integrations, meeting tools  |
| **Content Creators**   | Monetization tools, community building, analytics    |
| **Personal Groups**    | Private spaces, family connections, secure messaging |

---

## 🚀 Quick Start

### For Users

1. **Web App**: Visit [mezon.ai](https://mezon.ai) - no installation required
2. **Desktop**: Download from [mezon-desktop releases](https://github.com/mezonai/mezon-desktop) for Windows, macOS, or Linux
3. **Mobile**: Get the app from [App Store](https://apps.apple.com/vn/app/mezon/id6502750046) or [Google Play](https://play.google.com/store/apps/details?id=com.mezon.mobile&pli=1)

### For Developers

This repository is the **web** client (Nx/React monorepo). Native clients live in separate repos:

-   [mezon-desktop](https://github.com/mezonai/mezon-desktop) — Rust/GPUI desktop app
-   [mezon-ios](https://github.com/mezonai/mezon-ios) — native iOS app
-   [mezon-android](https://github.com/mezonai/mezon-android) — native Android app

```bash
# Clone the web repository
git clone https://github.com/mezonai/mezon.git
cd mezon

# Install dependencies
yarn install

# Start development server
yarn dev:chat
```

The application will be available at http://localhost:4200/

> 📖 **Need help?** Check out our [Developer Guide](docs/developer/SETUP.md) for detailed setup instructions.

---

## 🌟 Core Features

### 💬 Communication

-   **Rich Text Messaging** - Markdown support, threads, reactions, file sharing up to 500MB
-   **Voice & Video** - Crystal-clear HD calls supporting up to 1000 users
-   **Screen Sharing** - Built-in recording and streaming capabilities

### 🛡️ Security & Privacy

-   **End-to-End Encryption** - All messages, voice, and video communications
-   **Zero-Knowledge Architecture** - Client-side encryption, secure binary sockets
-   **XSS Protection** - Safe message rendering and content validation

### 🎯 Organization & Management

-   **Advanced Permissions** - Custom roles with granular permission controls
-   **Smart Notifications** - AI-powered filtering and priority management
-   **Event Scheduling** - Built-in calendar with RSVP system

### 🤖 AI-Powered Features

-   **Content Moderation** - Automated safety and community management
-   **Real-time Translation** - Support for 100+ languages
-   **Meeting Intelligence** - Auto-generated summaries and transcription

### 🔧 Integration & Extensibility

-   **API-First Design** - Comprehensive REST and WebSocket APIs
-   **Bot Framework** - Extensible platform with SDK support
-   **Third-party Integrations** - 100+ tools and custom webhooks

---

## 📦 Installation

### System Requirements

| Platform              | Requirements                                                   |
| --------------------- | -------------------------------------------------------------- |
| **Web**               | Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) |
| **Desktop**           | Windows 10+, macOS 10.15+, Ubuntu 18.04+                       |
| **Mobile**            | iOS 13.0+, Android 8.0+ (API level 26+)                        |
| **Development (web)** | Node.js 18+, Yarn 1.22.4+, 4GB RAM minimum                     |

### Source code

| Platform / layer | Git Repo | Status |
| ---------------- | -------- | ------ |
| **Desktop** | [Desktop repo](https://github.com/mezonai/mezon-desktop) | ✅ Stable |
| **iOS** | [iOS repo](https://github.com/mezonai/mezon-ios) | ✅ Stable |
| **Android** | [Android repo](https://github.com/mezonai/mezon-android) | ✅ Stable |
| **Web** | [Web repo](https://github.com/mezonai/mezon) | ✅ Stable |
| **SFU** | [mezon-sfu](https://github.com/mezonai/mezon-sfu) | ✅ Stable |
| **Media engine** | [libmezia](https://github.com/mezonai/libmezia) | 🚧 Active |
| **Protocol** | [mezon-protocol](https://github.com/mezonai/mezon-protocol) | ✅ Stable |

### Download Options

| Platform    | Download Link                                                                 | Status    |
| ----------- | ----------------------------------------------------------------------------- | --------- |
| **Windows** | [Download](https://apps.microsoft.com/detail/9pf25lf1fj17)                    | ✅ Stable |
| **macOS**   | [Download](https://apps.apple.com/vn/app/mezon-desktop/id6756601798)          | ✅ Stable |
| **Linux**   | [Download](https://cdn.komu.vn/mezon/release/latest/mezon_2.0.16_amd64.deb)   | ✅ Stable |
| **iOS**     | [App Store](https://apps.apple.com/vn/app/mezon/id6502750046)                 | ✅ Stable |
| **Android** | [Google Play](https://play.google.com/store/apps/details?id=com.mezon.mobile) | ✅ Stable |
| **Web**     | [mezon.ai](https://mezon.ai)                                                  | ✅ Stable |

---

## 👨‍💻 Development

### 🛠️ Development Setup

```bash
# Clone the web repository
git clone https://github.com/mezonai/mezon.git
cd mezon

# Install dependencies
yarn install

# Available development commands
yarn dev:chat          # Start chat app (port 4200)
yarn dev:admin         # Start admin dashboard (port 4200)

# Build for production
yarn build:chat        # Build web chat app

# Code quality
yarn lint              # Run linting
yarn format           # Format code
```

For native clients, follow the setup guides in [mezon-desktop](https://github.com/mezonai/mezon-desktop), [mezon-ios](https://github.com/mezonai/mezon-ios), and [mezon-android](https://github.com/mezonai/mezon-android).

### Local Development Setup Guide

#### 1. Install Dependencies

Open your terminal in the project's root directory and run the following command to install the necessary packages:

```bash
yarn install
```

#### 2. Retrieve Authentication Data from Production (mezon.ai)

To access protected data and features on your local machine, you need to copy your session tokens from the production environment:

1. Navigate to: [https://mezon.ai](https://mezon.ai)
2. **Log in** with your credentials.
3. Open **Developer Tools** (Press `F12` or `Right-click > Inspect`).
4. Go to the **Application** tab.
5. In the left sidebar, expand **Local Storage** and select `https://mezon.ai`.
6. Locate and **copy** the values for the following keys:

-   `persist:auth`
-   `mezon_session`

#### 3. Configure Localhost Storage

Once your local server is running (typically at `http://localhost:4200`):

1. Open your **Localhost** URL in the browser.
2. Open **Developer Tools** (`F12`) > **Application** tab > **Local Storage**.
3. Manually add or edit the keys `persist:auth` and `mezon_session`.
4. **Paste** the corresponding values you copied from mezon.ai into the **Value** column.

#### 4. Finalize

Refresh your local browser tab to apply the authentication state:

-   Press **F5** or **Cmd/Ctrl + R**.

You should now be logged into the local environment with your mezon.ai session active.

---

### 📁 Project Structure

```
mezon/
├── apps/              # Applications
│   ├── chat/          # Main web chat application
│   ├── admin/         # Admin dashboard
│   └── discover/      # Community discovery app
├── libs/              # Shared libraries
│   ├── components/    # Reusable UI components
│   ├── store/         # State management (Redux)
│   ├── transport/     # API & WebSocket clients
│   ├── core/          # Business logic
│   └── ui/            # Design system
└── docs/              # Documentation
```

### 🔧 Technology Stack

#### Frontend

-   **Framework**: React 18 with TypeScript
-   **State Management**: Redux Toolkit + RTK Query
-   **Styling**: Tailwind CSS
-   **Build Tool**: Nx Monorepo with Webpack
-   **iOS** (separate repo): Native Swift client — [mezon-ios](https://github.com/mezonai/mezon-ios)
-   **Android** (separate repo): Native Kotlin client — [mezon-android](https://github.com/mezonai/mezon-android)
-   **Desktop** (separate repo): Native Rust/GPUI client — [mezon-desktop](https://github.com/mezonai/mezon-desktop)

#### Backend & Infrastructure

Mezon owns the hot path in C so chat, voice, and data stay off generic HTTP/WebRTC stacks.

-   **Core**: Custom real-time server on Valkey, ScyllaDB, and `io_uring`
-   **[mezon-sfu](https://github.com/mezonai/mezon-sfu)**: C WebRTC SFU for HD meetings and large rooms — lock-free per-room workers, zero-copy `io_uring` fan-out, DTLS/SRTP, VP9/AV1/VP8, TWCC/GCC + SVC
-   **[libmezia](https://github.com/mezonai/libmezia)** (native media engine): C11 client engine, wire-compatible with mezon-sfu — lock-minimal Opus voice (~24 kbit/s) and hardware H.264, no PeerConnection tax on mobile
-   **mezon-proto-server**: Binary Mezon-Proto over raw QUIC — C data plane (L1 process cache + Valkey), Go control plane over Unix sockets. Schemas: [mezon-protocol](https://github.com/mezonai/mezon-protocol)
-   **Mezon Mainnet**: [mmn](https://github.com/mezonai/mmn) — high-performance, zero-fee L1
-   **Real-time**: WebSocket / TCP Abridged with binary payload; Mezon-Proto for the high-QPS data path
-   **Security**: E2E encryption, TLS 1.3 (SFU: DTLS + SRTP)
-   **Performance**: Sub-millisecond latency, millions of concurrent connections, horizontal scaling

### Why this stack is fast

| Layer | Component | What it avoids |
| ----- | --------- | -------------- |
| Voice / video | **mezon-sfu** | Shared-state mutexes and copy-heavy fan-out. Each room is an isolated thread; packets are referenced, not copied, through `io_uring` (`recv` + `SEND_ZC`). |
| Native clients | **libmezia** | A full WebRTC `PeerConnection` tree on iOS/Android. Same SDP/RTP subset the SFU already speaks; no extra packet format, no steady-state heap on the audio path. |
| Chat / data | **mezon-proto-server** | Nginx + HTTP header parsing + TCP head-of-line blocking. Raw QUIC + protobuf; CPU moves bytes. Complex work stays on Go over a Unix socket. |

#### Development Tools

-   **Testing**: Jest + Cypress
-   **Linting**: ESLint + Prettier
-   **CI/CD**: GitHub Actions
-   **Package Manager**: Yarn

### 📚 Getting Started

1. **Setup**: Follow the [Developer Guide](docs/developer/SETUP.md) for detailed setup instructions
2. **Architecture**: Review [Architecture docs](docs/developer/ARCHITECTURE.md) to understand the system
3. **Contribute**: Browse [open issues](https://github.com/mezonai/mezon/issues) for contribution opportunities
4. **Community**: Join our [developer community](https://mezon.ai/invite/1840696977034055680) for support and discussions

### 🔌 Extensibility

**Bot Development**

-   Build powerful bots using our official SDKs
-   Automate workflows and community management
-   Access comprehensive APIs for custom integrations

**Custom Themes**

-   Create custom themes and UI modifications
-   Brand customization for communities
-   Personalized user interfaces

**API Integration**

-   REST API and WebSocket support
-   Custom webhooks and third-party integrations
-   Extensive documentation and examples

> 🔗 **Resources**: [Bot Example](https://github.com/mezonai/mezon-bot-example) | [SDK Documentation](https://mezon.ai/docs/developer/mezon-sdk)

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

-   🐛 **Report Bugs**: Use our [issue tracker](https://github.com/mezonai/mezon/issues)
-   💡 **Feature Requests**: Suggest new features and improvements
-   💻 **Code Contributions**: Submit pull requests for bug fixes and features
-   📚 **Documentation**: Help improve our docs and guides
-   🌍 **Translation**: Help translate Mezon to more languages

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`yarn test`)
5. Submit a pull request

> 📋 **Guidelines**: Please read our [Contributing Guide](DEVELOPMENT.md#contributing) for detailed information about our development process, coding standards, and pull request guidelines.

---

## 📚 Resources & Documentation

### 🚀 For Users

-   [**Web App**](https://mezon.ai/chat/direct/friends) - Try Mezon instantly
-   [**Community Directory**](https://mezon.ai/clans/) - Discover communities
-   [**Bot/App store**](https://top.mezon.ai/) - Mezon Top Board
-   [**User Guide**](docs/user-guides/GETTING_STARTED.md) - Getting started guide

### 🛠️ For Developers

-   [**Developer Guide**](docs/developer/SETUP.md) - Complete setup and development guide (web)
-   [**API Documentation**](https://mezon.ai/docs/developer/mezon-sdk) - REST API and WebSocket reference
-   [**Architecture Guide**](docs/developer/ARCHITECTURE.md) - System design and architecture
-   [**Bot Development**](https://github.com/mezonai/mezon-bot-example) - Bot creation tutorial
-   [**Desktop**](https://github.com/mezonai/mezon-desktop) · [**iOS**](https://github.com/mezonai/mezon-ios) · [**Android**](https://github.com/mezonai/mezon-android) - Native clients

### 📦 SDKs & Libraries

-   [**JavaScript SDK**](https://github.com/mezonai/mezon-js) - Official JS/TS SDK
-   [**Go SDK**](https://github.com/mezonai/mezon-go-sdk) - Official Go SDK
-   [**Java SDK**](https://github.com/mezonai/mezon-java-sdk) - Official Java SDK
-   [**Python SDK**](https://github.com/phuvinh010701/mezon-sdk-python) - Official Python SDK
-   [**.NET SDK**](https://github.com/huy-buidoanquang/Mezon.NET) - Official .NET SDK
-   [**NestJS SDK**](https://github.com/n0xgg04/nezon) - Official NestJs SDK
-   [**Mezon WebJs SDK**](https://github.com/mezonai/mezon-web-js) - SDK for channel apps integration
-   [**MCP Integration**](https://github.com/mezonai/mezon-mcp) - AI-ready integration

### 🌐 Community & Support

-   [**Community Hub**](https://mezon.ai/invite/1840696977034055680) - Join our official community
-   [**GitHub Discussions**](https://github.com/mezonai/mezon/discussions) - Ask questions and share ideas
-   [**Issue Tracker**](https://github.com/mezonai/mezon/issues) - Report bugs and request features
-   [**Developer Portal**](https://mezon.ai/developers/applications) - Build applications on Mezon

---

## 🔧 Troubleshooting

### Common Issues

**Installation Problems**

-   Ensure Node.js 18+ and Yarn 1.22.4+ are installed
-   Clear node_modules and reinstall: `rm -rf node_modules && yarn install`
-   Check [system requirements](#-installation) for your platform

**Development Issues**

-   Port conflicts: Change port in project configuration
-   Build failures: Run `yarn lint` and `yarn format` to fix code issues
-   WebSocket connection issues: Check firewall and proxy settings

**Performance Issues**

-   Enable hardware acceleration in browser settings
-   Close unnecessary applications to free up system resources
-   Update to the latest version for performance improvements

> 🆘 **Need Help?** Visit our [troubleshooting guide](DEVELOPMENT.md#troubleshooting) or ask in our [community chat](https://mezon.ai/invite/1840696977034055680).

---

## 📄 License & Legal

-   **License**: MIT License - Free for personal and commercial use
-   **Privacy Policy**: [mezon.ai/privacy](https://mezon.ai/privacy-policy)
-   **Terms of Service**: [mezon.ai/terms](https://mezon.ai/terms-of-service)
-   **Security Policy**: [SECURITY.md](SECURITY.md)

---

## 🙏 Acknowledgments

Mezon is built on top of amazing open-source technologies:

-   [webrtc](https://github.com/pion/webrtc) - Pion WebRTC A pure Go implementation of the WebRTC API
-   [mezon-sfu](https://github.com/mezonai/mezon-sfu) - mezon-sfu
-   [liburing](https://github.com/axboe/liburing) - io_uring for zero-copy I/O in mezon-sfu and mezon-proto-server
-   [BoringSSL](https://boringssl.googlesource.com/boringssl) - TLS / DTLS
-   [libsrtp](https://github.com/cisco/libsrtp) - SRTP media protection
-   [Opus](https://opus-codec.org/) - Voice codec used by libmezia
-   [ScyllaDB](https://www.scylladb.com) - ScyllaDB
-   [Valkey](https://valkey.io) / [Redis](https://redis.io) - Cache and real-time state
-   [imgproxy](https://imgproxy.net) - imgproxy
-   [minio](https://min.io) - minio
-   [Ory Hydra](https://www.ory.sh/hydra) - OAuth 2.0 and OpenID Connect server

<div align="center">
  <p>
    <strong>Made with ❤️ by the Mezon Team</strong><br>
    <em>Your world, your clan</em>
  </p>
  
  <p>
    <a href="https://github.com/mezonai/mezon">⭐ Star us on GitHub</a> •
    <a href="https://mezon.ai/invite/1840696977034055680">💬 Join our community</a> •
    <a href="https://github.com/mezonai/mezon/issues/new/choose">🐛 Report an issue</a>
  </p>
</div>
