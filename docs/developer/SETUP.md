# Development Setup Guide

This guide will help you set up your development environment for contributing to Mezon.

## Prerequisites

### Required Software

- **Node.js**: Version 18.17.0 or higher
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **Yarn**: Version 1.22.17 or higher
  - Install: `npm install -g yarn`
  - Verify: `yarn --version`

- **Git**: Latest version
  - Download from [git-scm.com](https://git-scm.com/)
  - Configure: 
    ```bash
    git config --global user.name "Your Name"
    git config --global user.email "your.email@example.com"
    ```

- **Nx CLI**: Latest version
  - Install: `npm install -g @nx/cli`
  - Verify: `nx --version`

### Recommended Tools

- **VS Code**: Primary IDE with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Nx Console
  - GitLens
  - Auto Rename Tag
  - Bracket Pair Colorizer

- **Git Bash** (Windows users): For consistent command line experience

## Environment Setup

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/mezonai/mezon.git
cd mezon

# Or clone your fork
git clone https://github.com/YOUR_USERNAME/mezon.git
cd mezon
```

### 2. Install Dependencies

```bash
# Install all project dependencies
yarn install

# This will install dependencies for all apps and libraries
# May take 3-5 minutes on first run
```

### 3. Environment Variables

Create environment files for each application:

#### Chat Application
```bash
# Create .env file in apps/chat/
touch apps/chat/.env
```

Add the following variables to `apps/chat/.env`:
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws

# Authentication
VITE_JWT_SECRET=your-jwt-secret-key

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_VOICE_CHAT=true

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id

# Debug Mode
VITE_DEBUG_MODE=true
```

#### Admin Application
```bash
# Create .env file in apps/admin/
touch apps/admin/.env
```

Add to `apps/admin/.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ADMIN_SECRET=your-admin-secret
```

### 4. Development Server

Start the development server:

```bash
# Start chat application
yarn dev:chat

# Or start admin application
yarn dev:admin

# Or start all applications
yarn dev:all
```

The applications will be available at:
- Chat: http://localhost:4200
- Admin: http://localhost:4201

## IDE Configuration

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.workingDirectories": [
    "apps/chat",
    "apps/admin",
    "libs"
  ],
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.nx": true
  }
}
```

### VS Code Extensions Configuration

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "nrwl.angular-console",
    "eamodio.gitlens",
    "formulahendry.auto-rename-tag",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## Development Workflow

### 1. Branch Management

```bash
# Always work on feature branches
git checkout -b feature/your-feature-name

# Keep your branch up to date
git fetch origin
git rebase origin/main
```

### 2. Code Quality

Run code quality checks before committing:

```bash
# Type checking
yarn typecheck

# Linting
yarn lint

# Fix linting issues
yarn lint:fix

# Format code
yarn format

# Fix formatting issues
yarn format:fix
```

### 3. Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run specific test file
yarn test apps/chat/src/components/MessageList.test.tsx
```

### 4. Building

```bash
# Build chat application
nx build chat

# Build admin application
nx build admin

# Build all applications
nx run-many --target=build --all

# Build with production optimizations
nx build chat --prod
```

### 5. Dependency Management

```bash
# Add dependency to specific project
yarn add package-name --dev
nx add package-name --project=chat

# Remove dependency
yarn remove package-name

# Update dependencies
yarn upgrade

# Check for outdated packages
yarn outdated
```

## Debugging

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Enable source maps for debugging TypeScript
4. Set breakpoints in your code

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Chat App",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4200",
      "webRoot": "${workspaceFolder}/apps/chat/src",
      "sourceMapPathOverrides": {
        "webpack:///./src/*": "${webRoot}/*"
      }
    }
  ]
}
```

### Network Issues

If you encounter network issues:

```bash
# Clear Nx cache
nx reset

# Clear yarn cache
yarn cache clean

# Delete node_modules and reinstall
rm -rf node_modules
yarn install
```

## Database Setup (Optional)

If working on backend features:

```bash
# Install Docker for database
# Run PostgreSQL container
docker run --name mezon-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Run database migrations
yarn db:migrate

# Seed development data
yarn db:seed
```

## Performance Optimization

### Development Build Performance

```bash
# Enable webpack bundle analyzer
ANALYZE=true yarn build chat

# Use faster builds in development
yarn dev:chat --skip-nx-cache
```

### Memory Usage

If you encounter memory issues:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Or add to your shell profile
echo 'export NODE_OPTIONS="--max-old-space-size=8192"' >> ~/.bashrc
```

## Troubleshooting

### Common Issues

#### "Module not found" errors
```bash
# Ensure all dependencies are installed
yarn install

# Clear Nx cache
nx reset

# Check tsconfig paths
```

#### "Permission denied" errors (macOS/Linux)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Windows-specific issues
```bash
# Use Git Bash instead of Command Prompt
# Enable Developer Mode in Windows 10/11
# Run as Administrator if needed
```

#### Port already in use
```bash
# Kill process using port 4200
npx kill-port 4200

# Or use different port
yarn dev:chat --port 4201
```

### Getting Help

1. **Documentation**: Check existing docs first
2. **Issues**: Search GitHub issues
3. **Community**: Join our [developer community](https://mezon.ai/invite/1840696977034055680)
4. **Discussions**: Use GitHub Discussions for questions

## Next Steps

Once your environment is set up:

1. Read the [Architecture Guide](ARCHITECTURE.md)
2. Review the [Style Guide](../../STYLE_GUIDE.md)
3. Check the [Contributing Guidelines](../../.github/CONTRIBUTING.md)
4. Pick a "good first issue" from GitHub
5. Start coding! 🚀

---

## Environment Verification

Run this checklist to verify your setup:

```bash
# ✅ Check Node.js version
node --version  # Should be 18.17.0+

# ✅ Check Yarn version
yarn --version  # Should be 1.22.17+

# ✅ Check Nx CLI
nx --version    # Should be latest

# ✅ Install dependencies
yarn install    # Should complete without errors

# ✅ Type checking
yarn typecheck  # Should pass

# ✅ Linting
yarn lint       # Should pass

# ✅ Tests
yarn test       # Should pass

# ✅ Build
nx build chat   # Should complete successfully

# ✅ Start development server
yarn dev:chat   # Should start on http://localhost:4200
```

If all steps pass, you're ready to develop! 🎉