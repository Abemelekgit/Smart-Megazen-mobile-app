/**
 * @file preload.js
 * @description Electron preload script — bridges main process APIs to the
 * renderer safely via contextBridge. No direct Node.js access in renderer.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Triggers a CSV export save-dialog in the main process.
   * @param {string} csvData - CSV string to write to disk.
   * @returns {Promise<{success: boolean, path?: string}>}
   */
  exportCsv: (csvData) => ipcRenderer.invoke('export-csv', csvData),
});
