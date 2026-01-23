# Easy-to-Use Page Transition API

## Overview

The WebGL Particle Transition Engine now features a streamlined, easy-to-use API specifically designed for page transitions. The new `transitionToPage()` method provides a simple interface while retaining all the advanced features and configurability of the engine.

## Key Improvements

### 1. **Streamlined API Method: `transitionToPage()`**

A new simplified method for page transitions that replaces the need to understand the complex internal API.

**Before:**
```javascript
const api = new HybridPageTransitionAPI(config);
await api.initialize();
await api.transition(currentElement, nextElement, options);
```

**After (New Streamlined API):**
```javascript
const api = new HybridPageTransitionAPI({ autoOptimize: true });
await api.initialize();

await api.transitionToPage({
    currentPage: '#page1',      // CSS selector or element
    nextPage: '#page2',         // CSS selector or element
    onComplete: () => console.log('Done!'),
    onError: (err) => console.error(err)
});
```

**Key Features:**
- Clear, named parameters
- Automatic element resolution (accepts CSS selectors or DOM elements)
- Built-in error handling with meaningful messages
- Optional callbacks for completion and errors
- Per-transition configuration overrides
- Auto-initialization if not already initialized

### 2. **Lifecycle Hooks & Events**

The API now emits events for all major lifecycle moments, providing full observability:

```javascript
// Listen for transition start
api.on('transitionStart', (data) => {
    console.log('Transition started:', data);
    // data: { timestamp, type: 'page'|'image' }
});

// Listen for phase changes
api.on('phaseStart', (data) => {
    console.log('Phase started:', data.phase);
    // data: { phase: 'capture'|'staticDisplay'|'disintegration'|'explosion'|'recombination'|'blend'|'finalStatic', timestamp, duration }
});

api.on('phaseEnd', (data) => {
    console.log('Phase completed:', data.phase);
});

// Listen for completion
api.on('transitionComplete', (data) => {
    console.log('Transition completed in', data.duration, 'ms');
    // data: { timestamp, duration, fallback: boolean }
});

// Listen for errors
api.on('transitionError', (data) => {
    console.error('Transition error:', data.error);
    // data: { timestamp, error, duration }
});
```

**Available Events:**
- `initializeStart` - When API initialization begins
- `initializeComplete` - When API initialization completes
- `initializeError` - When initialization fails
- `transitionStart` - When a transition begins
- `transitionComplete` - When a transition completes
- `transitionError` - When a transition fails
- `phaseStart` - When a phase begins (includes phase name)
- `phaseEnd` - When a phase ends (includes phase name)

**Event Methods:**
- `on(event, callback)` - Register an event listener
- `once(event, callback)` - Register a one-time listener
- `off(event, callback)` - Remove an event listener

### 3. **Enhanced Logging & Debugging**

Structured logging with configurable log levels:

```javascript
const api = new HybridPageTransitionAPI({
    logLevel: 'debug',  // 'debug', 'info', 'warn', 'error'
    debug: true         // Enable debug mode
});
```

**Log Levels:**
- `debug` - Detailed information for debugging (only shown when debug: true)
- `info` - General informational messages (default)
- `warn` - Warning messages
- `error` - Error messages

All log messages are now structured and prefixed with `[HybridPageTransitionAPI]` for easy filtering.

### 4. **Improved Error Handling**

Clear, actionable error messages:

```javascript
try {
    await api.transitionToPage({
        currentPage: '#nonexistent',
        nextPage: '#page2'
    });
} catch (error) {
    // Error message: "Current page not found: #nonexistent"
    console.error(error.message);
}
```

**Error Scenarios Covered:**
- Missing required parameters
- Invalid or non-existent page elements
- Elements not in DOM
- Transition already in progress
- Initialization failures
- DOM capture failures

### 5. **Modular Code Structure**

The codebase is now more modular with clear separation of concerns:

- **TransitionEventEmitter** - Dedicated event management (`src/utils/TransitionEventEmitter.js`)
- **Structured Logging** - Internal `_log()` method with level filtering
- **Phase Tracking** - Dedicated `_trackTransitionPhases()` method
- **Event Emission** - Helper `_emitPhase()` method for consistent event handling

### 6. **Sensible Defaults**

All configuration options now have sensible defaults optimized for most use cases:

```javascript
// Minimal configuration - just works!
const api = new HybridPageTransitionAPI({
    autoOptimize: true  // Automatically adjusts for device performance
});

await api.initialize();

// No additional configuration needed for basic transitions
await api.transitionToPage({
    currentPage: '#page1',
    nextPage: '#page2'
});
```

**Default Values:**
- Particle Count: 2000 (auto-optimized per device)
- Explosion Duration: 800ms
- Recombination Duration: 2000ms
- Explosion Intensity: 150
- Static Display: 500ms
- Disintegration: 1000ms
- Blend Duration: 1500ms
- Final Static: 500ms

### 7. **Helper Methods**

New utility methods for better integration:

```javascript
// Check transition status
if (api.isTransitionInProgress()) {
    console.log('Currently transitioning...');
}

// Get current phase
const phase = api.getCurrentPhase();
console.log('Current phase:', phase);

// Get transition duration
const duration = api.getTransitionDuration();
console.log('Transition running for:', duration, 'ms');
```

## Complete Example

```javascript
import { HybridPageTransitionAPI } from './src/HybridPageTransitionAPI.js';

// 1. Create API with minimal config
const api = new HybridPageTransitionAPI({
    autoOptimize: true,
    logLevel: 'info'
});

// 2. Initialize
await api.initialize();

// 3. Register lifecycle hooks
api.on('phaseStart', (data) => {
    updateUI(`Starting ${data.phase} phase...`);
});

api.on('transitionComplete', (data) => {
    updateUI(`Transition complete in ${data.duration}ms!`);
});

api.on('transitionError', (data) => {
    showError(`Transition failed: ${data.error}`);
});

// 4. Trigger transitions with ease
document.getElementById('nextBtn').addEventListener('click', async () => {
    try {
        await api.transitionToPage({
            currentPage: '#home',
            nextPage: '#about',
            onComplete: () => {
                console.log('✅ Navigation complete!');
            },
            config: {
                // Optional: override defaults for this transition
                explosionIntensity: 200
            }
        });
    } catch (error) {
        console.error('❌ Navigation failed:', error);
    }
});

// 5. Cleanup when done
window.addEventListener('beforeunload', () => {
    api.destroy();
});
```

## Migration Guide

### From Old API to New API

**Old Way (still supported):**
```javascript
const api = new HybridPageTransitionAPI(config);
await api.initialize();

const current = document.querySelector('#page1');
const next = document.querySelector('#page2');

await api.transition(current, next, {
    explosionTime: 700,
    recombinationDuration: 1800
});
```

**New Way (recommended):**
```javascript
const api = new HybridPageTransitionAPI({ autoOptimize: true });
await api.initialize();

await api.transitionToPage({
    currentPage: '#page1',
    nextPage: '#page2',
    config: {
        explosionDuration: 700,
        recombinationDuration: 1800
    },
    onComplete: () => console.log('Done!')
});
```

## Transition Phases

The API manages 7 phases automatically:

1. **Capture** (variable) - Captures DOM elements as textures
2. **Static Display** (500ms default) - Shows source page
3. **Disintegration** (1000ms default) - Fades to particles
4. **Explosion** (800ms default) - Particles scatter
5. **Recombination** (2000ms default) - Particles reassemble
6. **Blend** (1500ms default) - Crossfade to triangulation
7. **Final Static** (500ms default) - Shows target page

Each phase emits `phaseStart` and `phaseEnd` events for observability.

## API Reference

### Constructor

```typescript
new HybridPageTransitionAPI(config?: {
    // Canvas settings
    canvasId?: string;
    canvasWidth?: number;
    canvasHeight?: number;
    
    // Performance
    autoOptimize?: boolean;
    particleCount?: number;
    
    // Transition settings
    explosionDuration?: number;
    recombinationDuration?: number;
    explosionIntensity?: number;
    
    // Logging
    debug?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    showDebugPanel?: boolean;
    
    // Fallback
    enableFallback?: boolean;
    fallbackDuration?: number;
})
```

### Methods

#### `transitionToPage(params)`

**Parameters:**
```typescript
{
    currentPage: HTMLElement | string;    // Required
    nextPage: HTMLElement | string;       // Required
    onComplete?: () => void;              // Optional callback
    onError?: (error: Error) => void;     // Optional callback
    config?: {                            // Optional overrides
        explosionIntensity?: number;
        particleCount?: number;
        // ... any config property
    }
}
```

**Returns:** `Promise<void>`

#### Event Methods

- `on(event: string, callback: Function): Function` - Register listener, returns unsubscribe function
- `once(event: string, callback: Function): Function` - One-time listener
- `off(event: string, callback: Function): void` - Remove listener

#### Status Methods

- `isTransitionInProgress(): boolean` - Check if transitioning
- `getCurrentPhase(): string | null` - Get current phase name
- `getTransitionDuration(): number | null` - Get elapsed time

#### Configuration Methods

- `updateConfig(config: Object): void` - Update configuration
- `getConfig(): Object` - Get current configuration
- `getPerformanceInfo(): Object` - Get performance information

#### Lifecycle Methods

- `initialize(): Promise<void>` - Initialize the API
- `destroy(): void` - Clean up resources

## Best Practices

1. **Use `autoOptimize: true`** - Automatically adjusts settings for device capabilities
2. **Register event listeners early** - Set up listeners before calling transitions
3. **Handle errors** - Always use try/catch or onError callback
4. **Use CSS selectors** - Simpler than querying DOM yourself
5. **One API instance** - Reuse the same instance for all transitions
6. **Clean up** - Call `destroy()` when done (e.g., on page unload)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (WebGL 1.0)
- Mobile: ✅ Supported with auto-optimization
- Non-WebGL: ✅ CSS fallback

## Performance Tips

The API automatically optimizes for device performance when `autoOptimize: true`:

- **High-end devices**: 3000 particles, high quality
- **Mid-range devices**: 2000 particles, balanced
- **Low-end devices**: 1000 particles, optimized

You can override these settings per-transition using the `config` parameter.

## Examples

See the complete example in `streamlined-api-demo.html` which demonstrates:
- Basic transitions
- Event listeners
- Error handling
- Per-transition configuration
- Event logging UI
