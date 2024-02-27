#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import yaml from "js-yaml";

const installDependencies = async () => {
  const { configChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "configChoice",
      message: "Which package you want to use?",
      choices: ["npm", "pnpm", "yarn"],
    },
  ]);

  switch (configChoice) {
    case "npm":
      execSync("npm install --save-dev eslint @holymos/eslint-config", {
        stdio: "inherit",
      });
      break;

    case "pnpm":
      execSync("pnpm add --save-dev eslint @holymos/eslint-config", {
        stdio: "inherit",
      });
      break;

    case "yarn":
      execSync("yarn add --dev eslint @holymos/eslint-config", {
        stdio: "inherit",
      });
      break;

    default:
      execSync("npm install --save-dev @holymos/eslint-config", {
        stdio: "inherit",
      });
  }
};

async function updateEslintConfig() {
  const { configChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "configChoice",
      message: "Which config do you want to use?",
      choices: ["node", "react", "next"],
    },
  ]);

  const configFiles = [
    { file: ".eslintrc.js", parser: require, stringifier: JSON.stringify },
    { file: ".eslintrc.json", parser: JSON.parse, stringifier: JSON.stringify },
    {
      file: ".eslintrc.yaml",
      parser: yaml.safeLoad,
      stringifier: yaml.safeDump,
    },
    {
      file: ".eslintrc.yml",
      parser: yaml.safeLoad,
      stringifier: yaml.safeDump,
    },
    { file: "package.json", parser: JSON.parse, stringifier: JSON.stringify },
  ];

  let config = {};

  for (const { file, parser, stringifier } of configFiles) {
    if (fs.existsSync(file)) {
      const fileContent = fs.readFileSync(file, "utf-8");
      config = parser(fileContent);

      if (file === "package.json") {
        config.eslintConfig = config.eslintConfig || {};
        config.eslintConfig.extends = config.eslintConfig.extends || [];
        config.eslintConfig.extends.push(
          `@holymos/eslint-config/${configChoice}`,
        );
      } else {
        config.extends = config.extends || [];
        config.extends.push(`@holymos/eslint-config/${configChoice}`);
      }

      fs.writeFileSync(file, stringifier(config, null, 2));
      return;
    }
  }

  config.extends = [`@holymos/eslint-config/${configChoice}`];
  fs.writeFileSync(".eslintrc.json", JSON.stringify(config, null, 2));
}

const createPrettierrc = async () => {
  const configFiles = [
    { file: ".prettierrc.js", parser: require, stringifier: JSON.stringify },
    {
      file: ".prettierrc.json",
      parser: JSON.parse,
      stringifier: JSON.stringify,
    },
    {
      file: ".prettierrc.yaml",
      parser: yaml.safeLoad,
      stringifier: yaml.safeDump,
    },
    {
      file: ".prettierrc.yml",
      parser: yaml.safeLoad,
      stringifier: yaml.safeDump,
    },
    { file: "package.json", parser: JSON.parse, stringifier: JSON.stringify },
  ];

  for (const { file, parser, stringifier } of configFiles) {
    if (fs.existsSync(file)) {
      const fileContent = fs.readFileSync(file, "utf-8");
      let config = parser(fileContent);

      if (file === "package.json") {
        config.prettier = config.prettier || {};
        config.prettier.plugins = config.prettier.plugins || [];

        config.prettier.plugins.push("prettier-plugin-tailwindcss");
      } else {
        config.plugins = config.plugins || [];
        config.plugins.push("prettier-plugin-tailwindcss");
      }

      fs.writeFileSync(file, stringifier(config, null, 2));
      return;
    }
  }

  const config = {
    plugins: ["prettier-plugin-tailwindcss"],
  };
  fs.writeFileSync(".prettierrc", JSON.stringify(config, null, 2));
};

const init = async () => {
  await installDependencies();
  await updateEslintConfig();

  const { configChoice } = await inquirer.prompt([
    {
      type: "list",
      name: "configChoice",
      message: "Are you using Tailwind CSS?",
      choices: ["yes", "no"],
    },
  ]);

  if (configChoice) createPrettierrc();
};

init();
