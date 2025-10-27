import './style.css';
import './app.css';
import { EventsOn, EventsEmit } from '../wailsjs/runtime'
import { config, loadConfig, saveConfig, parameterName, togglePasswordVisibility, FavoriteServer } from './config';
import { StartGame, UpdateServerInfo } from '../wailsjs/go/main/App';

type Server = {
    number:               number,
	name:                 string,
	ip:                   string,
	port:                 number,
	online:               number,
	maxplayers:           number,
	password:             boolean,
	vk:                   string,
	tg:                   string,
	inst:                 string,
	icon:                 string,
	additionalIps:        string[],
	donateMultiplier:     number,
	experienceMultiplier: number,
	plotPoints:           {online: number, time: number}[]
}

var serversList: Server[] = [];
var arizonaServers: Server[] = [];
var rodinaServers: Server[] = [];
var mobileServers: Server[] = [];

// Функция для проверки, является ли сервер избранным
function isServerFavorite(server: Server, serverType: string): boolean {
    return config.favoriteServers.some(fav => 
        fav.number === server.number && fav.serverType === serverType
    );
}

// Функция для добавления/удаления сервера из избранного
function toggleFavorite(server: Server, serverType: string) {
    const existingIndex = config.favoriteServers.findIndex(fav => 
        fav.number === server.number && fav.serverType === serverType
    );

    if (existingIndex > -1) {
        // Удаляем из избранного
        config.favoriteServers.splice(existingIndex, 1);
    } else {
        // Добавляем в избранное
        const favoriteServer: FavoriteServer = {
            number: server.number,
            name: server.name,
            ip: server.ip,
            port: server.port,
            online: server.online,
            maxplayers: server.maxplayers,
            icon: server.icon,
            serverType: serverType
        };
        config.favoriteServers.unshift(favoriteServer); // Добавляем в начало
    }
    
    saveConfig();
    updateServersDisplay(); // Перерисовываем список серверов
}

function createServer(server: Server, id: number, isSelected = false, hideNumber = false, serverType = 'arizona') {
    const list = document.getElementById('servers-list');
    const serverDiv = document.createElement('div');
    serverDiv.classList.add('server');
    if (isSelected) serverDiv.classList.add('server-selected');
    serverDiv.id = `${serverType}-${id}`;
    
    const isFavorite = isServerFavorite(server, serverType);
    
    const serverLogo = document.createElement('img');
    serverLogo.classList.add('server-logo')
    serverLogo.src = server.icon;

    const serverId = document.createElement('a');
    serverId.classList.add('server-id');
    serverId.textContent = `#${server.number}`;

    const serverName = document.createElement('a');
    serverName.classList.add('server-name');
    serverName.textContent = server.name;

    const serverPlayers = document.createElement('a');
    serverPlayers.id = `players-count-${server.number}`
    serverPlayers.classList.add('server-players');
    serverPlayers.textContent = `${server.online}/${server.maxplayers}`;
    
    // Создаем сердечко для избранного
    const favoriteHeart = document.createElement('div');
    favoriteHeart.classList.add('favorite-heart');
    favoriteHeart.innerHTML = isFavorite ? '❤️' : '🤍';
    favoriteHeart.style.cursor = 'pointer';
    favoriteHeart.style.marginLeft = 'auto';
    favoriteHeart.style.marginRight = '5px';
    favoriteHeart.style.fontSize = '14px';
    
    // Обработчик клика на сердечко
    favoriteHeart.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        toggleFavorite(server, serverType);
    });
    
    // Обработчик клика на сам сервер
    serverDiv.onclick = () => {
        document.querySelectorAll('.server').forEach((el) => {
            el.classList.remove('server-selected');
        });
        serverDiv.classList.add('server-selected');
        UpdateServerInfo(server.ip);
        config.selectedServer = server.number;
        config.serverType = serverType;
        saveConfig();
    };
    
    serverDiv.appendChild(serverLogo);
    if (!hideNumber)
        serverDiv.appendChild(serverId);
    serverDiv.appendChild(serverName);
    serverDiv.appendChild(favoriteHeart); // Добавляем сердечко перед счетчиком игроков
    serverDiv.appendChild(serverPlayers);
    list?.appendChild(serverDiv);
}

function createServerSection(title: string, servers: Server[], type: string) {
    const list = document.getElementById('servers-list');
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('server-section');
    
    const sectionTitle = document.createElement('div');
    sectionTitle.classList.add('server-section-title');
    sectionTitle.textContent = title;
    sectionDiv.appendChild(sectionTitle);
    
    list?.appendChild(sectionDiv);
    
    servers.forEach((server) => {
        createServer(server, server.number, 
            config.selectedServer == server.number && config.serverType == type, 
            false, type);
    });
}

// Создаем секцию для избранных серверов
function createFavoriteSection() {
    if (config.favoriteServers.length === 0) return;
    
    const list = document.getElementById('servers-list');
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('server-section');
    
    const sectionTitle = document.createElement('div');
    sectionTitle.classList.add('server-section-title');
    sectionTitle.textContent = 'Избранное';
    sectionDiv.appendChild(sectionTitle);
    
    list?.appendChild(sectionDiv);
    
    config.favoriteServers.forEach((favServer) => {
        // Создаем временный объект Server из FavoriteServer
        const server: Server = {
            number: favServer.number,
            name: favServer.name,
            ip: favServer.ip,
            port: favServer.port,
            online: favServer.online,
            maxplayers: favServer.maxplayers,
            password: false,
            vk: '',
            tg: '',
            inst: '',
            icon: favServer.icon,
            additionalIps: [],
            donateMultiplier: 1,
            experienceMultiplier: 1,
            plotPoints: []
        };
        
        createServer(server, favServer.number, 
            config.selectedServer == favServer.number && config.serverType == favServer.serverType, 
            false, favServer.serverType);
    });
}

function updateServersDisplay() {
    const list = document.getElementById('servers-list');
    if (list) list.innerHTML = '';

    // Сначала показываем избранные сервера
    createFavoriteSection();
    
    // Затем обычные сервера
    if (arizonaServers.length > 0) {
        createServerSection('Arizona RP', arizonaServers, 'arizona');
    }
    
    if (mobileServers && mobileServers.length > 0) {
        createServerSection('Arizona Mobile', mobileServers, 'arizonaMobile');
    }
    
    if (rodinaServers && rodinaServers.length > 0) {
        createServerSection('Rodina RP', rodinaServers, 'rodina');
    }
}

function showSettingsDialog() {
    const dialog = document.getElementById('dialog-settings') as HTMLDialogElement;
    if (dialog) {
        dialog.showModal();
    }
}

// Загрузка конфигурации при старте
function initializeApp() {
    loadConfig();
    EventsEmit('servers:request');
    
    setInterval(() => {
        console.log('Requesting servers update...');
        EventsEmit('servers:request');
    }, 10000);
    
    document.querySelectorAll('input[type=checkbox]').forEach((el) => el.addEventListener('click', () => {
        //@ts-ignore
        config.params[el.id] = el.checked
        saveConfig();
    }));
    
    //@ts-ignore
    document.getElementById('button-settings')?.addEventListener('click', showSettingsDialog);
    
    const nameInput = document.getElementById('name');
    nameInput?.addEventListener('input', () => {
        //@ts-ignore
        config.name = nameInput.value;
    });
    
    document.getElementById('path')?.addEventListener('click', () => EventsEmit('settings:requestFileDialog', 'arizona'))
    document.getElementById('rodina-path')?.addEventListener('click', () => EventsEmit('settings:requestFileDialog', 'rodina'))
    document.getElementById('toggle-password')?.addEventListener('click', togglePasswordVisibility);
    
    document.getElementById('button-play')?.addEventListener('click', () => {
        saveConfig();
        
        let selectedServer: Server;
        
        // Выбираем сервер из соответствующего списка
        if (config.serverType === 'rodina') {
            selectedServer = rodinaServers.find((s) => s.number == config.selectedServer) ?? rodinaServers[0];
        } else if (config.serverType === 'arizonaMobile') {
            selectedServer = mobileServers.find((s) => s.number == config.selectedServer) ?? mobileServers[0];
        } else {
            selectedServer = arizonaServers.find((s) => s.number == config.selectedServer) ?? arizonaServers[0];
        }
        
        // Определяем путь к игре
        let gamePath = config.path;
        if (config.serverType === 'rodina' && config.rodinaPath) {
            gamePath = config.rodinaPath;
        }
        
        if (!gamePath) {
            alert('Укажите путь к игре в настройках!');
            showSettingsDialog();
            return;
        }
        
        let params: string[] = [];
        
        if (config.serverType === 'rodina') {
            // Для Rodina используем ТОЛЬКО базовые параметры
            params = [
                '-c',
                `-h ${selectedServer.ip}`,
                `-p ${selectedServer.port}`,
                `-n ${config.name}`,
                '-rodina',
                '-z',
                `-mem ${config.memory.toString().length > 0 ? config.memory : '4096'}`,
                '-ldo'
            ];
            console.log('Selected Rodina server:', selectedServer.ip);
        } else {
            // Для Arizona полный набор параметров
            params = [
                '-c',
                '-arizona',
                `-h ${selectedServer.ip}`,
                `-p ${selectedServer.port}`,
                `-n ${config.name}`,
                `-mem ${config.memory.toString().length > 0 ? config.memory : '2048'}`,
                '-referrer',
                '-userId undefined',
                config.pass.length > 0 ? `-z ${config.pass}` : '',
            ];
            for (const [param, value] of Object.entries(config.params)) {
                if (value) params.push(`-${parameterName[param]}`);
            }
            console.log('Selected Arizona server:', selectedServer.ip);
        }
        
        console.log('Server type:', config.serverType);
        console.log('Game path:', gamePath);
        console.log('Selected server IP:', selectedServer.ip);
        console.log('Parameters:', params.join(' '));
        
        StartGame(config.name, gamePath, params, config.serverType);
    });
}

// Инициализация при загрузке DOM
addEventListener('DOMContentLoaded', initializeApp);

EventsOn('settings:fileDialogPathSelected', (path: string, gameType: string) => {
    if (gameType === 'rodina') {
        config.rodinaPath = path;
        // @ts-ignore
        document.getElementById('rodina-path').value = path;
    } else {
        config.path = path;
        // @ts-ignore
        document.getElementById('path').value = path;
    }
    saveConfig();
});

EventsOn('servers:update', (servers: Server[], mobileServersFromAPI: Server[], rodinaServersFromAPI: Server[]) => {
    console.log('servers:update');
    
    // Сохраняем сервера в отдельные массивы
    arizonaServers = servers;
    mobileServers = mobileServersFromAPI || [];
    rodinaServers = rodinaServersFromAPI || [];

    // Обновляем онлайн статус для избранных серверов
    config.favoriteServers.forEach(fav => {
        let sourceServers: Server[] = [];
        
        switch (fav.serverType) {
            case 'arizona':
                sourceServers = arizonaServers;
                break;
            case 'arizonaMobile':
                sourceServers = mobileServers;
                break;
            case 'rodina':
                sourceServers = rodinaServers;
                break;
        }
        
        const currentServer = sourceServers.find(s => s.number === fav.number);
        if (currentServer) {
            fav.online = currentServer.online;
            fav.maxplayers = currentServer.maxplayers;
        }
    });

    // Обновляем отображение
    updateServersDisplay();

    // Обновляем общий список серверов для совместимости
    serversList = [...arizonaServers, ...mobileServers, ...rodinaServers];
    
    console.log('Arizona servers count:', arizonaServers.length);
    console.log('Mobile servers count:', mobileServers.length);
    console.log('Rodina servers count:', rodinaServers.length);
    console.log('Favorite servers count:', config.favoriteServers.length);
});

EventsOn('server:update_players', (host: string, players: number, maxplayers: number) => {
    const server = serversList.find((s) => s.ip == host);
    if (server) {
        const playersCount = document.getElementById(`players-count-${server.number}`);
        if (playersCount) playersCount.textContent = `${players}/${maxplayers}`;
    }
    console.log('server:update_players', host, players, maxplayers);
})