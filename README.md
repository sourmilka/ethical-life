# Ethical Life

Healthcare & telemedicine platform — patient intake, payment, and clinical review.

## Tech Stack

- **Build:** [Vite](https://vite.dev/)
- **CSS Processing:** PostCSS + Autoprefixer
- **Linting:** ESLint (flat config) + Prettier
- **Language:** Vanilla JavaScript (ES Modules)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (hot-reload at http://localhost:5173)
npm run dev

# Production build → dist/
npm run build

# Preview production build locally
npm run preview
```

## Project Structure

```
├── public/              Static assets (served as-is)
│   └── font/            Web fonts (Lay Grotesk)
├── src/
│   ├── css/
│   │   ├── style.css    Main page styles
│   │   └── forms.css    Form / payment / thank-you styles
│   ├── js/
│   │   ├── main.js      Landing page entry
│   │   ├── forms.js     Intake form entry
│   │   ├── payment.js   Payment page entry
│   │   └── thank-you.js Thank-you page entry
│   ├── img/             Images & icons
│   └── video/           Video assets
├── index.html           Landing page
├── forms.html           7-step intake form
├── payment.html         BarterPay checkout
├── thank-you.html       Confirmation page
├── vite.config.js       Vite multi-page config
├── postcss.config.js    PostCSS + Autoprefixer
├── eslint.config.js     ESLint flat config
└── .prettierrc          Prettier rules
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable           | Description                      | Default                 |
| ------------------ | -------------------------------- | ----------------------- |
| `VITE_BACKEND_URL` | Backend API URL for payments     | `http://localhost:3000` |

## Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start Vite dev server              |
| `npm run build`     | Production build to `dist/`        |
| `npm run preview`   | Serve production build locally     |
| `npm run lint`      | Run ESLint on source files         |
| `npm run format`    | Format code with Prettier          |
