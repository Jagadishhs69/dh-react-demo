# Windsurf Local CI/CD Pipeline

A local pipeline system for real-time development feedback. Automatically detects project languages and runs appropriate checks for code quality, security, and dependencies with enhanced security scanning capabilities.

## 🚀 Features

- **Real-time File Watching**: Pipeline triggers automatically on file changes
- **Language Detection**: Automatically detects project languages and frameworks
- **Multi-Language Support**: Node.js, Python, Java, Go, Rust, and Docker
- **Enhanced Security Scanning**: NPM version analysis, secret detection, and SAST
- **Code Quality**: Linting and formatting checks for all supported languages
- **Customizable Stages**: Enable/disable pipeline stages based on project needs
- **Detailed Reporting**: Comprehensive logs and summaries for each stage

## 🏗️ System Architecture

### Local Pipeline System (`local-pipeline/`)
- **`file-watcher.js`** - Real-time file monitoring
- **`run-pipeline.js`** - Local pipeline execution (customized)
- **`start-local-pipeline.bat/.sh`** - Cross-platform startup scripts
- **`package.json`** - Dependencies and configuration

## 📋 Pipeline Stages

### Local Pipeline (Enhanced Security Focus)
1. **Language Detection** ✅ - Identifies project languages and frameworks
2. **Dependency Check** ✅ - Installs dependencies and checks vulnerabilities
3. **Code Quality** ⚠️ - Runs linting tools (continues on failure)
4. **NPM Version Scan** ✅ - Checks for outdated and vulnerable npm packages
5. **Secret Detection** ✅ - Scans for hardcoded secrets and sensitive files
6. **SAST Scan** ✅ - Static Application Security Testing with Semgrep

## 🛠️ Tools by Language

### Node.js
- **Dependencies**: `npm install`, `npm audit`
- **Code Quality**: ESLint, Prettier
- **Version Scanning**: `npm outdated`, enhanced vulnerability detection
- **Secret Detection**: Pattern-based scanning for API keys, tokens, passwords
- **SAST**: Semgrep with JavaScript/TypeScript security rules

### Python
- **Dependencies**: `pip install`, `safety check`
- **Code Quality**: flake8, Black, isort
- **Secret Detection**: Pattern-based scanning for credentials and keys
- **SAST**: Semgrep with Python security rules, Bandit static analysis

### Java
- **Dependencies**: Maven/Gradle
- **Code Quality**: Checkstyle
- **Security**: OWASP Dependency Check

### Go
- **Dependencies**: `go mod download/verify`
- **Code Quality**: golangci-lint

### Rust
- **Dependencies**: `cargo fetch`
- **Code Quality**: rustfmt, clippy

## 🚀 Quick Start

### For Local Development
1. **Start the file watcher**:
   ```cmd
   cd local-pipeline
   .\start-local-pipeline.bat    # Windows
   ./start-local-pipeline.sh     # Linux/Mac
   ```
2. **Keep the terminal open** - the watcher runs continuously
3. **Make changes in `/src`** - pipeline triggers automatically within 2 seconds


## ⚙️ Configuration

### Environment Variables
```bash
# Local Pipeline
WATCH_DIR=../src                    # Directory to monitor
DEBOUNCE_MS=2000                   # File change debounce delay
LOG_LEVEL=info                     # Logging verbosity
SECURITY_FAIL_ON_HIGH=true        # Fail on high vulnerabilities
```

### Language-Specific Config Files
- **Node.js**: `.eslintrc.js`, `.prettierrc`, `package.json`
- **Python**: `pyproject.toml`, `.flake8`, `requirements.txt`
- **Java**: `pom.xml`, `checkstyle.xml`, `build.gradle`
- **Go**: `.golangci.yml`, `go.mod`
- **Rust**: `Cargo.toml`, `rustfmt.toml`

## 📊 Monitoring and Logs

### Local Pipeline
- **Real-time logs**: View in terminal while watcher runs
- **Detailed logs**: Check `logs/run-TIMESTAMP/` directories
- **Stage-specific logs**: `build.log`, `code-quality.log`, `security-scan.log`, etc.


## 🔧 Troubleshooting

### Local Pipeline Issues
**File watcher not triggering:**
- Ensure watcher is running continuously
- Check absolute paths are used correctly
- Verify `/src` directory exists

**Security scan failures:**
- Missing `package-lock.json`: Run `npm i --package-lock-only`
- Update vulnerable dependencies: `npm audit fix`
- Check logs in `logs/run-TIMESTAMP/security-scan.log`

**ESLint/Code quality failures:**
- Pipeline continues to security scan (by design)
- Fix linting issues when convenient
- Add `.eslintrc.js` configuration if needed

### Debug Commands
```cmd
# Test pipeline manually
cd local-pipeline
node run-pipeline.js --changed-files '["debug-test"]'

# Check if watcher is running
tasklist /fi "imagename eq node.exe"

# Validate setup
npm run validate
```

## 📚 Documentation

- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Comprehensive project overview with FAQ
- **[LOCAL_PIPELINE_GUIDE.md](LOCAL_PIPELINE_GUIDE.md)** - Detailed local pipeline setup and usage

## 🆘 Support

For issues and questions:
- Check the comprehensive FAQ in `PROJECT_DOCUMENTATION.md`
- Review pipeline logs for detailed error information
- Create an issue in the repository
- Contact the Windsurf engineering team

---

**🔄 Version**: 1.0.0 - Customized local pipeline with streamlined stages  
**📅 Last Updated**: 2025-09-10  
**Made with ❤️ by the Windsurf Engineering Team**
