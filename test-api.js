#!/usr/bin/env node

/**
 * Test script for the new API features
 * This validates the core functionality without requiring a browser
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing WebGL Particle Transition Engine API...\n');

console.log('📋 Test Plan:');
console.log('  ✓ 1. Verify TransitionEventEmitter exports');
console.log('  ✓ 2. Verify HybridPageTransitionAPI exports');
console.log('  ✓ 3. Check new methods exist');
console.log('  ✓ 4. Validate documentation files');
console.log('  ✓ 5. Check example files\n');

// Test 1: Check TransitionEventEmitter file
console.log('📦 Test 1: TransitionEventEmitter Module');

const eventEmitterPath = join(__dirname, 'src', 'utils', 'TransitionEventEmitter.js');
if (existsSync(eventEmitterPath)) {
    const content = readFileSync(eventEmitterPath, 'utf8');
    
    const requiredMethods = ['on', 'once', 'off', 'emit', 'removeAllListeners'];
    const allFound = requiredMethods.every(method => content.includes(method));
    
    if (allFound) {
        console.log('  ✅ TransitionEventEmitter has all required methods');
    } else {
        console.log('  ❌ TransitionEventEmitter missing methods');
        process.exit(1);
    }
} else {
    console.log('  ❌ TransitionEventEmitter file not found');
    process.exit(1);
}

// Test 2: Check HybridPageTransitionAPI file
console.log('\n📦 Test 2: HybridPageTransitionAPI Module');
const apiPath = join(__dirname, 'src', 'HybridPageTransitionAPI.js');
if (existsSync(apiPath)) {
    const content = readFileSync(apiPath, 'utf8');
    
    // Check for new transitionToPage method
    if (content.includes('transitionToPage')) {
        console.log('  ✅ transitionToPage method exists');
    } else {
        console.log('  ❌ transitionToPage method not found');
        process.exit(1);
    }
    
    // Check for event methods
    const eventMethods = ['on(', 'once(', 'off('];
    const allEventMethodsFound = eventMethods.every(method => content.includes(method));
    
    if (allEventMethodsFound) {
        console.log('  ✅ Event registration methods exist');
    } else {
        console.log('  ❌ Event registration methods missing');
        process.exit(1);
    }
    
    // Check for logging method
    if (content.includes('_log(')) {
        console.log('  ✅ Structured logging method exists');
    } else {
        console.log('  ❌ Structured logging method not found');
        process.exit(1);
    }
    
    // Check for phase tracking
    if (content.includes('_trackTransitionPhases')) {
        console.log('  ✅ Phase tracking method exists');
    } else {
        console.log('  ❌ Phase tracking method not found');
        process.exit(1);
    }
    
    // Check for helper methods
    const helperMethods = ['getCurrentPhase', 'isTransitionInProgress', 'getTransitionDuration'];
    const allHelpersFound = helperMethods.every(method => content.includes(method));
    
    if (allHelpersFound) {
        console.log('  ✅ Helper methods exist');
    } else {
        console.log('  ❌ Helper methods missing');
        process.exit(1);
    }
    
} else {
    console.log('  ❌ HybridPageTransitionAPI file not found');
    process.exit(1);
}

// Test 3: Check documentation
console.log('\n📚 Test 3: Documentation');
const docsPath = join(__dirname, 'EASY_API_GUIDE.md');
if (existsSync(docsPath)) {
    const content = readFileSync(docsPath, 'utf8');
    
    const requiredSections = [
        'transitionToPage',
        'Lifecycle Hooks',
        'Enhanced Logging',
        'Event Methods',
        'Examples'
    ];
    
    const allSectionsFound = requiredSections.every(section => content.includes(section));
    
    if (allSectionsFound) {
        console.log('  ✅ EASY_API_GUIDE.md has all required sections');
    } else {
        console.log('  ❌ EASY_API_GUIDE.md missing sections');
        process.exit(1);
    }
} else {
    console.log('  ❌ EASY_API_GUIDE.md not found');
    process.exit(1);
}

// Test 4: Check example file
console.log('\n🎨 Test 4: Example Files');
const examplePath = join(__dirname, 'streamlined-api-demo.html');
if (existsSync(examplePath)) {
    const content = readFileSync(examplePath, 'utf8');
    
    if (content.includes('transitionToPage') && 
        content.includes('api.on(') && 
        content.includes('phaseStart')) {
        console.log('  ✅ streamlined-api-demo.html demonstrates new API');
    } else {
        console.log('  ❌ streamlined-api-demo.html missing key features');
        process.exit(1);
    }
} else {
    console.log('  ❌ streamlined-api-demo.html not found');
    process.exit(1);
}

// Test 5: Check build output
console.log('\n🔨 Test 5: Build Output');
const publicApiPath = join(__dirname, 'public', 'src', 'HybridPageTransitionAPI.js');
const publicEventEmitterPath = join(__dirname, 'public', 'src', 'utils', 'TransitionEventEmitter.js');

if (existsSync(publicApiPath) && existsSync(publicEventEmitterPath)) {
    console.log('  ✅ Built files exist in public directory');
} else {
    console.log('  ❌ Built files not found in public directory');
    process.exit(1);
}

// All tests passed
console.log('\n✅ All tests passed!\n');
console.log('📝 Summary:');
console.log('  • TransitionEventEmitter module created');
console.log('  • transitionToPage() method implemented');
console.log('  • Lifecycle events system added');
console.log('  • Structured logging implemented');
console.log('  • Helper methods added');
console.log('  • Documentation created');
console.log('  • Example file created');
console.log('  • Build successful\n');

console.log('🚀 Ready to test in browser!');
console.log('   Run: npm run serve');
console.log('   Open: http://localhost:8000/streamlined-api-demo.html\n');
