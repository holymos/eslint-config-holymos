# ESLint config

## Whats included?

- Standard config base;
- React plugin;
- React Hooks plugin;
- JSX a11y plugin;
- Eslint Plugin Import Helper;
- Prettier;
- Prettier Plugin Tailwind CSS (Using the CLI Tool)

## Setup

### Using the CLI Tool

```
npx @holymos/eslint-config init
```

### React (with Next.js)

Install dependencies:

```
npm i -D @holymos/eslint-config
```

Inside `eslint config file`

```
{
  "extends": [
    "next/core-web-vitals",
    "@holymos/eslint-config/next"
  ]
}
```

### React (without Next.js)

Install dependencies:

```
npm i -D @holymos/eslint-config
```

Inside `eslint config file`

```
{
  "extends": "@holymos/eslint-config/react"
}
```

### Node.js

Install dependencies:

```
npm i -D @holymos/eslint-config
```

Inside `eslint config file`

```
{
  "extends": "@holymos/eslint-config/node"
}
```
