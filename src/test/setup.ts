import '@testing-library/jest-dom'

const createStorageMock = () => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = String(value) },
        removeItem: (key: string) => { delete store[key] },
        clear: () => { store = {} },
        get length() { return Object.keys(store).length },
        key: (i: number) => Object.keys(store)[i] ?? null,
    }
}

const mockLocalStorage = createStorageMock()
const mockSessionStorage = createStorageMock()

Object.defineProperty(globalThis, 'localStorage', {
    value: (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.clear === 'function')
        ? window.localStorage
        : mockLocalStorage,
    configurable: true,
    writable: true,
})

Object.defineProperty(globalThis, 'sessionStorage', {
    value: (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.clear === 'function')
        ? window.sessionStorage
        : mockSessionStorage,
    configurable: true,
    writable: true,
})
