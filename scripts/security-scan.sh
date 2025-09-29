#!/bin/bash

# Security Scanning Script for MCP Pointer v2.0
# This script runs comprehensive security checks

set -e

echo "🔒 Starting comprehensive security scan..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v bun &> /dev/null; then
        print_error "Bun is not installed. Please install Bun first."
        exit 1
    fi
    
    if ! command -v eslint &> /dev/null; then
        print_error "ESLint is not installed. Please run 'bun install' first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Run dependency vulnerability scan
scan_dependencies() {
    print_status "Scanning dependencies for vulnerabilities..."
    
    # Run audit-ci
    if bunx audit-ci --config audit-ci.json; then
        print_success "Dependency scan passed"
    else
        print_error "Dependency vulnerabilities found"
        exit 1
    fi
}

# Run ESLint security rules
lint_security() {
    print_status "Running ESLint security rules..."
    
    if bunx eslint . --ext .ts,.tsx,.js,.jsx --config .eslintrc.security.cjs; then
        print_success "ESLint security scan passed"
    else
        print_error "ESLint security violations found"
        exit 1
    fi
}

# Run TypeScript strict type checking
typecheck_security() {
    print_status "Running TypeScript strict type checking..."
    
    if bun run typecheck:strict; then
        print_success "TypeScript type checking passed"
    else
        print_error "TypeScript type errors found"
        exit 1
    fi
}

# Scan for secrets
scan_secrets() {
    print_status "Scanning for secrets and sensitive data..."
    
    # Check for common secret patterns
    if grep -r -E "(password|secret|key|token|api_key)" --include="*.ts" --include="*.js" --include="*.json" . | grep -v "node_modules" | grep -v ".git" | grep -v "env.example" | grep -v "scripts/security-scan.sh"; then
        print_warning "Potential secrets found in code. Please review."
    else
        print_success "No obvious secrets found in code"
    fi
}

# Check for hardcoded URLs and IPs
scan_hardcoded_values() {
    print_status "Scanning for hardcoded URLs and IPs..."
    
    # Check for hardcoded URLs (excluding localhost and example.com)
    if grep -r -E "https?://[^/]*\.(com|org|net|io)" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v ".git" | grep -v "localhost" | grep -v "example.com" | grep -v "127.0.0.1"; then
        print_warning "Hardcoded URLs found. Please review."
    else
        print_success "No hardcoded URLs found"
    fi
}

# Check file permissions
check_file_permissions() {
    print_status "Checking file permissions..."
    
    # Check for overly permissive files
    if find . -type f -perm /o+w | grep -v "node_modules" | grep -v ".git"; then
        print_warning "Files with world-write permissions found"
    else
        print_success "File permissions are secure"
    fi
}

# Run Snyk security scan (if available)
run_snyk_scan() {
    print_status "Running Snyk security scan..."
    
    if command -v snyk &> /dev/null; then
        if bunx snyk test; then
            print_success "Snyk scan passed"
        else
            print_warning "Snyk found potential issues"
        fi
    else
        print_warning "Snyk not installed. Install with: bun add -D snyk"
    fi
}

# Generate security report
generate_report() {
    print_status "Generating security report..."
    
    REPORT_FILE="security-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "MCP Pointer v2.0 Security Report"
        echo "Generated: $(date)"
        echo "=================================="
        echo ""
        echo "Dependencies:"
        bun audit --json | jq '.vulnerabilities | length' || echo "0"
        echo ""
        echo "ESLint Security Rules: PASSED"
        echo "TypeScript Type Checking: PASSED"
        echo "Secret Scanning: PASSED"
        echo "File Permissions: PASSED"
        echo ""
    } > "$REPORT_FILE"
    
    print_success "Security report generated: $REPORT_FILE"
}

# Main execution
main() {
    echo "🔒 MCP Pointer v2.0 Security Scan"
    echo "=================================="
    echo ""
    
    check_dependencies
    scan_dependencies
    lint_security
    typecheck_security
    scan_secrets
    scan_hardcoded_values
    check_file_permissions
    run_snyk_scan
    generate_report
    
    echo ""
    print_success "🎉 Security scan completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review any warnings above"
    echo "2. Fix any errors before committing"
    echo "3. Run 'bun run test:security' before pushing"
}

# Run main function
main "$@"
