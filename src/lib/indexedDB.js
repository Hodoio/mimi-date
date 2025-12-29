/**
 * IndexedDB 工具类
 * 提供对 IndexedDB 的封装，简化数据库操作
 */

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
}

// 导出工具类
export default IndexedDBHelper

// 导出便捷方法用于创建实例
export function createDB(dbName, version) {
    return new IndexedDBHelper(dbName, version)
}
