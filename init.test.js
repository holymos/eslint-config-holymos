const { execSync } = require("child_process");
const colors = require("colors");
const fs = require("fs");
const inquirer = require("inquirer");
const path = require("path");

const {
  init,
  parseJsModule,
  createPrettierrc,
  updateEslintConfig,
  installDependencies,
  createVsCodeSettings,
} = require("./init");

jest.mock("fs");
jest.mock("path");
jest.mock("colors", () => ({
  red: jest.fn((msg) => `red(${msg})`),
}));
jest.mock("js-yaml");
jest.mock("inquirer");
jest.mock("child_process");

console.log = jest.fn();

describe("init", () => {
  describe("parseJsModule", () => {
    it("should return an empty object when the code does not modify module.exports", () => {
      const code = "const a = 1;";
      const result = parseJsModule(code);
      expect(result).toEqual({});
    });

    it("should return the exported object when the code modifies module.exports", () => {
      const code = "module.exports = { a: 1 };";
      const result = parseJsModule(code);
      expect(result).toEqual({ a: 1 });
    });

    it("should handle multiple exported properties", () => {
      const code = "module.exports.a = 1; module.exports.b = 2;";
      const result = parseJsModule(code);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should handle exported functions", () => {
      const code = "module.exports = function() { return 1; };";
      const result = parseJsModule(code);
      expect(typeof result).toBe("function");
      expect(result()).toBe(1);
    });
  });

  describe("installDependencies", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should call npm install when package manager is npm", async () => {
      await installDependencies("npm", "eslint");
      expect(execSync).toHaveBeenCalledWith("npm install --save-dev eslint", {
        stdio: "inherit",
      });
    });

    it("should call pnpm add when package manager is pnpm", async () => {
      await installDependencies("pnpm", "eslint");
      expect(execSync).toHaveBeenCalledWith("pnpm add --save-dev eslint", {
        stdio: "inherit",
      });
    });

    it("should call yarn add when package manager is yarn", async () => {
      await installDependencies("yarn", "eslint");
      expect(execSync).toHaveBeenCalledWith("yarn add --save-dev eslint", {
        stdio: "inherit",
      });
    });

    it("should default to npm install when package manager is not recognized", async () => {
      await installDependencies("unknown", "eslint");
      expect(execSync).toHaveBeenCalledWith("npm install --save-dev eslint", {
        stdio: "inherit",
      });
    });
  });

  describe("updateEslintConfig", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should create .eslintrc.json if no config file exists", async () => {
      fs.existsSync.mockReturnValue(false);
      await updateEslintConfig("react");
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".eslintrc.json",
        expect.any(String),
      );
    });

    it("should update existing .eslintrc.json", async () => {
      fs.existsSync.mockImplementation((path) => path === ".eslintrc.json");
      fs.readFileSync.mockReturnValue(JSON.stringify({ extends: [] }));
      await updateEslintConfig("react");
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".eslintrc.json",
        expect.any(String),
      );
    });

    it("should not update config if @holymos/eslint-config is already extended", async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ extends: ["@holymos/eslint-config/react"] }),
      );
      await updateEslintConfig("react");
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("createPrettierrc", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should create .prettierrc if no config file exists", async () => {
      fs.existsSync.mockReturnValue(false);
      await createPrettierrc();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".prettierrc",
        expect.any(String),
      );
    });

    it("should update existing .prettierrc.json", async () => {
      fs.existsSync.mockImplementation((path) => path === ".prettierrc.json");
      fs.readFileSync.mockReturnValue(JSON.stringify({ plugins: [] }));
      await createPrettierrc();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".prettierrc.json",
        expect.any(String),
      );
    });

    it("should not update config if @holymos/eslint-config is already included", async () => {
      fs.existsSync.mockImplementation((path) => path === ".prettierrc.json");
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ plugins: ["@holymos/eslint-config"] }),
      );
      await createPrettierrc();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("createVsCodeSettings", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should create .vscode/settings.json if no settings file exists", () => {
      fs.existsSync.mockReturnValue(false);
      path.join.mockReturnValue(".vscode/settings.json");
      createVsCodeSettings();
      expect(fs.mkdirSync).toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".vscode/settings.json",
        expect.any(String),
      );
    });

    it("should update existing .vscode/settings.json", () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ "editor.formatOnSave": false }),
      );
      path.join.mockReturnValue(".vscode/settings.json");
      createVsCodeSettings();
      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        ".vscode/settings.json",
        expect.any(String),
      );
    });
  });

  describe("init", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should run without errors", async () => {
      inquirer.prompt.mockResolvedValueOnce({ configChoice: "npm" });
      inquirer.prompt.mockResolvedValueOnce({ configChoice: "react" });
      inquirer.prompt.mockResolvedValueOnce({ configChoice: "yes" });
      inquirer.prompt.mockResolvedValueOnce({ configChoice: "yes" });

      await init();
      expect(inquirer.prompt).toHaveBeenCalledTimes(4);
    });

    it("should handle errors", async () => {
      inquirer.prompt.mockRejectedValue(new Error("Test error"));
      await init();
      expect(console.log).toHaveBeenCalledWith("\n", colors.red("Test error"));
    });
  });
});
