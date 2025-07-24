# BundleAlert Connect

A secure Telegram miniapp for wallet verification with the BundleAlert bot. Built with React, Vite, and TailwindCSS.

## 🔒 Security Features

- **Read-only wallet verification** - No spending permissions requested
- **Environment variable protection** - Sensitive data never committed
- **Secure wallet integration** - Support for MetaMask and WalletConnect
- **Telegram WebApp API** - Full integration with Telegram miniapp features

## 🚀 Features

- **Wallet Connection**: Support for MetaMask and WalletConnect compatible wallets
- **Tier Verification**: Automatic tier assignment based on token holdings
- **Mobile Optimized**: Designed specifically for Telegram miniapp use
- **Responsive FAQ**: Comprehensive security information with scrollable answers
- **Modern UI**: Beautiful interface with Framer Motion animations

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: TailwindCSS, HeadlessUI
- **Animations**: Framer Motion
- **Wallet Integration**: WalletConnect, MetaMask
- **Icons**: Heroicons
- **Build**: Vite with optimized production builds

## 📱 Telegram Integration

This app is designed to work as a Telegram miniapp and includes:
- Telegram WebApp API integration
- Haptic feedback support
- Main button control
- User data access
- Automatic theme adaptation

## 🔧 Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/CryptoFeline/bundlealertconnect.git
cd bundlealertconnect
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
VITE_API_BASE_URL=your_api_url_here
```

5. Start development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

## 🌐 Deployment

### Netlify Deployment

This project is configured for easy Netlify deployment:

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

Build settings:
- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Environment Variables for Production

Set these in your hosting platform:

- `VITE_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID
- `VITE_API_BASE_URL`: Your backend API URL

## 🔐 Security Considerations

- **Never commit `.env` files** - They're excluded via `.gitignore`
- **Use environment variables** - All sensitive data is configurable
- **Read-only signatures** - No wallet spending permissions requested
- **HTTPS required** - Ensure all deployments use HTTPS
- **CSP headers** - Consider implementing Content Security Policy

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Layout/         # Header and layout components
│   ├── WalletConnect/  # Wallet connection logic
│   ├── Verification/   # Verification status components
│   └── ui/            # Reusable UI components
├── contexts/           # React contexts (Wallet, Telegram)
├── hooks/             # Custom React hooks
├── services/          # API and external service integrations
└── utils/             # Utility functions and constants
```

## 📄 License

This project is private and proprietary to BundleAlert.

## 🆘 Support

For support with this webapp:
- Check the FAQ section in the app
- Review the documentation
- Contact the development team

---

**⚠️ Important**: This is a Telegram miniapp designed for wallet verification. Always verify you're using the official BundleAlert bot before connecting your wallet.
