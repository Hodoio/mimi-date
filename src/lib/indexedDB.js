/**
 * IndexedDB 工具类
 * 提供对 IndexedDB 的封装，简化数据库操作
 */

import initSqlJs from 'sql.js'

class IndexedDBHelper {
    /**
     * 构造函数
     * @param {string} dbName - 数据库名称
     * @param {number} version - 数据库版本号
     */
    constructor(dbName, version = 1) {
        this.dbName = dbName
        this.version = version
        this.db = null
        this.stores = new Map() // 存储对象仓库配置
    }

    /**
     * 添加对象仓库配置
     * @param {string} storeName - 仓库名称
     * @param {Object} options - 配置选项
     * @param {string} options.keyPath - 主键路径
     * @param {boolean} options.autoIncrement - 是否自动递增
     * @param {Array} options.indexes - 索引配置数组 [{name, keyPath, unique}]
     */
    addStore(storeName, options = {}) {
        this.stores.set(storeName, {
            keyPath: options.keyPath || 'id',
            autoIncrement: options.autoIncrement || false,
            indexes: options.indexes || []
        })
        return this
    }

    /**
     * 初始化数据库
     * @returns {Promise<IDBDatabase>}
     */
    init() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db)
                return
            }

            const request = indexedDB.open(this.dbName, this.version)

            // 数据库升级时触发（首次创建或版本号变更）
            request.onupgradeneeded = (event) => {
                const db = event.target.result

                // 创建对象仓库
                this.stores.forEach((config, storeName) => {
                    // 如果仓库已存在，先删除
                    if (db.objectStoreNames.contains(storeName)) {
                        db.deleteObjectStore(storeName)
                    }

                    // 创建新的对象仓库
                    const objectStore = db.createObjectStore(storeName, {
                        keyPath: config.keyPath,
                        autoIncrement: config.autoIncrement
                    })

                    // 创建索引
                    config.indexes.forEach(index => {
                        objectStore.createIndex(
                            index.name,
                            index.keyPath || index.name,
                            { unique: index.unique || false }
                        )
                    })
                })
            }

            request.onsuccess = (event) => {
                this.db = event.target.result
                console.log(`数据库 ${this.dbName} 初始化成功`)
                resolve(this.db)
            }

            request.onerror = (event) => {
                console.error('数据库初始化失败:', event.target.error)
                reject(event.target.error)
            }
        })
    }

    /**
     * 添加数据
     * @param {string} storeName - 仓库名称
     * @param {Object|Array} data - 要添加的数据（单个对象或数组）
     * @returns {Promise}
     */
    async add(storeName, data) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readwrite')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const dataArray = Array.isArray(data) ? data : [data]
            const results = []

            dataArray.forEach(item => {
                const request = objectStore.add(item)
                request.onsuccess = () => results.push(request.result)
            })

            transaction.oncomplete = () => {
                resolve(Array.isArray(data) ? results : results[0])
            }

            transaction.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 更新数据（如果不存在则添加）
     * @param {string} storeName - 仓库名称
     * @param {Object|Array} data - 要更新的数据
     * @returns {Promise}
     */
    async put(storeName, data) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readwrite')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const dataArray = Array.isArray(data) ? data : [data]
            const results = []

            dataArray.forEach(item => {
                const request = objectStore.put(item)
                request.onsuccess = () => results.push(request.result)
            })

            transaction.oncomplete = () => {
                resolve(Array.isArray(data) ? results : results[0])
            }

            transaction.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 根据主键获取数据
     * @param {string} storeName - 仓库名称
     * @param {*} key - 主键值
     * @returns {Promise<Object>}
     */
    async get(storeName, key) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readonly')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const request = objectStore.get(key)

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 获取所有数据
     * @param {string} storeName - 仓库名称
     * @returns {Promise<Array>}
     */
    async getAll(storeName) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readonly')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const request = objectStore.getAll()

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 根据索引查询数据
     * @param {string} storeName - 仓库名称
     * @param {string} indexName - 索引名称
     * @param {*} value - 索引值
     * @returns {Promise<Array>}
     */
    async getByIndex(storeName, indexName, value) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readonly')
        const objectStore = transaction.objectStore(storeName)
        const index = objectStore.index(indexName)

        return new Promise((resolve, reject) => {
            const request = index.getAll(value)

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 根据主键删除数据
     * @param {string} storeName - 仓库名称
     * @param {*} key - 主键值
     * @returns {Promise}
     */
    async delete(storeName, key) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readwrite')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const request = objectStore.delete(key)

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 清空仓库中的所有数据
     * @param {string} storeName - 仓库名称
     * @returns {Promise}
     */
    async clear(storeName) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readwrite')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const request = objectStore.clear()

            request.onsuccess = () => {
                resolve()
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 统计仓库中的数据数量
     * @param {string} storeName - 仓库名称
     * @returns {Promise<number>}
     */
    async count(storeName) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readonly')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            const request = objectStore.count()

            request.onsuccess = () => {
                resolve(request.result)
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 使用游标遍历数据
     * @param {string} storeName - 仓库名称
     * @param {Function} callback - 回调函数，接收每条数据
     * @param {Object} options - 选项
     * @param {string} options.direction - 遍历方向：'next'(默认), 'prev', 'nextunique', 'prevunique'
     * @param {IDBKeyRange} options.range - 键范围
     * @returns {Promise<Array>}
     */
    async cursor(storeName, callback, options = {}) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readonly')
        const objectStore = transaction.objectStore(storeName)
        const results = []

        return new Promise((resolve, reject) => {
            const request = objectStore.openCursor(
                options.range || null,
                options.direction || 'next'
            )

            request.onsuccess = (event) => {
                const cursor = event.target.result
                if (cursor) {
                    const result = callback(cursor.value, cursor)
                    if (result !== false) {
                        results.push(cursor.value)
                    }
                    cursor.continue()
                } else {
                    resolve(results)
                }
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 批量删除数据
     * @param {string} storeName - 仓库名称
     * @param {Array} keys - 主键数组
     * @returns {Promise}
     */
    async batchDelete(storeName, keys) {
        const db = await this.init()
        const transaction = db.transaction([storeName], 'readwrite')
        const objectStore = transaction.objectStore(storeName)

        return new Promise((resolve, reject) => {
            keys.forEach(key => {
                objectStore.delete(key)
            })

            transaction.oncomplete = () => {
                resolve()
            }

            transaction.onerror = (event) => {
                reject(event.target.error)
            }
        })
    }

    /**
     * 关闭数据库连接
     */
    close() {
        if (this.db) {
            this.db.close()
            this.db = null
            console.log(`数据库 ${this.dbName} 已关闭`)
        }
    }

    /**
     * 删除数据库
     * @returns {Promise}
     */
    deleteDatabase() {
        return new Promise((resolve, reject) => {
            this.close()
            const request = indexedDB.deleteDatabase(this.dbName)

            request.onsuccess = () => {
                console.log(`数据库 ${this.dbName} 已删除`)
                resolve()
            }

            request.onerror = (event) => {
                reject(event.target.error)
            }

            request.onblocked = () => {
                console.warn(`数据库 ${this.dbName} 删除被阻止，请关闭所有使用该数据库的连接`)
            }
        })
    }

    /**
     * 导出数据库所有数据为 JSON
     * @returns {Promise<Object>} 包含所有仓库数据的对象
     */
    async exportData() {
        const db = await this.init()
        const exportData = {
            dbName: this.dbName,
            version: this.version,
            exportDate: new Date().toISOString(),
            stores: {}
        }

        // 获取所有对象仓库的名称
        const storeNames = Array.from(db.objectStoreNames)

        // 遍历每个仓库并导出数据
        for (const storeName of storeNames) {
            const data = await this.getAll(storeName)
            exportData.stores[storeName] = data
        }

        return exportData
    }

    /**
     * 导出数据库数据并下载为 SQLite 文件
     * @param {string} filename - 文件名（可选，默认为 dbName_timestamp.db）
     * @returns {Promise<void>}
     */
    async exportToFile(filename) {
        try {
            // 初始化 sql.js
            const SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            })

            // 创建新的 SQLite 数据库
            const sqlDb = new SQL.Database()

            // 获取所有数据
            const data = await this.exportData()
            const db = await this.init()

            // 为每个仓库创建表并插入数据
            for (const [storeName, records] of Object.entries(data.stores)) {
                if (records.length === 0) continue

                // 获取仓库配置
                const storeConfig = this.stores.get(storeName)
                
                // 分析数据结构，创建表
                const sampleRecord = records[0]
                const columns = Object.keys(sampleRecord)
                
                // 构建 CREATE TABLE 语句
                const columnDefs = columns.map(col => {
                    const value = sampleRecord[col]
                    let type = 'TEXT'
                    
                    if (typeof value === 'number') {
                        type = Number.isInteger(value) ? 'INTEGER' : 'REAL'
                    } else if (typeof value === 'boolean') {
                        type = 'INTEGER'
                    }
                    
                    // 使用方括号包裹列名以避免保留字冲突
                    const quotedCol = `[${col}]`
                    
                    // 如果是主键
                    if (col === storeConfig?.keyPath) {
                        return `${quotedCol} ${type} PRIMARY KEY`
                    }
                    
                    return `${quotedCol} ${type}`
                }).join(', ')

                const createTableSQL = `CREATE TABLE [${storeName}] (${columnDefs})`
                sqlDb.run(createTableSQL)

                // 插入数据
                for (const record of records) {
                    const cols = Object.keys(record)
                    const quotedCols = cols.map(col => `[${col}]`)
                    const placeholders = cols.map(() => '?').join(', ')
                    const values = cols.map(col => {
                        const value = record[col]
                        // 布尔值转换为 0/1
                        if (typeof value === 'boolean') return value ? 1 : 0
                        // 对象和数组转换为 JSON 字符串
                        if (typeof value === 'object' && value !== null) return JSON.stringify(value)
                        return value
                    })
                    
                    const insertSQL = `INSERT INTO [${storeName}] (${quotedCols.join(', ')}) VALUES (${placeholders})`
                    sqlDb.run(insertSQL, values)
                }
            }

            // 导出为二进制数据
            const binaryArray = sqlDb.export()
            const blob = new Blob([binaryArray], { type: 'application/x-sqlite3' })

            // 生成默认文件名
            if (!filename) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
                filename = `${this.dbName}_${timestamp}.db`
            }

            // 创建下载链接
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            // 关闭 SQLite 数据库
            sqlDb.close()

            console.log(`数据库 ${this.dbName} 已导出到 SQLite 文件 ${filename}`)
        } catch (error) {
            console.error('导出数据失败:', error)
            throw error
        }
    }

    /**
     * 从 JSON 对象导入数据到数据库
     * @param {Object} importData - 导入的数据对象
     * @param {Object} options - 导入选项
     * @param {boolean} options.clearBeforeImport - 导入前是否清空现有数据（默认 false）
     * @param {boolean} options.skipErrors - 是否跳过错误继续导入（默认 true）
     * @returns {Promise<Object>} 导入结果统计
     */
    async importData(importData, options = {}) {
        const { clearBeforeImport = false, skipErrors = true } = options
        const db = await this.init()
        const result = {
            success: true,
            imported: {},
            errors: []
        }

        try {
            // 验证导入数据格式
            if (!importData || !importData.stores) {
                throw new Error('无效的导入数据格式')
            }

            // 遍历每个仓库
            for (const [storeName, data] of Object.entries(importData.stores)) {
                // 检查仓库是否存在
                if (!db.objectStoreNames.contains(storeName)) {
                    const error = `仓库 ${storeName} 不存在，跳过导入`
                    console.warn(error)
                    result.errors.push(error)
                    continue
                }

                try {
                    // 如果需要，先清空仓库
                    if (clearBeforeImport) {
                        await this.clear(storeName)
                    }

                    // 导入数据
                    let successCount = 0
                    const storeConfig = this.stores.get(storeName)
                    
                    for (const item of data) {
                        try {
                            // 如果配置了 autoIncrement 且数据中没有主键，删除主键字段让数据库自动生成
                            if (storeConfig?.autoIncrement && storeConfig?.keyPath) {
                                const keyPath = storeConfig.keyPath
                                // 如果主键不存在或为 null/undefined，删除该字段
                                if (item[keyPath] === null || item[keyPath] === undefined) {
                                    delete item[keyPath]
                                }
                            }
                            
                            await this.put(storeName, item)
                            successCount++
                        } catch (error) {
                            const errorMsg = `导入 ${storeName} 中的数据失败: ${error.message}`
                            result.errors.push(errorMsg)
                            if (!skipErrors) {
                                throw error
                            }
                        }
                    }

                    result.imported[storeName] = successCount
                    console.log(`仓库 ${storeName} 导入了 ${successCount} 条数据`)
                } catch (error) {
                    const errorMsg = `处理仓库 ${storeName} 时出错: ${error.message}`
                    result.errors.push(errorMsg)
                    if (!skipErrors) {
                        throw error
                    }
                }
            }

            if (result.errors.length > 0) {
                result.success = false
            }

            return result
        } catch (error) {
            console.error('导入数据失败:', error)
            result.success = false
            result.errors.push(error.message)
            throw error
        }
    }

    /**
     * 从文件导入数据到数据库（支持 SQLite 和 JSON 格式）
     * @param {File} file - 要导入的文件（.db 或 .json）
     * @param {Object} options - 导入选项
     * @returns {Promise<Object>} 导入结果统计
     */
    async importFromFile(file, options = {}) {
        // 根据文件扩展名判断文件类型
        const fileName = file.name.toLowerCase()
        const isSQLite = fileName.endsWith('.db') || fileName.endsWith('.sqlite') || fileName.endsWith('.sqlite3')

        if (isSQLite) {
            return this._importFromSQLite(file, options)
        } else {
            return this._importFromJSON(file, options)
        }
    }

    /**
     * 从 JSON 文件导入数据
     * @private
     */
    async _importFromJSON(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = async (event) => {
                try {
                    const jsonStr = event.target.result
                    const importData = JSON.parse(jsonStr)
                    const result = await this.importData(importData, options)
                    console.log(`从 JSON 文件 ${file.name} 导入数据完成`)
                    resolve(result)
                } catch (error) {
                    console.error('从 JSON 文件导入数据失败:', error)
                    reject(error)
                }
            }

            reader.onerror = (error) => {
                console.error('读取文件失败:', error)
                reject(error)
            }

            reader.readAsText(file)
        })
    }

    /**
     * 从 SQLite 文件导入数据
     * @private
     */
    async _importFromSQLite(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = async (event) => {
                try {
                    // 初始化 sql.js
                    const SQL = await initSqlJs({
                        locateFile: file => `https://sql.js.org/dist/${file}`
                    })

                    // 加载 SQLite 数据库
                    const uInt8Array = new Uint8Array(event.target.result)
                    const sqlDb = new SQL.Database(uInt8Array)

                    // 获取所有表名
                    const tablesResult = sqlDb.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
                    
                    if (tablesResult.length === 0 || !tablesResult[0].values) {
                        throw new Error('SQLite 文件中没有找到数据表')
                    }

                    const tables = tablesResult[0].values.map(row => row[0])

                    // 构建导入数据结构
                    const importData = {
                        dbName: this.dbName,
                        version: this.version,
                        exportDate: new Date().toISOString(),
                        stores: {}
                    }

                    // 从每个表读取数据
                    for (const tableName of tables) {
                        const result = sqlDb.exec(`SELECT * FROM ${tableName}`)
                        
                        if (result.length > 0 && result[0].values.length > 0) {
                            const columns = result[0].columns
                            const rows = result[0].values

                            // 将行数据转换为对象数组
                            importData.stores[tableName] = rows.map(row => {
                                const obj = {}
                                columns.forEach((col, index) => {
                                    let value = row[index]
                                    
                                    // 尝试解析 JSON 字符串
                                    if (typeof value === 'string') {
                                        try {
                                            const parsed = JSON.parse(value)
                                            if (typeof parsed === 'object') {
                                                value = parsed
                                            }
                                        } catch (e) {
                                            // 不是 JSON，保持原值
                                        }
                                    }
                                    
                                    obj[col] = value
                                })
                                return obj
                            })
                        }
                    }

                    // 关闭 SQLite 数据库
                    sqlDb.close()

                    // 使用现有的 importData 方法导入
                    const result = await this.importData(importData, options)
                    console.log(`从 SQLite 文件 ${file.name} 导入数据完成`)
                    resolve(result)
                } catch (error) {
                    console.error('从 SQLite 文件导入数据失败:', error)
                    reject(error)
                }
            }

            reader.onerror = (error) => {
                console.error('读取文件失败:', error)
                reject(error)
            }

            reader.readAsArrayBuffer(file)
        })
    }
}

// 导出工具类
export default IndexedDBHelper

// 导出便捷方法用于创建实例
export function createDB(dbName, version) {
    return new IndexedDBHelper(dbName, version)
}
