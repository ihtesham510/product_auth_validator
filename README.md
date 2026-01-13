# Product Auth Validator

A modern web application for verifying product authenticity through unique codes, managing prizes, and handling CNIC photo uploads for prize claims.

## Overview

Product Auth Validator is a full-stack application that enables businesses to:
- Verify product codes with user information
- Manage and assign prizes to verified codes
- Handle prize claims through CNIC photo verification
- Provide an admin dashboard for code and prize management

## Features

- ✅ **Code Verification**: Users can verify product codes with their name and phone number
- ✅ **Prize Management**: Admin can create prize definitions and assign them to codes
- ✅ **CNIC Photo Upload**: Secure camera-based CNIC photo capture and upload
- ✅ **Admin Dashboard**: Comprehensive admin interface for managing codes, prizes, and winners
- ✅ **Real-time Updates**: Live data synchronization using Convex
- ✅ **Mobile-Friendly**: Responsive design optimized for mobile devices

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router
- **Backend**: Convex (serverless backend)
- **UI**: Shadcn UI, Tailwind CSS
- **Forms**: React Hook Form, Zod validation
- **Camera**: react-camera-pro
- **Build Tool**: Vite
- **Package Manager**: Bun

## Quick Start

### Prerequisites

- Node.js 18+ or [Bun](https://bun.sh)
- A [Convex](https://www.convex.dev) account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd product_auth_validator
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up Convex**
   
   Create a `.env.local` file:
   ```env
   VITE_CONVEX_URL=your_convex_url
   CONVEX_DEPLOYMENT=your_deployment_name
   ```
   
   Or run:
   ```bash
   npx convex init
   ```

4. **Start Convex development server** (in a separate terminal)
   ```bash
   npx convex dev
   ```

5. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## Building for Production

```bash
bun run build
# or
npm run build
```

The production build will be in the `dist` directory.

## Project Structure

```
product_auth_validator/
├── convex/              # Backend (Convex functions)
│   ├── codes.ts        # Code verification logic
│   ├── prizes.ts       # Prize management
│   ├── schema.ts       # Database schema
│   └── storage.ts      # File storage
├── src/
│   ├── components/     # React components
│   ├── routes/         # TanStack Router routes
│   └── lib/            # Utilities
└── public/             # Static assets
```

## Key Routes

- `/` - Home page with code verification form
- `/admin` - Admin dashboard (requires authentication)
- `/codes` - Code management page
- `/prize-definitions` - Prize definition management
- `/prize-winners` - View prize winners
- `/upload/:id` - CNIC photo upload page

## Development

### Running Tests

```bash
bun run test
# or
npm run test
```

### Adding UI Components

This project uses [Shadcn UI](https://ui.shadcn.com/). To add a new component:

```bash
pnpx shadcn@latest add [component-name]
```

### Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are defined as files in `src/routes/`.

**Adding a new route:**
1. Create a new file in `src/routes/` (e.g., `about.tsx`)
2. TanStack Router will automatically generate the route

**Example route:**
```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: AboutComponent,
});
```

### Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling. Use utility classes and the `cn()` helper for conditional classes.

## Environment Variables

Create a `.env.local` file with:

```env
VITE_CONVEX_URL=your_convex_url
CONVEX_DEPLOYMENT=your_deployment_name
```

## Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](./CONTRIBUTING.md) guide for:
- Project architecture details
- Code structure and guidelines
- Development best practices
- How to submit changes

## Learn More

- [TanStack Router Documentation](https://tanstack.com/router)
- [Convex Documentation](https://docs.convex.dev)
- [Shadcn UI](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Tailwind CSS](https://tailwindcss.com)

## License

[Add your license here]
