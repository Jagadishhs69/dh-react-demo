const fs = require('fs');
const path = require('path');

class SimpleCoverage {
    constructor(config = {}) {
        this.config = {
            sourceDir: config.sourceDir || 'src',
            excludePatterns: config.excludePatterns || [
                'node_modules',
                '.git',
                'coverage',
                'dist',
                'build',
                '*.test.js',
                '*.spec.js',
                '*.min.js'
            ],
            supportedExtensions: config.supportedExtensions || [
                '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.go', '.rs', '.php', '.rb', '.cs'
            ]
        };
    }

    async generateCoverage() {
        try {
            const sourceFiles = this.findSourceFiles();
            const analysis = this.analyzeFiles(sourceFiles);
            
            return {
                success: true,
                coverage: analysis,
                summary: this.generateSummary(analysis)
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                coverage: null
            };
        }
    }

    findSourceFiles(dir = this.config.sourceDir) {
        const files = [];
        
        if (!fs.existsSync(dir)) {
            return files;
        }

        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                if (!this.isExcluded(item)) {
                    files.push(...this.findSourceFiles(fullPath));
                }
            } else if (stat.isFile()) {
                const ext = path.extname(item);
                if (this.config.supportedExtensions.includes(ext) && !this.isExcluded(item)) {
                    files.push(fullPath);
                }
            }
        }
        
        return files;
    }

    isExcluded(fileName) {
        return this.config.excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(fileName);
            }
            return fileName.includes(pattern);
        });
    }

    analyzeFiles(files) {
        const analysis = {
            totalFiles: files.length,
            filesByType: {},
            detailedAnalysis: []
        };

        for (const file of files) {
            const ext = path.extname(file);
            const fileAnalysis = this.analyzeFile(file);
            
            if (!analysis.filesByType[ext]) {
                analysis.filesByType[ext] = {
                    count: 0,
                    totalLines: 0,
                    codeLines: 0,
                    commentLines: 0,
                    emptyLines: 0
                };
            }
            
            analysis.filesByType[ext].count++;
            analysis.filesByType[ext].totalLines += fileAnalysis.totalLines;
            analysis.filesByType[ext].codeLines += fileAnalysis.codeLines;
            analysis.filesByType[ext].commentLines += fileAnalysis.commentLines;
            analysis.filesByType[ext].emptyLines += fileAnalysis.emptyLines;
            
            analysis.detailedAnalysis.push({
                file: path.relative(process.cwd(), file),
                ...fileAnalysis
            });
        }

        return analysis;
    }

    analyzeFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            const ext = path.extname(filePath);
            
            let codeLines = 0;
            let commentLines = 0;
            let emptyLines = 0;
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (trimmed === '') {
                    emptyLines++;
                } else if (this.isCommentLine(trimmed, ext)) {
                    commentLines++;
                } else {
                    codeLines++;
                }
            }
            
            return {
                totalLines: lines.length,
                codeLines,
                commentLines,
                emptyLines,
                complexity: this.calculateComplexity(content, ext)
            };
        } catch (error) {
            return {
                totalLines: 0,
                codeLines: 0,
                commentLines: 0,
                emptyLines: 0,
                complexity: 0,
                error: error.message
            };
        }
    }

    isCommentLine(line, ext) {
        const commentPatterns = {
            '.js': ['//', '/*', '*/', '*'],
            '.ts': ['//', '/*', '*/', '*'],
            '.jsx': ['//', '/*', '*/', '*'],
            '.tsx': ['//', '/*', '*/', '*'],
            '.py': ['#', '"""', "'''"],
            '.java': ['//', '/*', '*/', '*'],
            '.go': ['//', '/*', '*/', '*'],
            '.rs': ['//', '/*', '*/', '*'],
            '.php': ['//', '#', '/*', '*/', '*'],
            '.rb': ['#'],
            '.cs': ['//', '/*', '*/', '*']
        };
        
        const patterns = commentPatterns[ext] || ['//', '#'];
        return patterns.some(pattern => line.startsWith(pattern));
    }

    calculateComplexity(content, ext) {
        // Simple cyclomatic complexity approximation
        const complexityPatterns = {
            '.js': ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
            '.ts': ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?'],
            '.py': ['if', 'elif', 'else', 'for', 'while', 'try', 'except', 'and', 'or'],
            '.java': ['if', 'else', 'for', 'while', 'switch', 'case', 'catch', '&&', '||', '?']
        };
        
        const patterns = complexityPatterns[ext] || ['if', 'else', 'for', 'while'];
        let complexity = 1; // Base complexity
        
        for (const pattern of patterns) {
            try {
                // Escape special regex characters for operators like &&, ||, ?
                const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`\\b${escapedPattern}\\b`, 'g');
                const matches = content.match(regex);
                if (matches) {
                    complexity += matches.length;
                }
            } catch (error) {
                // Skip patterns that can't form valid regex
                continue;
            }
        }
        
        return complexity;
    }

    generateSummary(analysis) {
        const totalLines = Object.values(analysis.filesByType).reduce((sum, type) => sum + type.totalLines, 0);
        const totalCodeLines = Object.values(analysis.filesByType).reduce((sum, type) => sum + type.codeLines, 0);
        const totalComplexity = analysis.detailedAnalysis.reduce((sum, file) => sum + file.complexity, 0);
        
        return {
            totalFiles: analysis.totalFiles,
            totalLines,
            totalCodeLines,
            averageComplexity: analysis.totalFiles > 0 ? Math.round(totalComplexity / analysis.totalFiles) : 0,
            codeToTotalRatio: totalLines > 0 ? Math.round((totalCodeLines / totalLines) * 100) : 0,
            fileTypes: Object.keys(analysis.filesByType).length,
            largestFile: this.findLargestFile(analysis.detailedAnalysis),
            mostComplexFile: this.findMostComplexFile(analysis.detailedAnalysis)
        };
    }

    findLargestFile(files) {
        return files.reduce((largest, current) => 
            current.totalLines > (largest?.totalLines || 0) ? current : largest, null);
    }

    findMostComplexFile(files) {
        return files.reduce((mostComplex, current) => 
            current.complexity > (mostComplex?.complexity || 0) ? current : mostComplex, null);
    }

    generateReport(coverage) {
        if (!coverage.success) {
            return `❌ Coverage analysis failed: ${coverage.error}`;
        }

        const { summary, coverage: analysis } = coverage;
        
        let report = `📊 **Code Coverage Analysis**\n\n`;
        report += `**Summary:**\n`;
        report += `- 📁 Total Files: ${summary.totalFiles}\n`;
        report += `- 📝 Total Lines: ${summary.totalLines}\n`;
        report += `- 💻 Code Lines: ${summary.totalCodeLines} (${summary.codeToTotalRatio}%)\n`;
        report += `- 🔄 Average Complexity: ${summary.averageComplexity}\n`;
        report += `- 🎯 File Types: ${summary.fileTypes}\n\n`;

        report += `**By File Type:**\n`;
        for (const [ext, data] of Object.entries(analysis.filesByType)) {
            const codeRatio = Math.round((data.codeLines / data.totalLines) * 100);
            report += `- ${ext}: ${data.count} files, ${data.codeLines} code lines (${codeRatio}%)\n`;
        }

        if (summary.largestFile) {
            report += `\n**Largest File:** ${summary.largestFile.file} (${summary.largestFile.totalLines} lines)\n`;
        }

        if (summary.mostComplexFile) {
            report += `**Most Complex:** ${summary.mostComplexFile.file} (complexity: ${summary.mostComplexFile.complexity})\n`;
        }

        return report;
    }
}

module.exports = SimpleCoverage;
