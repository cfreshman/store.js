// store.js 1.0.0 @ https://freshman.dev/lib/2/store/script.js https://freshman.dev/copyright.js
if (!window['store.js']) (_=>{window['store.js']=Date.now()

    const [local, session] = [localStorage, sessionStorage].map(storage => ({
        get: (key) => {
            const str = storage.getItem(key)
            return str ? JSON.parse(str) : undefined
        },
        set: function(key, value) {
            const oldValue = this.get(key)
            if (!value) {
                this.clear(key)
            } else {
                storage.setItem(key, JSON.stringify(value))
            }
            setTimeout(() => Object.values(this._ons[key] ?? {}).map(f => f({key, newValue:value, oldValue, storageArea:storage})))
            return value
        },
        load: function(key, defaulter=()=>undefined) {
            return this.get(key) ?? this.set(key, defaulter())
        },
        assign: function(key, ...updates) {
            const curr = this.get(key)
            return this.set(key, Object.assign(typeof(curr) === 'object' ? curr : {}, ...updates))
        },
        clear: (key) => storage.removeItem(key),

        _ons: {},
        on: function(key, func) {
            const handler = e => {
                // console.debug('ON', key, func, e)
                if (e.storageArea === storage) {
                    func(key, e.newValue, e.oldValue)
                }
            }
            // addEventListener('storage', handler)
            this._ons[key] = Object.assign(this._ons[key] || {}, { [func]: handler })
            return () => this.off(key, func)
        },
        off: function(key=undefined, func=undefined) {
            ;(key ? [key] : Object.keys(this.ons)).map(key => {
                const handlers = this._ons[key] || {}
                ;(func ? [func] : Object.keys(handlers)).map(handler => {
                    removeEventListener('storage', handler)
                })
    
                if (func) delete handlers[func]
                else delete this._ons[key]
            })
        },
        
        of: function(key, defaulter=()=>undefined) {
            const keyed = Object.assign({
                key,
                get value() { return this.get() },
                set value(value) { return this.set(value) },
            }, Object.fromEntries(Object.keys(this).map(k => [k, (...x)=>this[k](key, ...x)])))
            keyed.load(defaulter)
            const _on = keyed.on
            keyed.on = (func) => _on((key, ...x) => func(...x))
            return keyed
        },
        implicit: function(...x) {
            const keyed = this.of(...x)
            ;'set assign'.split(' ').map(setter_key => {
                const setter = keyed[setter_key]
                keyed[setter_key] = (...x) => {
                    const v = Object.assign(keyed, setter(...x))
                    // console.debug('implicit setter', keyed.key, keyed.value)
                    return v
                }
            })
            return Object.assign(keyed, keyed.value)
        },
    }))
    
    window.store = {
        ...local,
        local,
        session,
    }
})()
