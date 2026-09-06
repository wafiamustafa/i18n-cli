# Contributing to i18n-ai-cli

Thank you for your interest in contributing to i18n-ai-cli! We welcome contributions from the community and are excited to see what you'll build.

[![License: Custom](https://img.shields.io/badge/License-Custom-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)
- [Resources](#resources)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). We pledge to act and interact in ways that contribute to an open, welcoming, diverse, inclusive, and healthy community.

By participating in this project, you agree to abide by its terms. Please read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

### Reporting Issues

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting wafiamustafa@gmail.com. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/i18n-cli.git
   cd i18n-cli
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/wafiamustafa/i18n-cli.git
   ```

## Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **Package Manager**: npm or yarn
- **Git**: For version control

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
# Build for production
npm run build

# Watch mode for development
npm run dev
```

### Link for Local Testing

To test your changes locally:

```bash
# Link the package globally
npm link

# Test in another project
cd /path/to/test-project
i18n-ai-cli --help

# Or use npx
npx i18n-ai-cli --help
```

To unlink when you're done:

```bash
npm unlink -g i18n-ai-cli
```

### Environment Setup (Optional)

For testing OpenAI or Google Cloud integration:

```bash
# Create a .env file in the project root, then uncomment and fill in your keys
cp .env.example .env

# The .env file is gitignored, so it won't be committed
```

Both providers read these keys automatically. See the [environment lookup rules](README.md#persistent-api-keys-all-frameworks) for `.env.local`, environment-specific files, and CI overrides. Automated tests use mocks and do not require real keys.

## Making Changes

### Branch Naming

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names with appropriate prefixes:

- `feature/` - for new features (e.g., `feature/add-deepl-provider`)
- `fix/` - for bug fixes (e.g., `fix/validation-error-nested-keys`)
- `docs/` - for documentation updates (e.g., `docs/update-readme-examples`)
- `refactor/` - for code refactoring (e.g., `refactor/extract-validation-logic`)
- `test/` - for adding or updating tests (e.g., `test/add-provider-tests`)
- `chore/` - for maintenance tasks (e.g., `chore/update-dependencies`)

### Code Style

- **TypeScript**: The project uses TypeScript with strict type checking enabled
- **Formatting**: Follow the existing code patterns and conventions
- **Type Safety**: Ensure all functions have proper type annotations
- **Error Handling**: Use try-catch blocks appropriately and provide meaningful error messages
- **Comments**: Add comments for complex logic, but prefer self-documenting code
- **Imports**: Use ES modules syntax (`import`/`export`)

Run type checking before committing:

```bash
npm run typecheck
```

### Project Structure

```
src/                    # Source code
├── bin/                # CLI entry point
│   └── cli.ts          # Main CLI router and command definitions
├── commands/           # CLI commands (add-key, remove-lang, etc.)
├── config/             # Configuration loading and types
├── context/            # Context management and dependency injection
├── core/               # Core utilities (file-manager, validators, etc.)
├── providers/          # Translation providers (OpenAI, Google, etc.)
└── services/           # Translation services

unit-testing/           # Test files (mirrors src/ structure)
├── commands/           # Command tests
├── config/             # Config tests
├── context/            # Context tests
├── core/               # Core utility tests
├── providers/          # Provider tests
└── services/           # Service tests
```

### Best Practices

1. **Keep changes focused**: Make small, focused commits that address one issue at a time
2. **Write tests**: Add tests for new features and bug fixes
3. **Update documentation**: Keep README and inline docs up to date
4. **Follow SOLID principles**: Write maintainable, extensible code
5. **Use TypeScript features**: Leverage interfaces, types, and generics appropriately
6. **Handle errors gracefully**: Provide helpful error messages and recover when possible
7. **Respect existing patterns**: Follow established patterns in the codebase

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test -- --watch
```

### Run Specific Test File

```bash
# Run tests matching a pattern
npm test -- add-key.test.ts

# Run tests in a directory
npm test -- commands/
```

### Test Coverage

```bash
# Run tests with coverage report
npm test -- --coverage

# View coverage report
npm test -- --coverage --reporter=html
```

### Writing Tests

- **Location**: Tests are located in the `unit-testing/` folder, mirroring the `src/` structure
- **Framework**: We use [Vitest](https://vitest.dev/) for testing
- **Coverage**: Aim for high test coverage, especially for new features and critical paths
- **Mocks**: Mock external dependencies (file system, API calls, console output, etc.)
- **Imports**: Import source files from `../../src/` when writing tests
- **Naming**: Use descriptive test names that explain the expected behavior

### Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addKeyCommand } from '../../src/commands/add-key';
import { FileManager } from '../../src/core/file-manager';

describe('addKeyCommand', () => {
  let mockFileManager: FileManager;

  beforeEach(() => {
    // Setup mocks
    mockFileManager = {
      readLocale: vi.fn(),
      writeLocale: vi.fn(),
    } as unknown as FileManager;
  });

  it('should add a new key to all locales', async () => {
    const result = await addKeyCommand(
      mockFileManager,
      'welcome.message',
      { value: 'Welcome' },
      undefined
    );
    
    expect(result).toBe(true);
    expect(mockFileManager.writeLocale).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    vi.spyOn(mockFileManager, 'readLocale').mockRejectedValue(new Error('File not found'));
    
    await expect(addKeyCommand(mockFileManager, 'key', { value: 'value' }, undefined))
      .rejects.toThrow('File not found');
  });
});
```

### Testing Guidelines

1. **Test edge cases**: Empty inputs, null values, boundary conditions
2. **Test error scenarios**: File not found, invalid input, API failures
3. **Use descriptive names**: `it('should return false when locale does not exist')`
4. **Keep tests independent**: Each test should run in isolation
5. **Mock appropriately**: Don't rely on external services in unit tests
6. **Test both success and failure paths**: Ensure proper error handling

## Submitting Changes

### Before Submitting

Before submitting your pull request, ensure the following:

1. **Build the project** to ensure it compiles without errors:
   ```bash
   npm run build
   ```

2. **Run type checking** to catch TypeScript errors:
   ```bash
   npm run typecheck
   ```

3. **Run all tests** and ensure they pass:
   ```bash
   npm test
   ```

4. **Test your changes manually** if applicable:
   ```bash
   npm link
   i18n-ai-cli --help
   # Test your specific changes
   ```

5. **Update documentation** if you've changed functionality:
   - Update README.md with new features or changed behavior
   - Add inline comments for complex code
   - Update JSDoc comments for exported functions

6. **Add tests** for new features or bug fixes

7. **Check code formatting** matches existing style

### Commit Messages

Write clear and descriptive commit messages following these guidelines:

- Use the **present tense** ("Add feature" not "Added feature")
- Use the **imperative mood** ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to **72 characters** or less
- Reference issues and PRs where appropriate
- Include motivation for the change in the body if not obvious

**Examples of good commit messages:**

```
Add support for DeepL translation provider

Implement DeepL API integration as a new translation provider.
This provides an alternative to OpenAI and Google Translate
with better support for European languages.

Fixes #42
```

```
Fix validation error when key contains special characters

Properly escape special characters in regex patterns to prevent
validation failures for keys like 'auth.login.title'.

Closes #38
```

```
Update README with new CLI options

Add documentation for --provider flag and sync functionality
in add:key and update:key commands.
```

### Pull Request Process

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub from your fork to the main repository:
   - Go to https://github.com/wafiamustafa/i18n-cli
   - Click "New pull request"
   - Select your branch and create the PR

3. **Fill out the PR template** with:
   - Clear title describing the change
   - Description of what changed and why
   - Any related issue numbers (e.g., "Fixes #123")
   - Screenshots or examples if applicable
   - Checklist completion confirmation

4. **Wait for review** - maintainers will review your PR and may request changes

5. **Address feedback** by making additional commits to your branch

6. **Approval and merge** - Once approved, your PR will be merged into the main branch

### PR Checklist

Before submitting your pull request, please confirm:

- [ ] Code builds successfully (`npm run build`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Test coverage is adequate (aim for >80%)
- [ ] Documentation updated (README, inline comments, etc.)
- [ ] Commit messages are clear and descriptive
- [ ] Branch is up to date with main branch
- [ ] No unnecessary console.log or debug statements
- [ ] Error handling is implemented for edge cases

### After Submission

- Monitor your PR for comments or questions
- Be responsive to feedback and willing to make changes
- Celebrate when your contribution is merged! 🎉

## Release Process

The release process is handled by maintainers:

### Version Management

We follow [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** version for incompatible changes
- **MINOR** version for backwards-compatible features
- **PATCH** version for backwards-compatible bug fixes

### Release Steps

1. Update version in `package.json`
2. Run `npm version patch|minor|major` (automatically updates version and creates git tag)
3. Push tags: `git push --follow-tags`
4. Publish to npm: `npm publish`
5. Create a GitHub release with changelog

### Changelog

For each release, maintainers should:

1. Review all merged PRs since the last release
2. Create a CHANGELOG.md entry with:
   - New features
   - Bug fixes
   - Breaking changes (with migration guide)
   - Documentation updates
3. Thank contributors

---

## Resources

### Getting Help

- 📖 **README**: Check the [README.md](README.md) for usage documentation
- 💬 **Issues**: Open an [issue](https://github.com/wafiamustafa/i18n-cli/issues) for bug reports or feature requests
- 💡 **Discussions**: Start a [discussion](https://github.com/wafiamustafa/i18n-cli/discussions) for questions or ideas
- 📧 **Email**: Contact wafiamustafa@gmail.com for direct inquiries

### Helpful Links

- [Project Repository](https://github.com/wafiamustafa/i18n-cli)
- [Issue Tracker](https://github.com/wafiamustafa/i18n-cli/issues)
- [Discussions](https://github.com/wafiamustafa/i18n-cli/discussions)
- [npm Package](https://www.npmjs.com/package/i18n-ai-cli)
- [Vitest Documentation](https://vitest.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Commander.js Documentation](https://github.com/tj/commander.js)

### Development Tools

- **Node.js**: [Download](https://nodejs.org/)
- **npm**: [Documentation](https://docs.npmjs.com/)
- **Git**: [Getting Started](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- **VS Code**: [Editor](https://code.visualstudio.com/) (recommended IDE)

---

Thank you for contributing to i18n-ai-cli! 🎉

Your contributions help make internationalization easier for developers worldwide.
