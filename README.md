# Aswin's Portfolio

A modern, responsive portfolio website built with React, Vite, and Tailwind CSS. Deployed on Cloudflare Workers with automated email functionality.

## 🚀 Features

- **Modern React Architecture**: Built with React 19, Vite, and Tailwind CSS v4
- **Responsive Design**: Optimized for all devices and screen sizes
- **Smooth Animations**: Powered by Motion (motion/react)
- **Contact Form**: Working contact form with email notifications
- **Professional Email**: Auto-replies and notification system
- **SEO Optimized**: Sitemap, robots.txt, and structured data
- **Security Headers**: Content Security Policy and security headers
- **Privacy Policy**: Dedicated privacy policy page at `/privacy`
- **Fast Loading**: Deployed on Cloudflare Workers edge network
- **Custom Domain**: Live at [www.aswincloud.com](https://www.aswincloud.com)
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Search Functionality**: Global search with keyboard shortcuts (Cmd/Ctrl + K)
- **Error Handling**: React Error Boundary for graceful error handling
- **Custom 404 Page**: Beautiful error page with helpful navigation
- **Loading States**: Smooth loading animations and transitions
- **Bundle Analysis**: Tools for performance optimization
- **PR Preview Deployments**: Automatic preview deployments for pull requests
- **Stale Deployment Cleanup**: Automatic cleanup of preview deployments from closed PRs

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion
- **Backend**: Cloudflare Workers, MailChannels
- **Deployment**: Cloudflare Workers with Workers Assets
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions for automated deployment

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aswincloud/portfolio.git
   cd portfolio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🚀 Deployment

Deployment is fully managed by **Cloudflare Workers Builds** via the connected Git integration:

- **Production** — every push to `main` builds and deploys to [www.aswincloud.com](https://www.aswincloud.com).
- **Previews** — every pull request gets a unique preview URL, posted as a PR comment and torn down on PR close.

Build settings (configured in the Cloudflare dashboard): `npm ci && npm run build` with `./dist` as the assets directory (see [`wrangler.toml`](./wrangler.toml)). Environment variables and secrets (`RESEND_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `CONTACT_EMAIL`, `FEEDBACK_EMAIL`) are managed in the worker's Settings → Variables panel — production and preview environments can be configured independently.

If you ever need to deploy manually:

```bash
npx wrangler deploy
```

GitHub Actions runs CI only (`.github/workflows/ci.yml`): lint, format check, copyright check, tests, coverage, security audit, build.

## 📧 Email Configuration

The contact form uses MailChannels for sending emails:

- **Notifications**: Sent to `contact@aswincloud.com`
- **Auto-replies**: Sent to form submitters
- **No SMTP setup required**: Uses Resend API

## 📚 Documentation

Additional setup and integration guides live in [`docs/`](./docs/):

- [Development](./docs/development.md) — local dev workflow
- [Contact form setup](./docs/contact-form-setup.md)
- [Email setup](./docs/email-setup.md) · [Email deliverability](./docs/email-deliverability-guide.md)
- [Telegram setup](./docs/telegram-setup.md)
- [Enhancements / roadmap](./docs/enhancements.md)

## 🌐 Live Website

Visit the live portfolio: **[www.aswincloud.com](https://www.aswincloud.com)**

## 📱 Contact

- **Email**: contact@aswincloud.com
- **GitHub**: [github.com/Aswin-coder](https://github.com/Aswin-coder)
- **LinkedIn**: [linkedin.com/in/aswin4122001](https://www.linkedin.com/in/aswin4122001/)

## 🎯 Project Highlights

- **PR Reviewer**: ML-trained app for PR approval predictions - [pr-reviewer.aswincloud.com](https://pr-reviewer.aswincloud.com)
- **Portfolio**: Modern React-based portfolio with Cloudflare Workers backend
- **Cloud Infrastructure**: Expertise in deployment strategies and network management

---

Built with ❤️ by [Aswin](https://github.com/Aswin-coder) | Software Engineer at MulticoreWare 