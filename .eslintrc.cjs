/**
 * Companion file for eslint-plugin-import `import/no-unused-modules` under ESLint flat config.
 * See https://github.com/import-js/eslint-plugin-import/issues/3079
 */
module.exports = {
  root: true,
  ignorePatterns: ['dist', 'node_modules', 'coverage'],
};
