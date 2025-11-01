module.exports = {
  // Extend react-scripts Jest configuration
  testEnvironment: 'jsdom',
  
  // Transform ESM modules including react-router-dom
  transformIgnorePatterns: [
    'node_modules/(?!(react-router-dom|react-router|@remix-run)/)'
  ],
  
  // Map react-router-dom to CommonJS version for Jest
  moduleNameMapper: {
    '^react-router-dom$': require.resolve('react-router-dom/dist/index.js'),
    '^react-router$': require.resolve('react-router/dist/index.js'),
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  
  // Collect coverage from
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupProxy.js',
  ],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{ts,tsx}',
  ],
};
