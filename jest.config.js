module.exports = {
  preset: "jest-expo",
  testMatch: ["**/tests/**/*.test.ts", "**/tests/**/*.test.tsx"],
  collectCoverageFrom: [
    "backend/utils/**/*.ts",
    "backend/services/reportService.ts",
    "backend/services/authService.ts",
  ],
  testEnvironmentOptions: { customExportConditions: ["node", "node-addons"] },
  moduleNameMapper: {
    "^react-redux$": "<rootDir>/node_modules/react-redux/dist/cjs/index.js",
    "^immer$": "<rootDir>/node_modules/immer/dist/cjs/index.js",
  },
  clearMocks: true,
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
