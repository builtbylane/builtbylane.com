# builtbylane.com

Personal website for Lane Goldberg, Founder/CTO @ All Gold, built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Bun](https://bun.sh/) as runtime and package manager
- [Biome](https://biomejs.dev/) for linting + formatting

## Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint and format code (using Biome)
bun run lint
```

## Deployment

The site deploys AWS S3. If it were to get more traffic I would put it behind a CDN, but for now it's fine (it's less than $20 a year)

```bash
bun run deploy
```

This command will:

1. Clean the dist directory
2. Build the project
3. Deploy assets to S3 with gzip compression
4. Deploy HTML files to S3 with gzip compression

## License

Please contact Lane Goldberg for licensing information.
