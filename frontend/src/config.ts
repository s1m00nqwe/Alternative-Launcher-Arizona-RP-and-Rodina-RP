import { ReadConfig, SaveConfig } from '../wailsjs/go/main/App';

export type Config = {
    name: string,
    path: string,
    rodinaPath: string,
    memory: number,
    selectedServer: number,
    serverType: string,
    pass: string,
    showPassword: boolean,
    favoriteServers: FavoriteServer[],
    params: {
        wideScreen:    boolean,
        autoLogin:     boolean,
        preload:       boolean,
        windowed:      boolean,
        seasons:       boolean,
        graphics:      boolean,
        shitPc:        boolean,
        cefDirtyRects: boolean,
        authCef:       boolean,
        grass:         boolean,
        oldResolution: boolean,
        hdrResolution: boolean,
    },
}

export type FavoriteServer = {
    number: number,
    name: string,
    ip: string,
    port: number,
    online: number,
    maxplayers: number,
    icon: string,
    serverType: string
}

export var config: Config = {
    name: 'Nick_Name',
    path: '',
    rodinaPath: '',
    memory: 4096,
    selectedServer: 1,
    serverType: 'arizona',
    pass: '',
    showPassword: false,
    favoriteServers: [],
    params: {
        wideScreen:    false,
        autoLogin:     false,
        preload:       false,
        windowed:      false,
        seasons:       false,
        graphics:      false,
        shitPc:        false,
        cefDirtyRects: false,
        authCef:       false,
        grass:         false,
        oldResolution: false,
        hdrResolution: false,
    }
}

export const parameterName: Record<string, string> = {
    "windowed": "window",
    "autoLogin": "x",
    "wideScreen": "widescreen",
    "preload": "ldo",
    "seasons": "seasons",
    "graphics": "graphics",
    "shitPc": "t",
    "cefDirtyRects": "cef_dirty_rects",
    "authCef": "auth_cef_enable",
    "grass": "enable_grass",
    "oldResolution": "16bpp",
    "hdrResolution": "allow_hdr"
}

export function loadConfig() {
    ReadConfig().then((cfg) => {
        console.log('Config loaded:', cfg);
        if (cfg) {
            const parsedConfig = JSON.parse(cfg) as Config;
            config.name = parsedConfig.name || 'Nick_Name';
            config.path = parsedConfig.path || '';
            config.rodinaPath = parsedConfig.rodinaPath || '';
            config.memory = parsedConfig.memory || 4096;
            config.selectedServer = parsedConfig.selectedServer || 1;
            config.serverType = parsedConfig.serverType || 'arizona';
            config.pass = parsedConfig.pass || '';
            config.showPassword = parsedConfig.showPassword || false;
            config.favoriteServers = parsedConfig.favoriteServers || [];
            config.params = { ...config.params, ...parsedConfig.params };
        }
        // @ts-ignore
        document.getElementById('name').value = config.name;
        // @ts-ignore
        document.getElementById('memory').value = config.memory;
        // @ts-ignore
        document.getElementById('path').value = config.path;
        // @ts-ignore
        document.getElementById('rodina-path').value = config.rodinaPath;
        // @ts-ignore
        document.getElementById('pass').value = config.pass;
        updatePasswordVisibility();

        // @ts-ignore
        for (const [k, v] of Object.entries(config.params)) document.getElementById(k).checked = v;
    });
}

export function saveConfig() {
    // @ts-ignore
    config.name = document.getElementById('name').value;
    // @ts-ignore
    config.memory = document.getElementById('memory').value;
    // @ts-ignore
    config.path = document.getElementById('path').value;
    // @ts-ignore
    config.rodinaPath = document.getElementById('rodina-path').value;
    // @ts-ignore
    config.pass = document.getElementById('pass').value;

    for (const name of Object.keys(parameterName)) {
        // @ts-ignore
        config.params[name] = document.getElementById(name).checked ?? false;
    }
    console.log(config);
    console.log(Object.keys(config.params), JSON.stringify(config));
    SaveConfig(JSON.stringify(config));
}

export function togglePasswordVisibility() {
    config.showPassword = !config.showPassword;
    updatePasswordVisibility();
    saveConfig();
}

function updatePasswordVisibility() {
    const passInput = document.getElementById('pass') as HTMLInputElement;
    const toggleBtn = document.getElementById('toggle-password') as HTMLElement;
    if (passInput && toggleBtn) {
        if (config.showPassword) {
            passInput.type = 'text';
            toggleBtn.textContent = '👁️';
        } else {
            passInput.type = 'password';
            toggleBtn.textContent = '👁‍🗨';
        }
    }
}