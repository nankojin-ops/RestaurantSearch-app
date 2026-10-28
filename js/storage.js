/**
 * LocalStorage管理モジュール
 */
const StorageManager = (() => {
  const STORAGE_KEY = 'hotpepper_api_key';
  let memoryStore = {};

  const isStorageAvailable = () => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };

  const hasStorage = isStorageAvailable();

  const getApiKey = () => {
    try {
      if (hasStorage) {
        return localStorage.getItem(STORAGE_KEY) || '';
      }
      return memoryStore[STORAGE_KEY] || '';
    } catch (e) {
      console.warn('Storage read failed, falling back to memory store:', e);
      return memoryStore[STORAGE_KEY] || '';
    }
  };

  const setApiKey = (key) => {
    if (!key) return;
    const sanitized = key.trim();
    try {
      if (hasStorage) {
        localStorage.setItem(STORAGE_KEY, sanitized);
      } else {
        memoryStore[STORAGE_KEY] = sanitized;
      }
    } catch (e) {
      console.warn('Storage write failed, falling back to memory store:', e);
      memoryStore[STORAGE_KEY] = sanitized;
    }
  };

  const hasApiKey = () => {
    return Boolean(getApiKey());
  };

  const clearApiKey = () => {
    try {
      if (hasStorage) {
        localStorage.removeItem(STORAGE_KEY);
      }
      delete memoryStore[STORAGE_KEY];
    } catch (e) {
      console.warn('Storage clear failed:', e);
      delete memoryStore[STORAGE_KEY];
    }
  };

  return {
    getApiKey,
    setApiKey,
    hasApiKey,
    clearApiKey
  };
})();