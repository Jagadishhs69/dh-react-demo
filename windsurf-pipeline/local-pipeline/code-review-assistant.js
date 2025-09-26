#!/usr/bin/env node

/**
 * Interactive Code Review Assistant for Windsurf CI/CD Pipeline
 * Provides AI-powered fix suggestions based on pipeline results
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class CodeReviewAssistant {
    constructor(pipelineResults, config = {}) {
        this.results = pipelineResults;
        this.config = {
            projectRoot: config.projectRoot || process.cwd(),
            logLevel: config.logLevel || 'info',
            ...config
        };
        
        this.fixSuggestions = new Map();
        this.issueCategories = {
            'eslint': 'Code Quality',
            'prettier': 'Code Formatting',
            'syntax': 'Syntax Errors',
            'security': 'Security Issues',
            'dependencies': 'Dependency Issues'
        };
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async startInteractiveSession() {
        console.log('\n🔍 Code Review Assistant Started');
        console.log('=====================================');
        
        // Analyze pipeline results
        await this.analyzePipelineResults();
        
        // Show summary
        this.displayIssueSummary();
        
        // Start interactive prompt
        await this.promptLoop();
    }

    async analyzePipelineResults() {
        const issues = [];
        
        // Analyze code quality issues
        if (this.results.codeQuality && !this.results.codeQuality.success) {
            const codeIssues = await this.extractCodeQualityIssues();
            issues.push(...codeIssues);
        }
        
        // Analyze security issues
        if (this.results.securityScan && this.results.securityScan.results) {
            const securityIssues = await this.extractSecurityIssues();
            issues.push(...securityIssues);
        }
        
        // Analyze dependency issues
        if (this.results.dependencyCheck && !this.results.dependencyCheck.success) {
            const depIssues = await this.extractDependencyIssues();
            issues.push(...depIssues);
        }
        
        // Generate fix suggestions for each issue
        for (const issue of issues) {
            const fixes = await this.generateFixSuggestions(issue);
            this.fixSuggestions.set(issue.id, fixes);
        }
    }

    async extractCodeQualityIssues() {
        const issues = [];
        const logPath = path.join(this.config.projectRoot, 'logs');
        
        try {
            // Find latest code quality log
            const logDirs = fs.readdirSync(logPath)
                .filter(dir => dir.startsWith('run-'))
                .sort()
                .reverse();
            
            if (logDirs.length > 0) {
                const latestLogDir = path.join(logPath, logDirs[0]);
                const codeQualityLog = path.join(latestLogDir, 'code-quality.log');
                
                if (fs.existsSync(codeQualityLog)) {
                    const content = fs.readFileSync(codeQualityLog, 'utf8');
                    
                    // Parse ESLint errors
                    if (content.includes('ESLint couldn\'t find an eslint.config')) {
                        issues.push({
                            id: 'eslint-config-missing',
                            type: 'eslint',
                            severity: 'error',
                            message: 'ESLint configuration file missing (eslint.config.js)',
                            file: 'project root',
                            line: null,
                            description: 'ESLint v9+ requires eslint.config.js instead of .eslintrc.*'
                        });
                    }
                    
                    // Parse other linting errors
                    const errorMatches = content.match(/\[ERROR\].*?Error Message: (.*?)(?=\n|$)/g);
                    if (errorMatches) {
                        errorMatches.forEach((match, index) => {
                            const message = match.replace(/\[ERROR\].*?Error Message: /, '');
                            issues.push({
                                id: `code-quality-${index}`,
                                type: 'eslint',
                                severity: 'error',
                                message: message.substring(0, 100) + '...',
                                file: 'multiple files',
                                line: null,
                                description: message
                            });
                        });
                    }
                }
            }
        } catch (error) {
            console.log('Could not parse code quality issues:', error.message);
        }
        
        return issues;
    }

    async extractSecurityIssues() {
        const issues = [];
        
        if (this.results.securityScan?.results) {
            Object.entries(this.results.securityScan.results).forEach(([language, result]) => {
                if (result.vulnerabilities && result.vulnerabilities.total > 0) {
                    issues.push({
                        id: `security-${language}`,
                        type: 'security',
                        severity: result.vulnerabilities.critical > 0 ? 'critical' : 
                                 result.vulnerabilities.high > 0 ? 'high' : 'medium',
                        message: `${result.vulnerabilities.total} security vulnerabilities found`,
                        file: 'dependencies',
                        line: null,
                        description: `Critical: ${result.vulnerabilities.critical || 0}, High: ${result.vulnerabilities.high || 0}, Medium: ${result.vulnerabilities.moderate || 0}`
                    });
                }
                
                if (result.securityChecks?.issues?.length > 0) {
                    result.securityChecks.issues.forEach((issue, index) => {
                        issues.push({
                            id: `security-file-${index}`,
                            type: 'security',
                            severity: 'high',
                            message: issue,
                            file: 'project files',
                            line: null,
                            description: 'Sensitive file or configuration detected'
                        });
                    });
                }
            });
        }
        
        return issues;
    }

    async extractDependencyIssues() {
        const issues = [];
        
        if (this.results.dependencyCheck?.results) {
            Object.entries(this.results.dependencyCheck.results).forEach(([language, result]) => {
                if (!result.success && result.error) {
                    issues.push({
                        id: `dependency-${language}`,
                        type: 'dependencies',
                        severity: 'error',
                        message: `${language} dependency check failed`,
                        file: 'package files',
                        line: null,
                        description: result.error
                    });
                }
            });
        }
        
        return issues;
    }

    async generateFixSuggestions(issue) {
        const fixes = [];
        
        switch (issue.type) {
            case 'eslint':
                if (issue.id === 'eslint-config-missing') {
                    fixes.push({
                        title: 'Create modern ESLint configuration',
                        description: 'Generate eslint.config.js for ESLint v9+',
                        command: 'Create eslint.config.js file',
                        code: `export default [
    {
        files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: "module"
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "semi": ["error", "always"],
            "quotes": ["error", "single"]
        }
    }
];`,
                        automatic: true
                    });
                    
                    fixes.push({
                        title: 'Migrate from .eslintrc to eslint.config.js',
                        description: 'Use ESLint migration tool',
                        command: 'npx @eslint/migrate-config .eslintrc.json',
                        automatic: false
                    });
                }
                break;
                
            case 'security':
                if (issue.message.includes('vulnerabilities')) {
                    fixes.push({
                        title: 'Update vulnerable dependencies',
                        description: 'Run npm audit fix to automatically fix vulnerabilities',
                        command: 'npm audit fix',
                        automatic: false
                    });
                    
                    fixes.push({
                        title: 'Force update critical vulnerabilities',
                        description: 'Force update breaking changes if needed',
                        command: 'npm audit fix --force',
                        automatic: false
                    });
                }
                
                if (issue.message.includes('Sensitive file')) {
                    fixes.push({
                        title: 'Add to .gitignore',
                        description: 'Prevent sensitive files from being committed',
                        command: 'Add sensitive files to .gitignore',
                        code: `# Add to .gitignore
.env
.env.local
.env.production
config.json
secrets.json
private.key
*.pem`,
                        automatic: true
                    });
                }
                break;
                
            case 'dependencies':
                fixes.push({
                    title: 'Install missing dependencies',
                    description: 'Install required packages',
                    command: 'npm install',
                    automatic: false
                });
                
                fixes.push({
                    title: 'Clean install dependencies',
                    description: 'Remove node_modules and reinstall',
                    command: 'rm -rf node_modules && npm install',
                    automatic: false
                });
                break;
        }
        
        return fixes;
    }

    displayIssueSummary() {
        const issuesByType = new Map();
        
        for (const [issueId, fixes] of this.fixSuggestions) {
            const issue = this.findIssueById(issueId);
            if (issue) {
                const category = this.issueCategories[issue.type] || 'Other';
                if (!issuesByType.has(category)) {
                    issuesByType.set(category, []);
                }
                issuesByType.get(category).push(issue);
            }
        }
        
        console.log('\n📋 Issues Found:');
        console.log('================');
        
        if (issuesByType.size === 0) {
            console.log('✅ No issues found! Your code looks good.');
            return;
        }
        
        for (const [category, issues] of issuesByType) {
            console.log(`\n${this.getCategoryIcon(category)} ${category}:`);
            issues.forEach((issue, index) => {
                const severity = this.getSeverityIcon(issue.severity);
                console.log(`  ${index + 1}. ${severity} ${issue.message}`);
                if (issue.file !== 'multiple files') {
                    console.log(`     📁 ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
                }
            });
        }
        
        console.log(`\n💡 Total: ${Array.from(issuesByType.values()).flat().length} issues found`);
        console.log('\nType "help" for available commands or ask for specific fixes.');
    }

    async promptLoop() {
        while (true) {
            const input = await this.askQuestion('\n🤖 What would you like me to help you fix? ');
            
            if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
                console.log('👋 Code review session ended.');
                break;
            }
            
            await this.handleUserInput(input);
        }
        
        this.rl.close();
    }

    async handleUserInput(input) {
        const lowerInput = input.toLowerCase();
        
        if (lowerInput === 'help') {
            this.showHelp();
        } else if (lowerInput === 'summary' || lowerInput === 'list') {
            this.displayIssueSummary();
        } else if (lowerInput.includes('eslint') || lowerInput.includes('config')) {
            await this.showFixesForType('eslint');
        } else if (lowerInput.includes('security') || lowerInput.includes('vulnerability')) {
            await this.showFixesForType('security');
        } else if (lowerInput.includes('dependency') || lowerInput.includes('npm')) {
            await this.showFixesForType('dependencies');
        } else if (lowerInput.includes('all') || lowerInput.includes('fix everything')) {
            await this.showAllFixes();
        } else if (lowerInput.match(/^\d+$/)) {
            await this.showFixForIssueNumber(parseInt(lowerInput));
        } else {
            await this.searchAndSuggestFixes(input);
        }
    }

    async showFixesForType(type) {
        console.log(`\n🔧 Fixes for ${this.issueCategories[type] || type}:`);
        console.log('='.repeat(40));
        
        let found = false;
        for (const [issueId, fixes] of this.fixSuggestions) {
            const issue = this.findIssueById(issueId);
            if (issue && issue.type === type) {
                found = true;
                console.log(`\n📋 Issue: ${issue.message}`);
                console.log(`📁 Location: ${issue.file}`);
                
                fixes.forEach((fix, index) => {
                    console.log(`\n  ${index + 1}. ${fix.title}`);
                    console.log(`     💡 ${fix.description}`);
                    console.log(`     🔨 Command: ${fix.command}`);
                    
                    if (fix.code) {
                        console.log(`     📝 Code to add:`);
                        console.log(fix.code.split('\n').map(line => `        ${line}`).join('\n'));
                    }
                });
                
                if (fixes.some(f => f.automatic)) {
                    const apply = await this.askQuestion('     ❓ Apply automatic fixes? (y/n): ');
                    if (apply.toLowerCase() === 'y' || apply.toLowerCase() === 'yes') {
                        await this.applyAutomaticFixes(fixes);
                    }
                }
            }
        }
        
        if (!found) {
            console.log(`No ${type} issues found.`);
        }
    }

    async showAllFixes() {
        console.log('\n🔧 All Available Fixes:');
        console.log('='.repeat(50));
        
        for (const type of Object.keys(this.issueCategories)) {
            await this.showFixesForType(type);
        }
    }

    async applyAutomaticFixes(fixes) {
        for (const fix of fixes) {
            if (fix.automatic && fix.code) {
                try {
                    if (fix.title.includes('ESLint configuration')) {
                        const configPath = path.join(this.config.projectRoot, 'eslint.config.js');
                        fs.writeFileSync(configPath, fix.code);
                        console.log(`     ✅ Created ${configPath}`);
                    } else if (fix.title.includes('.gitignore')) {
                        const gitignorePath = path.join(this.config.projectRoot, '.gitignore');
                        const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
                        fs.writeFileSync(gitignorePath, existing + '\n' + fix.code);
                        console.log(`     ✅ Updated .gitignore`);
                    }
                } catch (error) {
                    console.log(`     ❌ Failed to apply fix: ${error.message}`);
                }
            }
        }
    }

    showHelp() {
        console.log('\n📚 Available Commands:');
        console.log('=====================');
        console.log('help                 - Show this help message');
        console.log('summary/list         - Show issue summary');
        console.log('eslint/config        - Show ESLint/configuration fixes');
        console.log('security             - Show security-related fixes');
        console.log('dependency/npm       - Show dependency fixes');
        console.log('all                  - Show all available fixes');
        console.log('[number]             - Show fix for specific issue number');
        console.log('exit/quit            - End the session');
        console.log('\nYou can also ask natural language questions like:');
        console.log('- "How do I fix the ESLint configuration error?"');
        console.log('- "What security issues were found?"');
        console.log('- "Help me fix all the dependency problems"');
    }

    async searchAndSuggestFixes(query) {
        console.log(`\n🔍 Searching for fixes related to: "${query}"`);
        
        // Simple keyword matching for now
        const keywords = query.toLowerCase().split(' ');
        const relevantFixes = [];
        
        for (const [issueId, fixes] of this.fixSuggestions) {
            const issue = this.findIssueById(issueId);
            if (issue) {
                const issueText = `${issue.message} ${issue.description} ${issue.type}`.toLowerCase();
                if (keywords.some(keyword => issueText.includes(keyword))) {
                    relevantFixes.push({ issue, fixes });
                }
            }
        }
        
        if (relevantFixes.length === 0) {
            console.log('❌ No relevant fixes found. Try "help" for available commands.');
            return;
        }
        
        console.log(`\n💡 Found ${relevantFixes.length} relevant fix(es):`);
        relevantFixes.forEach(({ issue, fixes }, index) => {
            console.log(`\n${index + 1}. ${issue.message}`);
            fixes.forEach((fix, fixIndex) => {
                console.log(`   ${String.fromCharCode(97 + fixIndex)}. ${fix.title} - ${fix.description}`);
            });
        });
    }

    findIssueById(issueId) {
        // This would need to be implemented based on how issues are stored
        // For now, return a mock issue
        return {
            id: issueId,
            type: issueId.includes('eslint') ? 'eslint' : 
                  issueId.includes('security') ? 'security' : 'dependencies',
            message: 'Mock issue for ' + issueId,
            file: 'unknown',
            severity: 'error'
        };
    }

    getCategoryIcon(category) {
        const icons = {
            'Code Quality': '🔍',
            'Code Formatting': '✨',
            'Syntax Errors': '❌',
            'Security Issues': '🔒',
            'Dependency Issues': '📦'
        };
        return icons[category] || '🔧';
    }

    getSeverityIcon(severity) {
        const icons = {
            'critical': '🚨',
            'high': '🔴',
            'error': '❌',
            'medium': '🟡',
            'warn': '⚠️',
            'low': '🔵',
            'info': 'ℹ️'
        };
        return icons[severity] || '❓';
    }

    askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }
}

// CLI usage
if (require.main === module) {
    // Load latest pipeline results
    const reviewDataPath = path.join(process.cwd(), '..', 'logs', 'latest-review-data.json');
    let pipelineResults = null;
    
    if (fs.existsSync(reviewDataPath)) {
        try {
            const reviewData = JSON.parse(fs.readFileSync(reviewDataPath, 'utf8'));
            pipelineResults = reviewData.results;
            console.log(`📊 Loaded pipeline results from ${reviewData.timestamp}`);
        } catch (error) {
            console.log('⚠️ Could not load pipeline results, using mock data');
        }
    }
    
    // Fallback to mock results if no real data available
    if (!pipelineResults) {
        pipelineResults = {
            codeQuality: { success: false },
            securityScan: { success: true, results: {} },
            dependencyCheck: { success: true }
        };
        console.log('📋 Using mock pipeline results for demonstration');
    }
    
    const assistant = new CodeReviewAssistant(pipelineResults, {
        projectRoot: path.resolve(process.cwd(), '..')
    });
    
    assistant.startInteractiveSession().catch(error => {
        console.error('❌ Code review assistant error:', error);
        process.exit(1);
    });
}

module.exports = CodeReviewAssistant;
