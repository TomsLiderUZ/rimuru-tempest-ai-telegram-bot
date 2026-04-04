'use strict';

const jsonReader = require('./jsonReader');
const jsonWriter = require('./jsonWriter');
const logger = require('../utils/logger').create('FileDatabase');

/**
 * Abstraction layer over the JSON file storage system.
 * All read/write operations in the application MUST go through this module.
 * Provides get, set, and update operations with safe defaults.
 */

class FileDatabase {
  constructor(filePath, defaultValue = {}) {
    this._filePath = filePath;
    this._defaultValue = defaultValue;
  }

  /** Read entire file contents */
  readAll() {
    return jsonReader.read(this._filePath, this._defaultValue);
  }

  /** Get a value by top-level key */
  get(key) {
    const data = this.readAll();
    return data[key] ?? null;
  }

  /** Set a value by top-level key (atomic write) */
  async set(key, value) {
    const data = this.readAll();
    data[key] = value;
    await jsonWriter.write(this._filePath, data);
    return value;
  }

  /** Delete a top-level key */
  async delete(key) {
    const data = this.readAll();
    if (key in data) {
      delete data[key];
      await jsonWriter.write(this._filePath, data);
      return true;
    }
    return false;
  }

  /** Update: read-modify-write with a callback. Callback receives current data and must return updated data. */
  async update(updaterFn) {
    const data = this.readAll();
    const updated = updaterFn(data);
    await jsonWriter.write(this._filePath, updated);
    return updated;
  }

  /** Overwrite the entire file with new data */
  async writeAll(data) {
    await jsonWriter.write(this._filePath, data);
  }

  /** Check if a key exists */
  has(key) {
    const data = this.readAll();
    return key in data;
  }

  /** Return all keys */
  keys() {
    const data = this.readAll();
    return Object.keys(data);
  }
}

module.exports = FileDatabase;
