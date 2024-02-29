#!/usr/bin/env node

const { execSync } = require("child_process");
const colors = require("colors");
const fs = require("fs");
const inquirer = require("inquirer");
const yaml = require("js-yaml");
const merge = require("lodash.merge");
const path = require("path");

const parseJsModule = (code) => {
  try {
    return JSON.parse(code);
  } catch (error) {
    const module = { exports: {} };
    eval(code);
    return module.exports;
  }
};

const installDependencies = async (packageManager, packageName) => {
  switch (packageManager) {
    case "npm":
      execSync(`npm install --save-dev ${packageName}`, {
        stdio: "inherit",
      });
      break;

    case "pnpm":
      execSync(`pnpm add --save-dev ${packageName}`, {
        stdio: "inherit",
      });
      break;

    case "yarn":
      execSync(`yarn add --save-dev ${packageName}`, {
        stdio: "inherit",
      });
      break;

    default:
      execSync(`npm install --save-dev ${packageName}`, {
        stdio: "inherit",
      });
  }
};

async function updateEslintConfig(projectChoice) {
  const configFiles = [
    {
      file: ".eslintrc.js",
      parser: parseJsModule,
      stringifier: JSON.stringify,
    },
    {
      file: ".eslintrc.cjs",
      parser: parseJsModule,
      stringifier: JSON.stringify,
    },
    { file: ".eslintrc.json", parser: JSON.parse, stringifier: JSON.stringify },
    {
      file: ".eslintrc.yaml",
      parser: yaml.load,
      stringifier: yaml.dump,
    },
    {
      file: ".eslintrc.yml",
      parser: yaml.load,
      stringifier: yaml.dump,
    },
    { file: "package.json", parser: JSON.parse, stringifier: JSON.stringify },
  ];

  let config = {};

  for (const { file, parser, stringifier } of configFiles) {
    if (fs.existsSync(file)) {
      const fileContent = fs.readFileSync(file, "utf-8");
      config = parser(fileContent);

      if (file === "package.json") {
        const regex = /@holymos\/eslint-config\/(react|node|next)/;

        if (
          !config.eslintConfig ||
          (config.eslintConfig.extends &&
            config.eslintConfig.extends.some((value) => regex.test(value)))
        )
          break;

        config.eslintConfig.extends = config.eslintConfig.extends || [];
        config.eslintConfig.extends.push(
          `@holymos/eslint-config/${projectChoice}`,
        );
      } else {
        const regex = /@holymos\/eslint-config\/(react|node|next)/;
        if (config.extends && config.extends.some((value) => regex.test(value)))
          return;

        config.extends = config.extends || [];
        config.extends.push(`@holymos/eslint-config/${projectChoice}`);
      }

      let updatedConfig = stringifier(config, null, 2);

      if (file.endsWith(".js") || file.endsWith(".cjs")) {
        updatedConfig = `module.exports = ${updatedConfig}`;
      }

      fs.writeFileSync(file, updatedConfig);
      return;
    }
  }

  config = { extends: [`@holymos/eslint-config/${projectChoice}`] };
  fs.writeFileSync(".eslintrc.json", JSON.stringify(config, null, 2));
}

const createPrettierrc = async () => {
  const configFiles = [
    {
      file: ".prettierrc",
      parser: parseJsModule,
      stringifier: JSON.stringify,
    },
    {
      file: ".prettierrc.cjs",
      parser: parseJsModule,
      stringifier: JSON.stringify,
    },
    {
      file: ".prettierrc.js",
      parser: parseJsModule,
      stringifier: JSON.stringify,
    },
    {
      file: ".prettierrc.json",
      parser: JSON.parse,
      stringifier: JSON.stringify,
    },
    {
      file: ".prettierrc.yaml",
      parser: yaml.load,
      stringifier: yaml.dump,
    },
    {
      file: ".prettierrc.yml",
      parser: yaml.load,
      stringifier: yaml.dump,
    },
    { file: "package.json", parser: JSON.parse, stringifier: JSON.stringify },
  ];

  let config = {};

  for (const { file, parser, stringifier } of configFiles) {
    if (fs.existsSync(file)) {
      const fileContent = fs.readFileSync(file, "utf-8");
      config = parser(fileContent);

      if (file === "package.json") {
        if (
          !config.prettier ||
          (config.prettier.plugins &&
            config.prettier.plugins.includes("prettier-plugin-tailwindcss"))
        )
          break;

        config.prettier = config.prettier || {};
        config.prettier.plugins = config.prettier.plugins || [];

        config.prettier.plugins.push("prettier-plugin-tailwindcss");
      } else {
        if (
          config.plugins &&
          config.plugins.includes("prettier-plugin-tailwindcss")
        )
          return;

        config.plugins = config.plugins || [];
        config.plugins.push("prettier-plugin-tailwindcss");
      }

      let updatedConfig = stringifier(config, null, 2);

      if (file.endsWith(".js") || file.endsWith(".cjs")) {
        updatedConfig = `module.exports = ${updatedConfig}`;
      }

      fs.writeFileSync(file, updatedConfig);
      return;
    }
  }

  config = { plugins: ["prettier-plugin-tailwindcss"] };
  fs.writeFileSync(".prettierrc", JSON.stringify(config, null, 2));
};

const createVsCodeSettings = () => {
  const projectDir = process.cwd();

  const vscodeDir = path.join(projectDir, ".vscode");

  const settingsPath = path.join(vscodeDir, "settings.json");

  // Create the .vscode directory if it doesn't exist
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }

  const newSettings = {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "always",
    },
    "[html]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
    },
    "[css]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
    },
    "[json]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
    },
    "[jsonc]": {
      "editor.defaultFormatter": "esbenp.prettier-vscode",
    },
  };

  let settings = {};

  let settingsFileExists = false;
  if (fs.existsSync(settingsPath)) {
    settingsFileExists = true;
    const existingSettings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));

    settings = merge(existingSettings, newSettings);
  } else {
    settings = newSettings;
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  console.log(
    `The .vscode/settings.json file has been ${settingsFileExists ? "updated" : "created"}.`,
  );
};

const init = async () => {
  try {
    const { configChoice: packageManagerChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "configChoice",
        message: "Which package you want to use?",
        choices: ["npm", "pnpm", "yarn"],
      },
    ]);
    const { configChoice: projectChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "configChoice",
        message: "Which config do you want to use?",
        choices: ["node", "react", "next"],
      },
    ]);
    const { configChoice: tailwindChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "configChoice",
        message: "Are you using Tailwind CSS?",
        choices: ["yes", "no"],
      },
    ]);
    const { configChoice: autoFormatChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "configChoice",
        message: "Do you want to auto format your code?",
        choices: ["yes", "no"],
      },
    ]);

    const useTailwindConfig = tailwindChoice === "yes";

    const useVsCodeSettings = autoFormatChoice === "yes";

    const packagesList = ["@holymos/eslint-config"];
    if (useTailwindConfig) packagesList.push("prettier-plugin-tailwindcss");

    await installDependencies(packageManagerChoice, packagesList.join(" "));
    await updateEslintConfig(projectChoice);

    if (useTailwindConfig) createPrettierrc(packageManagerChoice);
    if (useVsCodeSettings) createVsCodeSettings();
  } catch (error) {
    console.log("\n", colors.red(error.message));
    console.log("\n-----------------\n");
    console.log("Exiting...");
  }
};

if (require.main === module) {
  init();
}

module.exports = {
  parseJsModule,
  installDependencies,
  updateEslintConfig,
  createPrettierrc,
  createVsCodeSettings,
  init,
};