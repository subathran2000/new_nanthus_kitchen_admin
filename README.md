# Nanthu's Kitchen - Admin Dashboard

React-based admin dashboard for managing Nanthu's Kitchen restaurant.

## Tech Stack

- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI) v7
- **Data Fetching:** TanStack Query v5
- **Forms:** React Hook Form
- **State Management:** Zustand
- **Real-time:** Socket.io Client
- **Charts:** Recharts

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Development

```bash
# Start development server
pnpm dev

# The dashboard will be available at http://localhost:5173
```

### Production Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── auth/         # Auth-related components
│   └── layout/       # Layout components
├── contexts/         # React contexts
├── hooks/            # Custom hooks
├── lib/              # Utility libraries
├── pages/            # Page components
│   ├── auth/         # Login, password reset
│   ├── dashboard/    # Main dashboard
│   ├── events/       # Events management
│   ├── menu/         # Menu management
│   ├── newsletter/   # Newsletter management
│   ├── opening-hours/# Opening hours
│   ├── settings/     # App settings
│   ├── specials/     # Daily specials
│   └── users/        # User management
├── stores/           # Zustand stores
├── test/             # Test utilities
├── theme/            # MUI theme config
├── types/            # TypeScript types
├── App.tsx           # Root component
├── main.tsx          # Entry point
└── vite-env.d.ts     # Vite types
```

## Features

### Dashboard

- Overview statistics
- Recent activity feed
- Quick actions

### Menu Management

- Categories and items
- Pricing and availability
- Image uploads
- Drag-and-drop ordering

### Events

- Event creation and editing
- Date/time scheduling
- Image management

### Specials

- Daily specials management
- Scheduling by day
- Active/inactive status

### Newsletter

- Subscriber management
- Campaign creation
- Analytics

### Settings

- Restaurant information
- Social media links
- System configuration

## Environment Variables

| Variable       | Required | Description                         |
| -------------- | -------- | ----------------------------------- |
| `VITE_API_URL` | Yes      | Backend API URL                     |
| `VITE_WS_URL`  | No       | WebSocket URL (defaults to API URL) |

## Testing

```bash
# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Scripts

| Script               | Description              |
| -------------------- | ------------------------ |
| `pnpm dev`           | Start development server |
| `pnpm build`         | Build for production     |
| `pnpm preview`       | Preview production build |
| `pnpm lint`          | Run ESLint               |
| `pnpm type-check`    | TypeScript type checking |
| `pnpm test`          | Run tests                |
| `pnpm test:ui`       | Run tests with Vitest UI |
| `pnpm test:coverage` | Run tests with coverage  |

## Styling

The project uses Material-UI with a custom theme. Theme configuration is in `src/theme/index.ts`.

### CSS

- MUI styled components
- Emotion for CSS-in-JS
- Tailwind CSS for utilities

## Real-time Updates

The dashboard connects to the backend WebSocket for real-time updates:

- Menu changes
- Event updates
- Special updates
- Settings changes

Updates are automatically reflected in the UI without manual refresh.

## Authentication

- JWT-based authentication
- HTTP-only cookies for security
- Automatic token refresh
- Protected routes

## API Integration

All API calls use TanStack Query for:

- Automatic caching
- Background refetching
- Optimistic updates
- Error handling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Deployment

### Docker

```bash
# Build image
docker build -t nanthus-dashboard .

# The image includes nginx for serving
```

### Static Hosting

The production build outputs to `dist/` and can be deployed to any static hosting:

- Vercel
- Netlify
- AWS S3/CloudFront
- Nginx

### Nginx Configuration

See `nginx.conf` for production nginx configuration including:

- Security headers
- Gzip compression
- SPA routing
- Caching

## License

Private - All rights reserved.
