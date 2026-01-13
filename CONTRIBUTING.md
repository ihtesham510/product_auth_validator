# Contributing Guide

Thank you for your interest in contributing to the Product Auth Validator project! This guide will help you understand the project structure, setup, and contribution guidelines.

## Table of Contents

- [What is this Project?](#what-is-this-project)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Code Architecture](#code-architecture)
- [Development Guidelines](#development-guidelines)
- [Conventions](#conventions)
- [Testing](#testing)

## What is this Project?

**Product Auth Validator** is a web application designed to verify product authenticity through unique codes. The system allows:

- **Code Verification**: Users can verify product codes by entering their code along with personal information (name, phone)
- **Prize Management**: Admin can assign prizes to codes and manage prize definitions
- **CNIC Photo Upload**: Users who win prizes can upload their CNIC (Computerized National Identity Card) photos to claim prizes
- **Admin Dashboard**: Administrators can manage codes, verify codes, assign prizes, and track prize winners

### Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router, Tailwind CSS
- **Backend**: Convex (serverless backend)
- **UI Components**: Shadcn UI, Radix UI
- **Form Handling**: React Hook Form, Zod
- **Camera**: react-camera-pro
- **Build Tool**: Vite
- **Package Manager**: Bun (or npm/yarn)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Convex account (sign up at [convex.dev](https://www.convex.dev))

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
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_CONVEX_URL=your_convex_url
   CONVEX_DEPLOYMENT=your_deployment_name
   ```
   
   Or run:
   ```bash
   npx convex init
   ```

4. **Start Convex development server**
   ```bash
   npx convex dev
   ```
   
   Keep this running in a separate terminal.

5. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

### Building for Production

```bash
bun run build
# or
npm run build
```

The production build will be in the `dist` directory.

### Running Tests

```bash
bun run test
# or
npm run test
```

## Project Structure

```
product_auth_validator/
├── convex/                 # Backend (Convex functions)
│   ├── _generated/        # Auto-generated Convex files
│   ├── auth.ts            # Authentication functions
│   ├── codes.ts           # Code verification and management
│   ├── node.ts            # Node.js actions (encrypt/decrypt)
│   ├── prizes.ts          # Prize management functions
│   ├── schema.ts          # Database schema definitions
│   └── storage.ts         # File storage functions
├── src/
│   ├── components/        # React components
│   │   ├── ui/            # Shadcn UI components
│   │   ├── VerificationForm.tsx
│   │   ├── ImportCodes.tsx
│   │   ├── PrizeDefinitions.tsx
│   │   └── ...
│   ├── routes/            # TanStack Router routes (file-based)
│   │   ├── __root.tsx     # Root layout
│   │   ├── index.tsx      # Home page
│   │   ├── admin.tsx      # Admin dashboard
│   │   ├── codes.tsx       # Code management page
│   │   ├── upload.$id.tsx # CNIC upload page
│   │   └── ...
│   ├── contexts/          # React contexts
│   ├── lib/               # Utility functions
│   └── main.tsx           # Application entry point
├── public/                # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .cursorrules           # Project-specific coding rules
```

## Code Architecture

### Frontend Architecture

#### Routing (TanStack Router)

The application uses **file-based routing** with TanStack Router. Routes are defined as files in `src/routes/`:

- `__root.tsx`: Root layout component (wraps all routes)
- `index.tsx`: Home page (`/`)
- `admin.tsx`: Admin dashboard (`/admin`)
- `codes.tsx`: Code management (`/codes`)
- `upload.$id.tsx`: Dynamic route for CNIC upload (`/upload/:id`)

**Example route structure:**
```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/your-route")({
  component: YourComponent,
});
```

#### Component Structure

Components are organized by feature:

- **UI Components** (`src/components/ui/`): Reusable Shadcn UI components
- **Feature Components** (`src/components/`): Business logic components
- **Route Components** (`src/routes/`): Page-level components

#### State Management

- **Convex Queries**: For server state (`useQuery`, `useMutation`)
- **React State**: For local UI state (`useState`, `useRef`)
- **React Hook Form**: For form state management

### Backend Architecture (Convex)

#### Function Types

1. **Queries** (`query`): Read-only operations
   ```typescript
   export const getCode = query({
     args: { id: v.id("codes") },
     handler: async (ctx, args) => {
       return await ctx.db.get(args.id);
     },
   });
   ```

2. **Mutations** (`mutation`): Write operations
   ```typescript
   export const updateCode = mutation({
     args: { id: v.id("codes"), code: v.string() },
     handler: async (ctx, args) => {
       await ctx.db.patch(args.id, { code: args.code });
     },
   });
   ```

3. **Actions** (`action`): External API calls, file operations
   ```typescript
   export const encrypt = action({
     args: { id: v.string() },
     handler: async (ctx, args) => {
       // Can use Node.js APIs
     },
   });
   ```

#### Database Schema

Defined in `convex/schema.ts`:

- **codes**: Product codes with validation status
- **verified_codes**: User verification records
- **prizes**: Prize assignments to codes
- **prize_definitions**: Prize types and descriptions
- **claimable_prizes**: Prize claims with CNIC images
- **sessions**: Admin session management
- **adminCredentials**: Admin authentication

### Data Flow

1. **User Verification Flow**:
   ```
   User enters code → verifyCode mutation → Check code validity → 
   Create verified_codes entry → Return success/error
   ```

2. **Prize Claiming Flow**:
   ```
   User uploads CNIC → Upload to Convex storage → 
   enterClaimablePrize mutation → Create claimable_prizes entry
   ```

3. **Admin Management Flow**:
   ```
   Admin imports codes → importCodes mutation → 
   Bulk insert codes → Return import statistics
   ```

## Development Guidelines

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Naming Conventions**:
  - Components: PascalCase (`VerificationForm.tsx`)
  - Functions: camelCase (`handleSubmit`)
  - Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
  - Types/Interfaces: PascalCase (`CameraModuleProps`)

### Component Guidelines

1. **Component Structure**:
   ```typescript
   // 1. Imports
   import { ... } from "...";
   
   // 2. Types/Interfaces
   interface ComponentProps { ... }
   
   // 3. Component
   export function Component({ prop }: ComponentProps) {
     // 4. Hooks
     const [state, setState] = useState();
     
     // 5. Handlers
     const handleClick = () => { ... };
     
     // 6. Effects
     useEffect(() => { ... }, []);
     
     // 7. Render
     return <div>...</div>;
   }
   ```

2. **Use Shadcn Components**: Prefer Shadcn UI components over custom implementations
   ```bash
   pnpx shadcn@latest add [component-name]
   ```

3. **Form Handling**: Use React Hook Form with Zod validation
   ```typescript
   const form = useForm({
     resolver: zodResolver(schema),
     defaultValues: { ... },
   });
   ```

### Convex Guidelines

1. **Schema Design**:
   - Use `v.id("tableName")` for foreign keys
   - Add indexes for frequently queried fields
   - Use `v.optional()` for nullable fields
   - Use `v.union()` for discriminated unions

2. **Function Naming**:
   - Queries: `get*`, `fetch*`, `list*`
   - Mutations: `create*`, `update*`, `delete*`, `*Code`, `*Prize`
   - Actions: `*Action`, `encrypt`, `decrypt`

3. **Error Handling**:
   ```typescript
   if (!codeDoc) {
     throw new ConvexError("Code not found");
   }
   ```

4. **Type Safety**: Always type function arguments and return values

### File Organization

- **One feature per file**: Keep related functionality together
- **Separate concerns**: UI components separate from business logic
- **Reusable components**: Extract common patterns into shared components

### Git Workflow

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit
   ```bash
   git commit -m "feat: add new feature"
   ```

3. Push and create a pull request

### Commit Message Format

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

## Conventions

### Import Order

1. React and React-related imports
2. Third-party libraries
3. Internal components
4. Types
5. Utilities

```typescript
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import type { Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";
```

### Component Props

- Use TypeScript interfaces for props
- Destructure props in function signature
- Provide default values when appropriate

```typescript
interface ButtonProps {
  variant?: "default" | "outline";
  onClick?: () => void;
}

function Button({ variant = "default", onClick }: ButtonProps) {
  // ...
}
```

### State Management

- Use `useState` for local component state
- Use Convex queries/mutations for server state
- Use `useRef` for DOM references and values that don't trigger re-renders

### Styling

- Use Tailwind CSS utility classes
- Use `cn()` utility for conditional classes
- Follow mobile-first responsive design
- Use Shadcn component variants when available

```typescript
<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "primary" && "primary-classes"
)}>
```

## Testing

### Running Tests

```bash
bun run test
```

### Writing Tests

- Write tests for critical business logic
- Test component rendering and user interactions
- Mock Convex functions in tests

## Additional Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [Convex Docs](https://docs.convex.dev)
- [Shadcn UI](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Tailwind CSS](https://tailwindcss.com)

## Questions?

If you have questions or need help, please:
1. Check existing issues and discussions
2. Review the codebase and documentation
3. Create an issue with your question

Thank you for contributing! 🎉

