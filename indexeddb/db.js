class DB {
    constructor(dbname, version, doDelete = false) {
        this.dbpromise = new Promise((resolve, reject) => {
            let fun = () => {
                let request = window.indexedDB.open(dbname, version);
                request.onsuccess = () => {
                    console.log('success', request.result);
                    resolve(request.result);
                    this.db = request.result;
                };
                request.onerror = (event) => {
                    console.error(event);
                    reject(event);
                };
                request.onupgradeneeded = (event) => {
                    let db = request.result;
                    this.onupgradeneeded(event, db);
                };
            };
            if (doDelete) {
                let req = window.indexedDB.deleteDatabase(dbname);
                req.onsuccess = fun;
                req.onerror = reject;
            }
            else {
                fun();
            }
        });
    }
    add(storeName, data) {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.add(data);
    }
    put(storeName, data) {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(data);
    }
    get(storeName, key) {
        return this.dbpromise.then(() => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e);
            });
        });
    }
    getAll(storeName, key) {
        return this.dbpromise.then(() => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll(key);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e);
            });
        });
    }
    getIndex(storeName, index, value) {
        return this.dbpromise.then(() => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.index(index).get(value);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e);
            });
        });
    }
    getAllIndex(storeName, index, value) {
        return this.dbpromise.then(() => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.index(index).getAll(value);
            return new Promise((resolve, reject) => {
                request.onsuccess = () => resolve(request.result);
                request.onerror = (e) => reject(e);
            });
        });
    }
    getAllIndexCursor(storeName, index, value) {
        return this.dbpromise.then(() => {
            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.index(index).openCursor();
            return new Promise((resolve, reject) => {
                let list = [];
                request.onsuccess = () => {
                    let cursor = request.result;
                    if (cursor) {
                        if (cursor.value[index] === value) {
                            list.push(cursor.value);
                            cursor.continue();
                        }
                        else if (list.length && typeof value !== 'undefined') {
                            // finished
                            resolve(list);
                        }
                        else {
                            cursor.continue();
                        }
                    }
                    else {
                        resolve(list);
                    }
                };
                request.onerror = (e) => reject(e);
            });
        });
    }
    onupgradeneeded(event, db) {
    }
}
function clearDB() {
    window.indexedDB.deleteDatabase('test');
}
function loadScript(src) {
    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.onload = () => {
            resolve();
        };
        script.onerror = reject;
        document.querySelector('head').appendChild(script);
    });
}
function start() {
    // Promise.all([
    //     fetch('./questions.json').then(r => r.json()),
    //     fetch('./categories.json').then(r => r.json()),
    //     fetch('./question-cates.json').then(r => r.json())
    // ]).then(([questions, categories, questionCates]) => {
    Promise.all([
        loadScript('./questions.json'),
        loadScript('./categories.json'),
        loadScript('./question-cates.json'),
    ]).then(() => {
        const dbObject = new DB('test', 1, true);
        dbObject.dbpromise.catch((e) => {
            document.write(`<p>本地数据库初始化失败</p>`);
        });
        dbObject.onupgradeneeded = (event, db) => {
            console.log('onupgradeneeded', event.newVersion, event.oldVersion);
            if (event.newVersion && event.newVersion === 1 && event.oldVersion === 0) {
                document.open();
                document.write(`<p>本地数据库初始化...</p>`);
                const questionStore = db.createObjectStore('question', { keyPath: 'id', autoIncrement: false });
                questionStore.createIndex('type', 'type', { unique: false });
                const categoryStore = db.createObjectStore('category', { keyPath: 'id', autoIncrement: false });
                categoryStore.createIndex('model', 'model', { unique: false });
                categoryStore.createIndex('subject', 'subject', { unique: false });
                categoryStore.createIndex('lang', 'lang', { unique: false });
                categoryStore.createIndex('pids', 'pids', { unique: false });
                const questionCateStore = db.createObjectStore('question-cates', { keyPath: 'id', autoIncrement: false });
                questionCateStore.createIndex('qid', 'qid', { unique: false });
                questionCateStore.createIndex('cid', 'cid', { unique: false });
                questionCateStore.transaction.oncomplete = () => {
                    console.log('objectStore create complete');
                    document.write(`<p>本地数据库初始化成功, 开始导入数据...</p>`);
                    let transaction = db.transaction(['question-cates', 'question', 'category'], 'readwrite');
                    questionCates.forEach((item) => {
                        transaction.objectStore('question-cates').add(item);
                    });
                    questions.forEach((item) => {
                        transaction.objectStore('question').add(item);
                    });
                    categories.forEach((item) => {
                        transaction.objectStore('category').add(item);
                    });
                    transaction.oncomplete = () => {
                        console.log('data add complete');
                        let transaction = db.transaction(['question-cates', 'question', 'category'], 'readonly');
                        let request = transaction.objectStore('category').count();
                        request.onsuccess = () => {
                            document.write('<p>成功导入' + request.result + '个分类</p>');
                        };
                        let questionRequest = transaction.objectStore('question').count();
                        questionRequest.onsuccess = () => {
                            document.write('<p>成功导入' + questionRequest.result + '道题</p>');
                        };
                    };
                };
            }
        };
        // dbObject.dbpromise.then(async (db) => {
        //     let category: any = await dbObject.get('category', 6000);
        //     let qids: any[] = await dbObject.getAllIndex('question-cates', 'cid', category.id);
        //     let questions = await dbObject.getAll('question', qids.map(item => item.qid));
        //     console.log(category, qids, questions);
        // });
        window.dbObject = dbObject;
    });
}
