/**
 * Pure JSON file database — no native modules, works on Windows/Mac/Linux
 * Data is stored in data.json in the backend folder
 */
const fs = require('fs')
const path = require('path')

const DB_FILE = path.join(__dirname, 'data.json')

const DEFAULT = {
  settings: {
    balance: '5000',
    account_name: 'Prop Firm Challenge',
    pip_value: '10',
    risk_percent: '0.5'
  },
  trades: [],
  backtests: []
}

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
    }
  } catch (e) {
    console.error('DB read error, starting fresh:', e.message)
  }
  return JSON.parse(JSON.stringify(DEFAULT))
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8')
}

module.exports = { load, save }
