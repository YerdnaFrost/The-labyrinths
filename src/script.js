// Данные лабиринтов
const mazeData = [
    [
        "010101111110100100",
        "111100010011111110",
        "010111111010101011",
        "010000011110100001",
        "111111001010101011",
        "100011101000111001",
        "110110101101101111",
        "000000101000100010",
        "111111111111101111",
        "010010001101100100",
        "010111100100111101",
        "110000110110000111",
        "011110100011111100",
        "000100111001000101",
        "110110001101110101",
        "010111111100011111",
        "111101100101001001",
        "110100110111111101"
    ],
    [
        "110111001001101011",
        "010101111101001001",
        "111101010111111101",
        "110001000000100111",
        "100111111111110010",
        "110101000010010111",
        "010001000111010101",
        "111011110001000101",
        "001110111011111100",
        "101000001010001001",
        "111010101111101111",
        "101110100010101001",
        "001011111110001100",
        "111000101011111110",
        "110011100010101011",
        "010110101111101000",
        "110010001001001111",
        "111111111101011010"
    ],
    [
        "000110100100110101",
        "010010101110100111",
        "110110111011110100",
        "010100100010011111",
        "011111110111001011",
        "110101010001011110",
        "100001011101010011",
        "111101000111111010",
        "010111010101001011",
        "010001011101101010",
        "111011110001001110",
        "100000010101011011",
        "111111111111011110",
        "010001000101110011",
        "111011111100110110",
        "010001010110011100",
        "011111000111110111",
        "110101011100100101"
    ],
    [
        "011111010101100111",
        "000101110101111101",
        "111101010100100100",
        "000101110111110111",
        "011100010100011100",
        "010111010101110111",
        "110001111100100101",
        "111111010001110111",
        "100011011111000110",
        "111010000101010010",
        "001010101101010111",
        "111011111001010100",
        "101110101011111110",
        "100010001010000010",
        "110111111010101111",
        "010101010011101011",
        "010100010110100010",
        "111110111100111111"
    ],
    [
        "111001110101111111",
        "101101010100010001",
        "001001011111111011",
        "101111001010001001",
        "111001100010101101",
        "010011111010100111",
        "110110001010111101",
        "010010101110101001",
        "111110101011101111",
        "100010111000001001",
        "110111101110111011",
        "010110000100010000",
        "010100111111111101",
        "111101100001010111",
        "000100101101000100",
        "011111101001011111",
        "110010111101001010",
        "011010010111100011"
    ]
];

// Состояние приложения
let history = [];
let currentState = null;

// Функция для глубокого копирования состояния
function deepCopyState(state) {
    const copy = {
        mazes: []
    };
    
    for (const mazeState of state.mazes) {
        const mazeCopy = {
            cells: JSON.parse(JSON.stringify(mazeState.cells)),
            paths: []
        };
        
        for (const path of mazeState.paths) {
            const pathCopy = {
                cells: new Map(path.cells),
                sources: new Set(path.sources),
                treasures: new Set(path.treasures),
                closeCells: new Set(path.closeCells)
            };
            mazeCopy.paths.push(pathCopy);
        }
        
        copy.mazes.push(mazeCopy);
    }
    
    return copy;
}

// Функция для восстановления состояния из копии
function restoreState(copy) {
    currentState = deepCopyState(copy);
}

// Инициализация
function init() {
    currentState = {
        mazes: []
    };
    
    for (let i = 0; i < mazeData.length; i++) {
        const maze = mazeData[i];
        const rows = maze.length;
        const cols = maze[0].length;
        
        const mazeState = {
            cells: [],
            paths: []
        };
        
        // Создаем базовые клетки
        for (let y = 0; y < rows; y++) {
            const row = [];
            for (let x = 0; x < cols; x++) {
                row.push({
                    isWall: maze[y][x] === '0',
                    isPath: maze[y][x] === '1'
                });
            }
            mazeState.cells.push(row);
        }
        
        // Создаем начальные пути
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (maze[y][x] === '1') {
                    mazeState.paths.push({
                        cells: new Map([[`${x},${y}`, 'current']]),
                        sources: new Set(),
                        treasures: new Set(),
                        closeCells: new Set()
                    });
                }
            }
        }
        
        currentState.mazes.push(mazeState);
    }
    
    // Сохраняем начальное состояние в историю
    history = [deepCopyState(currentState)];
    
    // Рендерим все лабиринты
    renderAllMazes();
    updateStats();
}

// Рендер всех лабиринтов
function renderAllMazes() {
    for (let i = 0; i < mazeData.length; i++) {
        renderMaze(i);
    }
}

// Определение цвета клетки на основе всех активных путей
function getCellColor(mazeState, x, y) {
    const cell = mazeState.cells[y][x];
    if (cell.isWall) return 'wall';
    
    const key = `${x},${y}`;
    let hasPossible = false;
    let hasSource = false;
    let hasVisited = false;
    let hasTreasure = false;
    let hasClose = false;
    
    // Проверяем все активные пути
    for (const path of mazeState.paths) {
        const type = path.cells.get(key);
        
        if (type === 'current') hasPossible = true;
        if (path.sources.has(key)) hasSource = true;
        if (type === 'visited') hasVisited = true;
        if (path.treasures.has(key)) hasTreasure = true;
        if (path.closeCells.has(key)) hasClose = true;
    }
    
    // Приоритет цветов: Белый < Зелёный < Синий < Жёлтый < Фиолетовый < Красный
    if (hasPossible) return 'possible';
    if (hasClose) return 'close';
    if (hasTreasure) return 'treasure';
    if (hasSource) return 'source';
    if (hasVisited) return 'visited';
    
    return 'path';
}

// Рендер лабиринта
function renderMaze(mazeIndex) {
    const mazeElement = document.getElementById(`maze-${mazeIndex}`);
    const statusElement = document.getElementById(`status-${mazeIndex}`);
    const mazeState = currentState.mazes[mazeIndex];
    
    if (!mazeElement) return;
    
    mazeElement.innerHTML = '';
    const rows = mazeState.cells.length;
    const cols = mazeState.cells[0].length;
    mazeElement.style.gridTemplateColumns = `repeat(${cols}, 10px)`;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.classList.add(getCellColor(mazeState, x, y));
            mazeElement.appendChild(cell);
        }
    }
    
    const activePaths = mazeState.paths.length;
    statusElement.textContent = `Активных путей: ${activePaths}`;
}

// Обновление статистики
function updateStats() {
    let totalCellsPassed = 0;
    let totalTreasureCollected = 0;
    
    for (const mazeState of currentState.mazes) {
        const visitedCells = new Set();
        const treasureCells = new Set();
        
        for (const path of mazeState.paths) {
            // Считаем все непрозрачные клетки как пройденные
            for (const [key, type] of path.cells) {
                if (type === 'visited' || type === 'current') {
                    visitedCells.add(key);
                }
            }
            
            // Считаем источники
            for (const key of path.sources) {
                visitedCells.add(key);
            }
            
            // Считаем добычу
            for (const key of path.treasures) {
                visitedCells.add(key);
                treasureCells.add(key);
            }
            
            // Считаем близкие клетки
            for (const key of path.closeCells) {
                visitedCells.add(key);
            }
        }
        
        totalCellsPassed += visitedCells.size;
        totalTreasureCollected += treasureCells.size;
    }
    
    document.getElementById('cells-passed').textContent = `Пройдено клеток: ${totalCellsPassed}`;
    document.getElementById('treasure-collected').textContent = `Собрано добычи: ${totalTreasureCollected}`;
}

// Перемещение в указанном направлении
function move(direction) {
    // Сохраняем текущее состояние в переменную ДО изменений
    const previousState = deepCopyState(currentState);
    history.push(previousState);
    
    let totalActivePaths = 0;
    let hasInvalidMove = false;
    
    for (let i = 0; i < mazeData.length; i++) {
        const mazeState = currentState.mazes[i];
        const maze = mazeData[i];
        const rows = maze.length;
        const cols = maze[0].length;
        
        const newPaths = [];
        
        for (const path of mazeState.paths) {
            // Находим текущую позицию в пути
            let currentX, currentY, currentKey;
            for (const [key, type] of path.cells) {
                if (type === 'current') {
                    [currentX, currentY] = key.split(',').map(Number);
                    currentKey = key;
                    break;
                }
            }
            
            if (currentX === undefined || currentY === undefined) continue;
            
            let newX = currentX;
            let newY = currentY;
            
            switch (direction) {
                case 'north': newY--; break;
                case 'south': newY++; break;
                case 'west': newX--; break;
                case 'east': newX++; break;
            }
            
            if (newX >= 0 && newX < cols && newY >= 0 && newY < rows && 
                maze[newY][newX] === '1') {
                // Создаем новый путь с перемещением
                const newPath = {
                    cells: new Map(path.cells),
                    sources: new Set(path.sources),
                    treasures: new Set(path.treasures),
                    closeCells: new Set(path.closeCells)
                };
                // Помечаем старую позицию как посещенную
                newPath.cells.set(currentKey, 'visited');
                // Добавляем новую позицию как текущую
                newPath.cells.set(`${newX},${newY}`, 'current');
                newPaths.push(newPath);
            } else {
                hasInvalidMove = true;
            }
        }
        
        // Обновляем пути
        mazeState.paths = newPaths;
        totalActivePaths += newPaths.length;
    }
    
    // Проверяем, не стало ли активных путей 0
    if (totalActivePaths === 0 && hasInvalidMove) {
        alert("Вы определённо упёрлись в стену. Возвращаемся к предыдущему состоянию.");
        // Восстанавливаем состояние ДО попытки движения
        restoreState(previousState);
        // Удаляем последнюю запись из истории (неудачную попытку)
        history.pop();
        renderAllMazes();
        updateStats();
        return;
    }
    
    renderAllMazes();
    updateStats();
}

// Установка карты источника
function setSource() {
    // Сохраняем текущее состояние перед изменением
    history.push(deepCopyState(currentState));
    
    for (let i = 0; i < currentState.mazes.length; i++) {
        const mazeState = currentState.mazes[i];
        
        // Для каждого активного пути проверяем текущую позицию
        for (const path of mazeState.paths) {
            // Находим текущую позицию (красную клетку)
            let currentKey = null;
            for (const [key, type] of path.cells) {
                if (type === 'current') {
                    currentKey = key;
                    break;
                }
            }
            
            // Если нашли красную клетку, добавляем её как источник
            if (currentKey) {
                path.sources.add(currentKey);
            }
        }
    }
    
    renderAllMazes();
    updateStats();
}

// Установка добычи
function setTreasure() {
    // Сохраняем текущее состояние перед изменением
    history.push(deepCopyState(currentState));
    
    for (let i = 0; i < currentState.mazes.length; i++) {
        const mazeState = currentState.mazes[i];
        
        // Для каждого активного пути проверяем текущую позицию
        for (const path of mazeState.paths) {
            // Находим текущую позицию (красную клетку)
            let currentKey = null;
            for (const [key, type] of path.cells) {
                if (type === 'current') {
                    currentKey = key;
                    break;
                }
            }
            
            // Если нашли красную клетку, добавляем её как добычу
            if (currentKey) {
                path.treasures.add(currentKey);
            }
        }
    }
    
    renderAllMazes();
    updateStats();
}

// Установка близкой клетки
function setClose() {
    // Сохраняем текущее состояние перед изменением
    history.push(deepCopyState(currentState));
    
    for (let i = 0; i < currentState.mazes.length; i++) {
        const mazeState = currentState.mazes[i];
        
        // Для каждого активного пути проверяем текущую позицию
        for (const path of mazeState.paths) {
            // Находим текущую позицию (красную клетку)
            let currentKey = null;
            for (const [key, type] of path.cells) {
                if (type === 'current') {
                    currentKey = key;
                    break;
                }
            }
            
            // Если нашли красную клетку, добавляем её как близкую
            if (currentKey) {
                path.closeCells.add(currentKey);
            }
        }
    }
    
    renderAllMazes();
    updateStats();
}

// Отмена последнего действия
function undo() {
    if (history.length > 1) {
        // Удаляем текущее состояние из истории
        history.pop();
        // Восстанавливаем предыдущее состояние
        restoreState(history[history.length - 1]);
        
        renderAllMazes();
        updateStats();
    }
}

// Сброс к начальному состоянию
function reset() {
    history = [];
    init();
}

// Инициализация при загрузке страницы
window.onload = function() {
    init();
    
    document.getElementById('north').addEventListener('click', () => move('north'));
    document.getElementById('south').addEventListener('click', () => move('south'));
    document.getElementById('west').addEventListener('click', () => move('west'));
    document.getElementById('east').addEventListener('click', () => move('east'));
    document.getElementById('close').addEventListener('click', setClose);
    document.getElementById('set-source').addEventListener('click', setSource);
    document.getElementById('set-treasure').addEventListener('click', setTreasure);
    document.getElementById('undo').addEventListener('click', undo);
    document.getElementById('reset').addEventListener('click', reset);
    
    // Защита и информация об авторе
    console.log('%c🔮 Определитель Лабиринта', 'font-size: 20px; color: #4CAF50; font-weight: bold;');
    console.log('%cАвтор: Ваше Имя', 'color: #2196F3;');
    console.log('%cСоздано с помощью JavaScript', 'color: #FF5722;');
};