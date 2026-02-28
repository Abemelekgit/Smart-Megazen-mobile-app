/**
 * @file metro.config.js
 * Enables symlink resolution so the mobile project can import from
 * the shared/ folder (symlinked as mobile/shared → ../shared).
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required: follow symlinks so mobile/shared → ../shared resolves
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
