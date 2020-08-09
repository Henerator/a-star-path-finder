
Array.prototype.isEmpty = function () {
    return this.length === 0;
}

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

let width;
let height;
let size;

const rows = 25;
const cols = 25;
let cellSize = {};

let animationId;

let closedSet = [];
let openSet = []
let pathMap = [];
let walls = [];

const startPosition = {
    x: 0,
    y: 0,
};

const endPosition = {
    x: cols - 1,
    y: rows - 1,
};

const startCell = new Cell(startPosition.x, startPosition.y);
const endCell = new Cell(endPosition.x, endPosition.y);

window.addEventListener('resize', () => {
    resizeCanvas();
    draw();
});

document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        stopAnimation();
        start();
    }
});

start();

function start() {
    resizeCanvas();
    setup();
    animate(update);
}

function animate(action) {
    animationId = requestAnimationFrame(function frameAnimate() {
        animationId = requestAnimationFrame(frameAnimate);
        action();
    });
}

function stopAnimation() {
    window.cancelAnimationFrame(animationId);
}

function setup() {
    setWalls();

    closedSet = [];
    openSet = [];
    pathMap = [];
    openSet.push(startCell);
}

function setWalls() {
    walls = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if ((startCell.x === col && startCell.y === row) ||
                (endCell.x === col & endCell.y === row)
            ) {
                continue;
            }

            if (Math.random() < 0.4) {
                walls.push(new Cell(col, row));
            }
        }
    }
}

function update() {
    // NO PATH FOUND
    if (openSet.isEmpty()) {
        stopAnimation();
        draw();
        console.log('No path found');
        return;
    }

    // CURRENT CELL
    const currentCell = openSet.reduce((prev, cur) => {
        return (cur.f < prev.f)
            ? cur
            : prev;
    }, openSet[0]);

    // END OF SEARCH
    if (currentCell.isEqual(endCell)) {
        stopAnimation();
        reconstructPath(currentCell);
        draw();
        return;
    }

    // REMOVE CURRENT FORM OPENSET
    openSet = removeElement(openSet, currentCell);
    closedSet.push(currentCell);

    // NEIGHBOURS
    const currentCellNeighbours = currentCell.getNeighbors();
    currentCellNeighbours.forEach(neighbour => {
        if (hasElement(closedSet, neighbour) || hasElement(walls, neighbour)) {
            return;
        }

        const tentativeG = currentCell.g + distance(currentCell, neighbour);
        let minPathFound = false;

        if (!hasElement(openSet, neighbour)) {
            openSet.push(neighbour);
            minPathFound = true;
        } else {
            if (tentativeG < neighbour.g) {
                minPathFound = true;
            } else {
                minPathFound = false;
            }
        }

        if (minPathFound) {
            neighbour.parent = currentCell;
            neighbour.updateParams(tentativeG);
        }
    });

    draw();
}

function resizeCanvas() {
    width = document.body.clientWidth;
    height = document.body.clientHeight;

    size = Math.min(width, height);

    canvas.width = size;
    canvas.height = size;

    cellSize = {
        width: size / cols,
        height: size / rows,
    };
}

function clear() {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
}

function draw() {
    clear();

    // CLOSED
    context.fillStyle = '#f00';
    closedSet.forEach(cell => {
        fillCell(cell);
    });

    // OPENED
    context.fillStyle = '#0f0';
    openSet.forEach(cell => {
        fillCell(cell);
    });

    // PATH
    context.fillStyle = '#00f';
    pathMap.forEach(cell => {
        fillCell(cell);
    });

    // WALLS
    context.fillStyle = '#000';
    walls.forEach(cell => {
        fillCell(cell);
    });

    context.strokeStyle = '#333';
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            context.strokeRect(cellSize.width * col, cellSize.height * row, cellSize.width, cellSize.height);
        }
    }
}

function fillCell(cell) {
    context.fillRect(cell.x * cellSize.width, cell.y * cellSize.height, cellSize.width, cellSize.height);
}

function Cell(x, y, parent) {
    this.x = x;
    this.y = y;

    this.g = 0;
    this.h = heuristic(x, y);
    this.f = this.g + this.h;

    this.parent = parent;

    this.isEqual = function (cell) {
        return cell.x === this.x
            && cell.y === this.y;
    };

    this.getNeighbors = function () {
        const neighbours = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                if (x === 0 && y === 0) {
                    continue;
                }

                const neighbourX = this.x + x;
                const neighbourY = this.y + y;
                if (!isOutOfField(neighbourX, neighbourY)) {
                    neighbours.push(new Cell(neighbourX, neighbourY));
                }
            }
        }
        return neighbours;
    };

    this.updateParams = function (g) {
        this.g = g;
        this.h = heuristic(x, y);
        this.f = this.g + this.h;
    };
}

function heuristic(x, y) {
    // for 4 directions
    return Math.abs(x - endPosition.x) + Math.abs(y - endPosition.y);

    // for 8 directions
    // return Math.max(Math.abs(x - endPosition.x), Math.abs(y - endPosition.y));
}

function isOutOfField(x, y) {
    return x < 0 || x > cols - 1 || y < 0 || y > rows - 1;
}

function distance(ptA, ptB) {
    const dx = ptB.x - ptA.x;
    const dy = ptB.y - ptA.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function removeElement(arr, cell) {
    return arr.filter(item => !item.isEqual(cell));
}

function hasElement(arr, cell) {
    const arrCell = arr.find(item => item.isEqual(cell));
    return !!arrCell;
}

function reconstructPath(end) {
    pathMap = [];

    let currentCell = end;
    while (currentCell.parent) {
        pathMap.unshift(currentCell);
        currentCell = currentCell.parent;
    }
    pathMap.unshift(startCell);
    return pathMap;
}
