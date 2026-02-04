# VibePOKER 🎴

A real-time Planning Poker application for agile teams to estimate story points collaboratively. Built with Next.js, Socket.IO, and TypeScript.

![Planning Poker](https://img.shields.io/badge/Planning-Poker-violet)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-green)

## ✨ Features

- **Real-time Collaboration** — Instant synchronization across all participants using Socket.IO
- **No Registration Required** — Create or join rooms instantly with just a name
- **Fibonacci Voting** — Standard Planning Poker card values: ?, 0, 1, 2, 3, 5, 8, 13, 20, ∞
- **Smart Suggestions** — Automatic calculation of average, median, mode, and Fibonacci-aligned suggestions
- **Estimation History** — Track all accepted estimations with topics and timestamps
- **Internationalization** — Full support for English and German (auto-detects browser language)
- **Dark Mode** — Beautiful light/dark theme with system preference detection
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile devices
- **Host Controls** — Room creator can reveal cards, accept results, and start new rounds
- **Revote Feature** — Re-estimate the same topic without resetting it

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

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🎮 How to Use

1. **Create a Room** — Enter your name and click "Create Room"
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
- **Real-time:** [Socket.IO 4](https://socket.io/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **i18n:** [next-intl](https://next-intl-docs.vercel.app/)
- **Theme:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Testing:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

## 🔒 Security Features

- **Input Validation** — All user inputs are sanitized and validated
- **Rate Limiting** — 30 requests/second per socket (10/sec for card selection)
- **CORS Protection** — Configurable allowed origins via environment variables
- **XSS Prevention** — Dangerous characters stripped from names and topics
- **Room Limits** — Maximum 1000 rooms, 50 players per room

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

Current test coverage: **26 tests** across 5 component test suites.

## 📁 Project Structure

```
vibepoker/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── context/             # React context providers
│   ├── hooks/               # Custom React hooks
│   ├── providers/           # Theme and other providers
│   ├── types/               # TypeScript type definitions
│   └── __tests__/           # Component tests
├── messages/                # i18n translation files
├── server.ts                # Socket.IO server
└── public/                  # Static assets
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file for production:

```bash
# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Port (optional, defaults to 3000)
PORT=3000
```

## 🌍 Internationalization

The app automatically detects the user's browser language and supports:
- 🇬🇧 English (`en`)
- 🇩🇪 German (`de`)

Translation files are located in `messages/`.

## 🎨 Customization

### Card Values

Edit `src/types/index.ts` to customize the Fibonacci sequence:

```typescript
export const CARD_VALUES = ['?', '0', '1', '2', '3', '5', '8', '13', '20', '∞'] as const;
```

Don't forget to update the `FIBONACCI` array in `server.ts` for accurate suggestions.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Known Limitations

- **In-Memory State** — Room data is stored in memory and will be lost on server restart
- **No Persistence** — Estimation history is not saved to a database
- **Single Server** — Cannot scale horizontally without Redis or similar state management

For production use with persistence, consider integrating Redis or a database.

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ for agile teams
