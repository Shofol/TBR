/**
 * Build and deployment optimizations for third-party hosting
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Verify build artifacts are present and valid
 */
export function validateBuildArtifacts(): boolean {
  const requiredFiles = [
    'dist/index.js',          // Server bundle
    'dist/public/index.html', // Client HTML
    'dist/public/assets'      // Client assets directory
  ];

  const missingFiles: string[] = [];
  
  for (const file of requiredFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(fullPath)) {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length > 0) {
    console.error('❌ Missing build artifacts:');
    missingFiles.forEach(file => console.error(`  - ${file}`));
    console.error('\nRun "npm run build" to create these files.');
    return false;
  }

  console.log('✅ All build artifacts are present');
  return true;
}

/**
 * Create production-ready package.json for deployment
 */
export function createProductionPackageJson(): void {
  const sourcePackagePath = path.resolve(process.cwd(), 'package.json');
  const distPackagePath = path.resolve(process.cwd(), 'dist', 'package.json');

  if (!fs.existsSync(sourcePackagePath)) {
    console.error('❌ Source package.json not found');
    return;
  }

  const sourcePackage = JSON.parse(fs.readFileSync(sourcePackagePath, 'utf-8'));
  
  // Create production-only package.json
  const prodPackage = {
    name: sourcePackage.name,
    version: sourcePackage.version,
    type: sourcePackage.type,
    main: 'index.js',
    scripts: {
      start: 'node index.js'
    },
    dependencies: Object.fromEntries(
      Object.entries(sourcePackage.dependencies).filter(([key]) => 
        // Only include runtime dependencies, exclude dev tools
        !key.startsWith('@types/') &&
        !key.includes('vite') &&
        !key.includes('esbuild') &&
        !key.includes('typescript') &&
        key !== 'tsx' &&
        key !== 'drizzle-kit'
      )
    ),
    engines: {
      node: '>=18.0.0'
    }
  };

  // Ensure dist directory exists
  const distDir = path.dirname(distPackagePath);
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  fs.writeFileSync(distPackagePath, JSON.stringify(prodPackage, null, 2));
  console.log('✅ Created production package.json');
}

/**
 * Generate deployment verification script
 */
export function createDeploymentVerification(): void {
  const verificationScript = `#!/usr/bin/env node
/**
 * FastComet Deployment Verification Script
 * Run this after uploading files to verify the deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying TubeBenderReviews deployment...');

// Check required files
const requiredFiles = [
  'index.js',
  'package.json',
  '.env',
  'public/index.html'
];

let allFilesPresent = true;

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, '(MISSING)');
    allFilesPresent = false;
  }
}

// Check environment variables
console.log('\\n🔧 Checking environment variables...');
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log('✅', envVar);
  } else {
    console.log('❌', envVar, '(MISSING)');
    allFilesPresent = false;
  }
}

// Check Node.js version
console.log('\\n📦 Node.js version:', process.version);
if (parseInt(process.version.slice(1)) >= 18) {
  console.log('✅ Node.js version is compatible');
} else {
  console.log('❌ Node.js version should be 18 or higher');
  allFilesPresent = false;
}

// Final result
console.log('\\n' + '='.repeat(50));
if (allFilesPresent) {
  console.log('🎉 Deployment verification PASSED');
  console.log('💡 You can now start the application with: node index.js');
} else {
  console.log('❌ Deployment verification FAILED');
  console.log('💡 Please fix the missing files/variables and try again');
  process.exit(1);
}
`;

  fs.writeFileSync('dist/verify-deployment.js', verificationScript);
  fs.chmodSync('dist/verify-deployment.js', '755');
  console.log('✅ Created deployment verification script');
}

/**
 * Optimize bundle size for shared hosting
 */
export function optimizeBundleSize(): void {
  const distPath = path.resolve(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ dist directory not found. Run npm run build first.');
    return;
  }

  // Get bundle sizes
  const indexJsPath = path.join(distPath, 'index.js');
  const publicDir = path.join(distPath, 'public');

  if (fs.existsSync(indexJsPath)) {
    const serverSize = fs.statSync(indexJsPath).size;
    console.log(`📦 Server bundle: ${Math.round(serverSize / 1024)}KB`);
  }

  if (fs.existsSync(publicDir)) {
    const getDirectorySize = (dir: string): number => {
      let size = 0;
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          size += getDirectorySize(filePath);
        } else {
          size += stat.size;
        }
      }
      
      return size;
    };

    const clientSize = getDirectorySize(publicDir);
    console.log(`🌐 Client bundle: ${Math.round(clientSize / 1024)}KB`);
    
    const totalSize = (fs.statSync(indexJsPath).size + clientSize) / 1024;
    console.log(`📊 Total deployment size: ${Math.round(totalSize)}KB`);
    
    if (totalSize > 50000) { // 50MB
      console.warn('⚠️  Bundle size is large for shared hosting. Consider optimization.');
    } else {
      console.log('✅ Bundle size is optimized for shared hosting');
    }
  }
}

/**
 * Full build validation and optimization process
 */
export function validateAndOptimizeBuild(): boolean {
  console.log('🔨 Validating and optimizing build for FastComet deployment...');
  
  // Step 1: Validate build artifacts
  if (!validateBuildArtifacts()) {
    return false;
  }
  
  // Step 2: Create production package.json
  createProductionPackageJson();
  
  // Step 3: Create deployment verification script
  createDeploymentVerification();
  
  // Step 4: Analyze bundle size
  optimizeBundleSize();
  
  console.log('✅ Build validation and optimization complete');
  return true;
}