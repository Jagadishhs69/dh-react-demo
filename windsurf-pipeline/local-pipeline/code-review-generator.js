#!/usr/bin/env node

/**
 * Code Review Report Generator for Windsurf CI/CD Pipeline
 * Generates comprehensive markdown reports with issue summaries and fix suggestions
 */

const fs = require('fs');
const path = require('path');

class CodeReviewGenerator {
    constructor(options = {}) {
        this.config = {
            projectRoot: options.projectRoot || path.resolve(process.cwd(), '..'),
            outputDir: options.outputDir || path.join(process.cwd(), '../reports'),
            ...options
        };
        
        // Ensure output directory exists
        if (!fs.existsSync(this.config.outputDir)) {
            fs.mkdirSync(this.config.outputDir, { recursive: true });
        }
    }

    generateReport(pipelineResults, runTimestamp) {
        const reportData = this.analyzeResults(pipelineResults);
        const markdown = this.generateMarkdown(reportData, runTimestamp);
        
        // Generate local timestamp format: YYYY-MM-DD-HH-MM
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const localTimestamp = `${year}-${month}-${day}-${hours}-${minutes}`;
        
        const reportFileName = `code-review-${localTimestamp}.md`;
        const reportPath = path.join(this.config.outputDir, reportFileName);
        
        fs.writeFileSync(reportPath, markdown);
        
        return {
            reportPath,
            reportData,
            localTimestamp
        };
    }

    analyzeResults(results) {
        const stageResults = [
            { name: 'Language Detection', key: 'languageDetection', icon: '🔍' },
            { name: 'Dependency Check', key: 'dependencyCheck', icon: '📦' },
            { name: 'Code Quality', key: 'codeQuality', icon: '✨' },
            { name: 'NPM Version Scan', key: 'npmVersionScan', icon: '🔄' },
            { name: 'Secret Detection', key: 'secretDetection', icon: '🔐' },
            { name: 'SAST Scan', key: 'sastScan', icon: '🛡️' }
        ];

        const analysis = {
            overall: results.overall || 'unknown',
            timestamp: new Date().toISOString(),
            summary: {
                totalIssues: 0,
                criticalIssues: 0,
                warnings: 0,
                suggestions: 0
            },
            stages: {},
            cascadePrompts: [],
            quickActions: []
        };

        // Analyze each stage
        if (results.languageDetection) {
            analysis.stages.languageDetection = this.analyzeLanguageDetection(results.languageDetection);
        }

        if (results.dependencyCheck) {
            analysis.stages.dependencyCheck = this.analyzeDependencyCheck(results.dependencyCheck);
        }

        if (results.codeQuality) {
            analysis.stages.codeQuality = this.analyzeCodeQuality(results.codeQuality);
        }

        if (results.npmVersionScan) {
            analysis.stages.npmVersionScan = this.analyzeNpmVersionScan(results.npmVersionScan);
        }

        if (results.secretDetection) {
            analysis.stages.secretDetection = this.analyzeSecretDetection(results.secretDetection);
        }

        if (results.sastScan) {
            analysis.stages.sastScan = this.analyzeSastScan(results.sastScan);
        }

        if (results.defectDojoUpload) {
            analysis.stages.defectDojoUpload = this.analyzeDefectDojoUpload(results.defectDojoUpload);
        }

        if (results.securityScan) {
            analysis.stages.securityScan = this.analyzeSecurityScan(results.securityScan);
        }

        // Generate cascade prompts and quick actions
        this.generateFixSuggestions(analysis);
        
        // Calculate summary totals
        this.calculateSummaryTotals(analysis);

        return analysis;
    }

    analyzeLanguageDetection(langResult) {
        return {
            status: langResult.success ? 'success' : 'failed',
            languages: langResult.languages || [],
            primaryLanguage: langResult.primaryLanguage || 'unknown',
            detectedFiles: langResult.detectedFiles || [],
            issues: langResult.success ? [] : ['No supported languages detected'],
            suggestions: langResult.languages?.length > 0 ? [] : ['Add package.json, requirements.txt, or other language-specific files']
        };
    }

    analyzeDependencyCheck(depResult) {
        const analysis = {
            status: depResult.success ? 'success' : 'failed',
            issues: [],
            warnings: [],
            suggestions: []
        };

        if (depResult.results) {
            Object.entries(depResult.results).forEach(([lang, result]) => {
                if (!result.success) {
                    if (result.error) {
                        analysis.issues.push(`${lang}: ${result.error}`);
                    }
                    if (result.audit && !result.audit.success) {
                        analysis.issues.push(`${lang}: Security vulnerabilities found in dependencies`);
                    }
                }
                if (result.vulnerabilities) {
                    analysis.warnings.push(`${lang}: Potential security vulnerabilities detected`);
                }
            });
        }

        return analysis;
    }

    analyzeCodeQuality(cqResult) {
        const analysis = {
            status: cqResult.success ? 'success' : 'failed',
            issues: [],
            warnings: [],
            suggestions: []
        };

        if (cqResult.results) {
            Object.entries(cqResult.results).forEach(([lang, result]) => {
                if (!result.success && result.results) {
                    Object.entries(result.results).forEach(([tool, toolResult]) => {
                        if (!toolResult.success && !toolResult.skipped) {
                            if (tool === 'eslint') {
                                analysis.issues.push(`ESLint configuration missing or errors found`);
                                analysis.suggestions.push(`Run 'npx eslint --init' to set up ESLint configuration`);
                            }
                            if (tool === 'prettier') {
                                analysis.warnings.push(`Code formatting issues detected`);
                                analysis.suggestions.push(`Run 'npx prettier --write .' to fix formatting`);
                            }
                            if (tool === 'syntax') {
                                analysis.issues.push(`JavaScript syntax errors found`);
                            }
                        }
                    });
                }
            });
        }

        return analysis;
    }

    analyzeNpmVersionScan(npmResult) {
        const analysis = {
            status: npmResult.success ? 'success' : 'failed',
            issues: [],
            warnings: [],
            suggestions: []
        };

        if (npmResult.results && npmResult.results.nodejs) {
            const result = npmResult.results.nodejs;
            if (!result.success) {
                if (result.outdatedPackages && result.outdatedPackages.length > 0) {
                    analysis.warnings.push(`${result.outdatedPackages.length} outdated packages found`);
                    analysis.suggestions.push(`Run 'npm update' to update packages`);
                }
                if (result.vulnerablePackages && result.vulnerablePackages.length > 0) {
                    analysis.issues.push(`${result.vulnerablePackages.length} vulnerable packages detected`);
                    analysis.suggestions.push(`Run 'npm audit fix' to resolve vulnerabilities`);
                }
            }
        }

        return analysis;
    }

    analyzeSecretDetection(secretResult) {
        const analysis = {
            status: secretResult.success ? 'success' : 'failed',
            issues: [],
            warnings: [],
            suggestions: []
        };

        if (secretResult.results && secretResult.results.secretScan) {
            const result = secretResult.results.secretScan;
            if (result.secrets && result.secrets.length > 0) {
                analysis.issues.push(`${result.secrets.length} potential secrets detected`);
                analysis.suggestions.push(`Move secrets to environment variables or secure vaults`);
            }
            if (result.sensitiveFiles && result.sensitiveFiles.length > 0) {
                analysis.warnings.push(`${result.sensitiveFiles.length} sensitive files found`);
                analysis.suggestions.push(`Add sensitive files to .gitignore`);
            }
        }

        return analysis;
    }

    analyzeSastScan(sastResult) {
        const analysis = {
            status: sastResult.success ? 'success' : 'failed',
            issues: [],
            warnings: [],
            suggestions: [],
            coverage: null
        };

        if (sastResult.results && sastResult.results.coverage) {
            const result = sastResult.results.coverage;
            
            if (result.success) {
                analysis.coverage = {
                    totalFiles: result.summary.totalFiles,
                    totalLines: result.summary.totalLines,
                    totalCodeLines: result.summary.totalCodeLines,
                    codeToTotalRatio: result.summary.codeToTotalRatio,
                    averageComplexity: result.summary.averageComplexity,
                    fileTypes: result.summary.fileTypes,
                    largestFile: result.summary.largestFile,
                    mostComplexFile: result.summary.mostComplexFile,
                    filesByType: result.coverage.filesByType
                };
                
                // Provide insights based on analysis
                if (result.summary.averageComplexity > 10) {
                    analysis.warnings.push(`High average code complexity: ${result.summary.averageComplexity}`);
                    analysis.suggestions.push(`Consider refactoring complex functions to improve maintainability`);
                }
                
                if (result.summary.codeToTotalRatio < 60) {
                    analysis.warnings.push(`Low code density: ${result.summary.codeToTotalRatio}% code lines`);
                    analysis.suggestions.push(`Consider reviewing file structure - many empty or comment-only files detected`);
                }
                
                if (result.summary.totalFiles > 100) {
                    analysis.suggestions.push(`Large codebase detected (${result.summary.totalFiles} files) - consider implementing automated testing`);
                }
                
                analysis.suggestions.push(`Code analysis completed - ${result.summary.totalCodeLines} lines analyzed across ${result.summary.fileTypes} file types`);
            } else {
                analysis.issues.push(`Code coverage analysis failed: ${result.error}`);
            }
        } else if (!sastResult.success) {
            analysis.issues.push(`Code coverage analysis failed - unable to analyze source files`);
            analysis.suggestions.push(`Check that source files exist and are readable`);
        }

        return analysis;
    }

    analyzeDefectDojoUpload(defectDojoResult) {
        const analysis = {
            status: defectDojoResult.success ? 'success' : 'failed',
            issues: [],
            warnings: [],
            suggestions: [],
            defectDojoUrls: []
        };

        if (defectDojoResult.success) {
            const totalFindings = Object.values(defectDojoResult.results || {})
                .filter(result => result.success)
                .reduce((sum, result) => sum + (result.findingsCount || 0), 0);
            
            if (totalFindings > 0) {
                analysis.warnings.push(`${totalFindings} findings uploaded to DefectDojo for tracking`);
                analysis.suggestions.push(`Review findings in DefectDojo dashboard for detailed analysis`);
            }

            // Collect DefectDojo URLs
            Object.values(defectDojoResult.results || {}).forEach(result => {
                if (result.success && result.defectDojoUrl) {
                    analysis.defectDojoUrls.push(result.defectDojoUrl);
                }
            });

            if (analysis.defectDojoUrls.length > 0) {
                analysis.suggestions.push(`Access DefectDojo for vulnerability management and tracking`);
            }
        } else {
            analysis.issues.push(`Failed to upload scan results to DefectDojo`);
            analysis.suggestions.push(`Check DefectDojo configuration and connectivity`);
            
            // Check for specific upload failures
            Object.entries(defectDojoResult.results || {}).forEach(([scanType, result]) => {
                if (!result.success) {
                    analysis.issues.push(`${scanType} upload failed: ${result.error || 'Unknown error'}`);
                }
            });
        }

        return analysis;
    }

    analyzeSecurityScan(secResult) {
        const analysis = {
            status: secResult.success ? 'success' : 'failed',
            issues: [],
            warnings: [],
            suggestions: []
        };

        if (secResult.results) {
            Object.entries(secResult.results).forEach(([key, result]) => {
                if (key === 'basic' && result.issues) {
                    result.issues.forEach(issue => {
                        analysis.warnings.push(`Security: ${issue}`);
                    });
                }
                if (!result.success && result.audit) {
                    analysis.issues.push(`${key}: Security vulnerabilities in dependencies`);
                    analysis.suggestions.push(`Run 'npm audit fix' to resolve security issues`);
                }
            });
        }

        return analysis;
    }

    generateFixSuggestions(analysis) {
        // Generate Cascade-ready prompts
        const prompts = [];
        const quickActions = [];

        // ESLint issues
        if (analysis.stages.codeQuality?.issues.some(issue => issue.includes('ESLint'))) {
            prompts.push({
                title: "Fix ESLint Configuration",
                prompt: "I have ESLint configuration issues in my project. Please help me set up a proper ESLint configuration file (eslint.config.js) that works with ESLint v9+ and includes appropriate rules for my Node.js project. Also fix any linting errors found in the codebase.",
                priority: "high",
                category: "code-quality"
            });
            
            quickActions.push({
                title: "Set up ESLint v9 Configuration",
                commands: [
                    "npm install --save-dev eslint",
                    "npx eslint --init"
                ],
                description: "Install ESLint and create configuration"
            });
        }

        // Prettier issues
        if (analysis.stages.codeQuality?.warnings.some(warning => warning.includes('formatting'))) {
            prompts.push({
                title: "Fix Code Formatting",
                prompt: "My code has formatting issues detected by Prettier. Please help me format all JavaScript/TypeScript files in my project according to standard formatting rules and set up Prettier configuration for consistent formatting.",
                priority: "medium",
                category: "code-quality"
            });
            
            quickActions.push({
                title: "Format Code with Prettier",
                commands: [
                    "npm install --save-dev prettier",
                    "npx prettier --write ."
                ],
                description: "Install Prettier and format all files"
            });
        }

        // Security issues
        if (analysis.stages.securityScan?.issues.length > 0) {
            prompts.push({
                title: "Fix Security Vulnerabilities",
                prompt: "My project has security vulnerabilities in dependencies. Please help me identify and fix all security issues, update vulnerable packages to secure versions, and implement security best practices.",
                priority: "critical",
                category: "security"
            });
            
            quickActions.push({
                title: "Fix Security Vulnerabilities",
                commands: [
                    "npm audit",
                    "npm audit fix",
                    "npm audit fix --force"
                ],
                description: "Audit and fix security vulnerabilities"
            });
        }

        // Dependency issues
        if (analysis.stages.dependencyCheck?.issues.length > 0) {
            prompts.push({
                title: "Fix Dependency Issues",
                prompt: "My project has dependency management issues. Please help me resolve missing dependencies, fix package.json configuration, and ensure all required packages are properly installed and configured.",
                priority: "high",
                category: "dependencies"
            });
            
            quickActions.push({
                title: "Fix Dependencies",
                commands: [
                    "npm install",
                    "npm update",
                    "npm dedupe"
                ],
                description: "Install and update dependencies"
            });
        }

        analysis.cascadePrompts = prompts;
        analysis.quickActions = quickActions;
    }

    calculateSummaryTotals(analysis) {
        let totalIssues = 0;
        let criticalIssues = 0;
        let warnings = 0;
        let suggestions = 0;

        Object.values(analysis.stages).forEach(stage => {
            if (stage.issues) {
                totalIssues += stage.issues.length;
                // Count critical issues (security and syntax errors)
                criticalIssues += stage.issues.filter(issue => 
                    issue.toLowerCase().includes('security') || 
                    issue.toLowerCase().includes('syntax') ||
                    issue.toLowerCase().includes('vulnerability')
                ).length;
            }
            if (stage.warnings) {
                warnings += stage.warnings.length;
            }
            if (stage.suggestions) {
                suggestions += stage.suggestions.length;
            }
        });

        analysis.summary = {
            totalIssues,
            criticalIssues,
            warnings,
            suggestions
        };
    }

    generateMarkdown(reportData, runTimestamp) {
        const timestamp = new Date().toLocaleString();
        const statusEmoji = {
            'success': '✅',
            'failed': '❌',
            'error': '💥',
            'unknown': '❓'
        };

        let markdown = `# 🔍 Code Review Report

**Generated:** ${timestamp}  
**Run ID:** ${runTimestamp}  
**Overall Status:** ${statusEmoji[reportData.overall]} ${reportData.overall.toUpperCase()}

---

## 📊 Executive Summary

| Metric                    | Count |
|---------------------------|-------|
| 🚨 Critical Issues        | ${reportData.summary.criticalIssues}     |
| ⚠️ Total Issues           | ${reportData.summary.totalIssues}     |
| 💡 Warnings               | ${reportData.summary.warnings}     |
| 📝 Suggestions            | ${reportData.summary.suggestions}     |

---

## 🎯 Pipeline Stage Results

`;

        // Language Detection
        if (reportData.stages.languageDetection) {
            const stage = reportData.stages.languageDetection;
            markdown += `### ${statusEmoji[stage.status]} Language Detection

**Status:** ${stage.status.toUpperCase()}  
**Languages:** ${stage.languages.join(', ') || 'None detected'}  
**Primary:** ${stage.primaryLanguage}

`;
            if (stage.issues.length > 0) {
                markdown += `**Issues:**\n${stage.issues.map(issue => `- ❌ ${issue}`).join('\n')}\n\n`;
            }
            if (stage.suggestions.length > 0) {
                markdown += `**Suggestions:**\n${stage.suggestions.map(suggestion => `- 💡 ${suggestion}`).join('\n')}\n\n`;
            }
        }

        // Dependency Check
        if (reportData.stages.dependencyCheck) {
            const stage = reportData.stages.dependencyCheck;
            markdown += `### ${statusEmoji[stage.status]} Dependency Check

**Status:** ${stage.status.toUpperCase()}

`;
            if (stage.issues.length > 0) {
                markdown += `**Issues:**\n${stage.issues.map(issue => `- ❌ ${issue}`).join('\n')}\n\n`;
            }
            if (stage.warnings.length > 0) {
                markdown += `**Warnings:**\n${stage.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}\n\n`;
            }
        }

        // Code Quality
        if (reportData.stages.codeQuality) {
            const stage = reportData.stages.codeQuality;
            markdown += `### ${statusEmoji[stage.status]} Code Quality

**Status:** ${stage.status.toUpperCase()}

`;
            if (stage.issues.length > 0) {
                markdown += `**Issues:**\n${stage.issues.map(issue => `- ❌ ${issue}`).join('\n')}\n\n`;
            }
            if (stage.warnings.length > 0) {
                markdown += `**Warnings:**\n${stage.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}\n\n`;
            }
            if (stage.suggestions.length > 0) {
                markdown += `**Suggestions:**\n${stage.suggestions.map(suggestion => `- 💡 ${suggestion}`).join('\n')}\n\n`;
            }
        }

        // NPM Version Scan
        if (reportData.stages.npmVersionScan) {
            const stage = reportData.stages.npmVersionScan;
            markdown += `### ${statusEmoji[stage.status]} NPM Version Scan

**Status:** ${stage.status.toUpperCase()}

`;
            if (stage.issues.length > 0) {
                markdown += `**Issues:**\n${stage.issues.map(issue => `- ❌ ${issue}`).join('\n')}\n\n`;
            }
            if (stage.warnings.length > 0) {
                markdown += `**Warnings:**\n${stage.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}\n\n`;
            }
            if (stage.suggestions.length > 0) {
                markdown += `**Suggestions:**\n${stage.suggestions.map(suggestion => `- 💡 ${suggestion}`).join('\n')}\n\n`;
            }
        }

        // Secret Detection
        if (reportData.stages.secretDetection) {
            const stage = reportData.stages.secretDetection;
            markdown += `### ${statusEmoji[stage.status]} Secret Detection

**Status:** ${stage.status.toUpperCase()}

`;
            if (stage.issues.length > 0) {
                markdown += `**Issues:**\n${stage.issues.map(issue => `- 🚨 ${issue}`).join('\n')}\n\n`;
            }
            if (stage.warnings.length > 0) {
                markdown += `**Warnings:**\n${stage.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}\n\n`;
            }
            if (stage.suggestions.length > 0) {
                markdown += `**Suggestions:**\n${stage.suggestions.map(suggestion => `- 💡 ${suggestion}`).join('\n')}\n\n`;
            }
        }

        // Code Analysis (formerly SAST Scan)
        if (reportData.stages.sastScan) {
            const stage = reportData.stages.sastScan;
            markdown += `### ${statusEmoji[stage.status]} Code Analysis

**Status:** ${stage.status.toUpperCase()}

`;
            // Add coverage information if available
            if (stage.coverage) {
                markdown += `**Code Analysis Results:**
- 📁 **Total Files:** ${stage.coverage.totalFiles}
- 📝 **Total Lines:** ${stage.coverage.totalLines}
- 💻 **Code Lines:** ${stage.coverage.totalCodeLines} (${stage.coverage.codeToTotalRatio}%)
- 🔄 **Average Complexity:** ${stage.coverage.averageComplexity}
- 🎯 **File Types:** ${stage.coverage.fileTypes}

`;
                // Add file type breakdown if available
                if (stage.coverage.filesByType && Object.keys(stage.coverage.filesByType).length > 0) {
                    markdown += `**Analysis by File Type:**\n`;
                    Object.entries(stage.coverage.filesByType).forEach(([ext, data]) => {
                        const codeRatio = Math.round((data.codeLines / data.totalLines) * 100);
                        markdown += `- **${ext}:** ${data.count} files, ${data.codeLines} code lines (${codeRatio}%)\n`;
                    });
                    markdown += '\n';
                }

                if (stage.coverage.largestFile) {
                    markdown += `**Largest File:** ${stage.coverage.largestFile.file} (${stage.coverage.largestFile.totalLines} lines)\n`;
                }

                if (stage.coverage.mostComplexFile) {
                    markdown += `**Most Complex:** ${stage.coverage.mostComplexFile.file} (complexity: ${stage.coverage.mostComplexFile.complexity})\n\n`;
                }
            }

            if (stage.issues.length > 0) {
                markdown += `**Issues:**\n${stage.issues.map(issue => `- 🚨 ${issue}`).join('\n')}\n\n`;
            }
            if (stage.warnings.length > 0) {
                markdown += `**Warnings:**\n${stage.warnings.map(warning => `- ⚠️ ${warning}`).join('\n')}\n\n`;
            }
            if (stage.suggestions.length > 0) {
                markdown += `**Suggestions:**\n${stage.suggestions.map(suggestion => `- 💡 ${suggestion}`).join('\n')}\n\n`;
            }
        }


        // Cascade Prompts Section
        if (reportData.cascadePrompts.length > 0) {
            markdown += `---

## 🤖 Ready-to-Copy Cascade Prompts

Copy and paste these prompts directly into Cascade to get AI-powered fix suggestions:

`;
            reportData.cascadePrompts.forEach((prompt, index) => {
                const priorityEmoji = {
                    'critical': '🚨',
                    'high': '🔥',
                    'medium': '⚡',
                    'low': '💡'
                };
                
                markdown += `### ${priorityEmoji[prompt.priority]} ${prompt.title}

**Priority:** ${prompt.priority.toUpperCase()}  
**Category:** ${prompt.category}

\`\`\`
${prompt.prompt}
\`\`\`

`;
            });
        }

        // Quick Actions Section
        if (reportData.quickActions.length > 0) {
            markdown += `---

## ⚡ Quick Action Guide

Run these commands to fix common issues:

`;
            reportData.quickActions.forEach((action, index) => {
                markdown += `### ${index + 1}. ${action.title}

**Description:** ${action.description}

\`\`\`bash
${action.commands.join('\n')}
\`\`\`

`;
            });
        }

        // Step-by-Step Solutions
        markdown += `---

## 📋 Step-by-Step Solutions

### For ESLint v9 Configuration Issues:

1. **Install ESLint v9:**
   \`\`\`bash
   npm install --save-dev eslint@^9.0.0
   \`\`\`

2. **Create eslint.config.js:**
   \`\`\`bash
   npx eslint --init
   \`\`\`

3. **Or create manual config:**
   \`\`\`javascript
   // eslint.config.js
   export default [
     {
       languageOptions: {
         ecmaVersion: 2022,
         sourceType: "module",
         globals: {
           node: true
         }
       },
       rules: {
         "no-unused-vars": "warn",
         "no-console": "off",
         "semi": ["error", "always"]
       }
     }
   ];
   \`\`\`

### For Security Vulnerabilities:

1. **Audit dependencies:**
   \`\`\`bash
   npm audit
   \`\`\`

2. **Fix automatically:**
   \`\`\`bash
   npm audit fix
   \`\`\`

3. **Force fix if needed:**
   \`\`\`bash
   npm audit fix --force
   \`\`\`

### For Code Formatting:

1. **Install Prettier:**
   \`\`\`bash
   npm install --save-dev prettier
   \`\`\`

2. **Format all files:**
   \`\`\`bash
   npx prettier --write .
   \`\`\`

3. **Create .prettierrc.json:**
   \`\`\`json
   {
     "semi": true,
     "singleQuote": true,
     "tabWidth": 2,
     "trailingComma": "es5"
   }
   \`\`\`

---

## 📞 Need Help?

- **Cascade AI:** Use the prompts above for intelligent assistance
- **Documentation:** Check project README and documentation files
- **Logs:** Review detailed logs in \`logs/run-${runTimestamp}/\`

---

*Report generated by Windsurf CI/CD Pipeline v1.0.0*
`;

        return markdown;
    }
}

module.exports = CodeReviewGenerator;
