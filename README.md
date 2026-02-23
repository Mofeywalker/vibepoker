# VibePOKER 🎴

A real-time Planning Poker application for agile teams to estimate story points collaboratively. Built with Next.js, PartyKit, and TypeScript.

![Planning Poker](https://img.shields.io/badge/Planning-Poker-violet)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PartyKit](https://img.shields.io/badge/PartyKit-Latest-orange)
![Vercel](https://img.shields.io/badge/Vercel-Ready-black)

## ✨ Features

- **Real-time Collaboration** — Instant synchronization across all participants using PartyKit
- **No Registration Required** — Create or join rooms instantly with just a name
- **Flexible Deck Types** — Choose from Fibonacci, Scrum, Sequential, Hourly, or T-Shirt sizing
- **Smart Suggestions** — Automatic calculation of average, median, mode, and deck-aligned suggestions with configurable rounding
- **Estimation History** — Track all accepted estimations with topics and timestamps
- **Internationalization** — Full support for English and German (auto-detects browser language)
- **Dark Mode** — Beautiful light/dark theme with system preference detection
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile devices
- **Host Controls** — Room creator can reveal cards, accept results, start new rounds, and transfer host permissions
- **Auto-Rejoin** — Automatically rejoin your previous room and restore your session after a refresh
- **Revote Feature** — Re-estimate the same topic without resetting it
- **Persistent State** — Room data persists using PartyKit's built-in storage
- **Edge Deployment** — Runs on Cloudflare Workers for global low-latency access

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd vibepoker

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Run the development server (starts both Next.js and PartyKit)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment

#### 1. Deploy PartyKit Server

```bash
npx partykit deploy
```

This will output your PartyKit server URL (e.g., `https://vibepoker.username.partykit.dev`).

#### 2. Deploy to Vercel

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel --prod
```

Set the following environment variable in Vercel:

```bash
NEXT_PUBLIC_PARTYKIT_HOST=vibepoker.username.partykit.dev
```

## 🎮 How to Use

1. **Create a Room** — Enter your name, select a deck type, and click "Create Room"
2. **Share the Link** — Copy the room URL and share it with your team
3. **Set a Topic** — The host can set the story/task being estimated
4. **Vote** — Each participant selects their estimate card
5. **Reveal** — Once everyone has voted, the host reveals all cards
6. **Review Results** — See the distribution, average, median, and suggested value
7. **Accept** — The host accepts the final estimate (saved to history)
8. **New Round** — Start fresh or revote on the same topic

## 🏗️ Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Real-time:** [PartyKit](https://partykit.io/) (Cloudflare Workers)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **i18n:** [next-intl](https://next-intl-docs.vercel.app/)
- **Theme:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Testing:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

## 🔒 Security Features

- **Input Validation** — All user inputs are sanitized and validated
- **XSS Prevention** — Dangerous characters stripped from names and topics
- **Room Limits** — Maximum 50 players per room
- **Type Safety** — Full TypeScript coverage with strict mode

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

Run unit tests for components and logic using Vitest.

## 📁 Project Structure

```
vibepoker/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks (useRoom)
│   ├── i18n/                # Internationalization config
│   ├── lib/
│   │   ├── realtime/        # Real-time abstraction layer
│   │   └── poker-logic.ts   # Core business logic
│   ├── providers/           # Theme and other providers
│   ├── test/                # Test setup and utilities
│   ├── types/               # TypeScript type definitions
│   └── __tests__/           # Component tests
├── party/
│   └── vibepoker.ts         # PartyKit server implementation
├── messages/                # i18n translation files
└── public/                  # Static assets
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# PartyKit host (local development)
NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999

# Production: use your PartyKit deployment URL
# NEXT_PUBLIC_PARTYKIT_HOST=vibepoker.username.partykit.dev
```

## 🌍 Internationalization

The app automatically detects the user's browser language and supports:
- 🇬🇧 English (`en`)
- 🇩🇪 German (`de`)

Translation files are located in `messages/`.

## 🎨 Customization

### Card Values & Decks

Edit `src/types/index.ts` to customize the available decks or add new ones:

```typescript
export const DECKS = {
  fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
  // ... other decks
} as const;
```

Remember to update `party/vibepoker.ts` if you introduce non-numeric decks that require custom calculation logic.

## 🏛️ Architecture

VibePOKER uses a clean abstraction layer for real-time communication:

```
Next.js Client → RealtimeClient Interface → PartyKitClient → PartyKit Server
```

This architecture allows for:
- **Platform Independence** — Easy to switch real-time providers
- **Type Safety** — Fully typed event system
- **Testability** — Mock the real-time layer for testing
- **Vercel Compatibility** — PartyKit runs on Cloudflare Workers

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ✨ What's New

### v2.0 - PartyKit Migration

- ✅ Migrated from Socket.IO to PartyKit
- ✅ Full Vercel deployment support
- ✅ Persistent state using PartyKit storage
- ✅ Edge deployment on Cloudflare Workers
- ✅ Clean real-time abstraction layer
- ✅ Improved type safety and error handling

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ for agile teams
