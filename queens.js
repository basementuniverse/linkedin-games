// Solver for LinkedIn's Queens game
// Instructions: solve(initialiseBoard(BOARD, []))
// (optionally pass in an array of known queen positions as the second argument to initialiseBoard)
// Rules:
// - place 1 queen in each row, column, and region
// - queens cannot be adjacent to each other (including diagonals)

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const BOARD_1 = {
  width: 8,
  height: 8,
  cells: [
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 2, 0, 0, 0, 0,
    1, 1, 2, 2, 3, 4, 4, 0,
    5, 5, 2, 3, 3, 4, 0, 0,
    5, 5, 5, 5, 3, 6, 6, 0,
    5, 5, 5, 5, 5, 5, 6, 0,
    5, 5, 5, 5, 5, 5, 7, 7,
    5, 5, 5, 5, 5, 5, 5, 7,
  ],
};
const BOARD_2 = {
  width: 9,
  height: 9,
  cells: [
    0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 0, 0, 0, 0, 0, 2, 0, 0,
    1, 3, 3, 3, 3, 0, 2, 2, 2,
    1, 1, 4, 3, 3, 0, 5, 5, 5,
    6, 1, 4, 3, 3, 0, 5, 7, 7,
    6, 1, 4, 8, 3, 0, 5, 5, 7,
    6, 1, 4, 8, 3, 0, 5, 7, 7,
    6, 6, 4, 8, 8, 8, 5, 5, 5,
  ],
};
const BOARD_3 = {
  width: 10,
  height: 10,
  cells: [
    0, 1, 2, 2, 2, 3, 3, 3, 3, 3,
    0, 1, 1, 2, 2, 3, 3, 3, 4, 4,
    0, 1, 1, 2, 2, 5, 3, 3, 3, 4,
    0, 0, 1, 2, 2, 5, 3, 3, 3, 4,
    1, 0, 1, 2, 2, 5, 5, 3, 3, 4,
    1, 1, 1, 2, 2, 6, 5, 3, 3, 4,
    1, 1, 1, 1, 2, 6, 6, 4, 4, 4,
    7, 2, 2, 2, 2, 9, 9, 4, 4, 4,
    7, 2, 8, 2, 2, 9, 9, 4, 4, 9,
    7, 7, 8, 8, 2, 9, 9, 9, 9, 9,
  ],
};

const COLOURS = [
  'red', 'green', 'blue', 'purple', 'orange', 'lime', 'yellow', 'navy',
  'pink', 'cyan', 'teal', 'magenta', 'maroon', 'olive', 'silver', 'gray',
];
const MAX_SOLVER_ITERATIONS = 100000;
const MAX_GENERATOR_ITERATIONS = 1000;
const ANIMATE = false;

// -----------------------------------------------------------------------------
// UTILITIES
// -----------------------------------------------------------------------------

// Convert between positions { x: number, y: number } and indices
const pos = (i, width) => ({ x: i % width, y: Math.floor(i / width) });
const ind = ({ x, y }, width) => y * width + x;

// Generate a random int in the interval [min, max)
const randomInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

// Get an array of integers in the interval [0, n)
const range = n => Array(n).fill(0).map((_, i) => i);

// Check if a position is within the bounds of the board
const positionInBounds = (p, width, height) => (
  p.x >= 0 && p.x < width && p.y >= 0 && p.y < height
);

// Get a 3x3 area around a position (including the given position)
const mooreNeighbourhood = (p, width, height) => range(3)
  .flatMap(y => range(3).map(x => ({
    x: p.x + (x - 1),
    y: p.y + (y - 1),
  })))
  .filter(p => positionInBounds(p, width, height));

// Get a 4-cell area around a position (including the given position)
const vonNeumannNeighbourhood = (p, width, height) => [
  { x: p.x, y: p.y - 1 },
  { x: p.x - 1, y: p.y },
  { x: p.x + 1, y: p.y },
  { x: p.x, y: p.y + 1 },
].filter(p => positionInBounds(p, width, height));

// Count how many queens are in a set of cells
// type cell => { r: number (region id), q: boolean (queen) }
const countQueens = cells => cells.filter(cell => cell.q).length;

// Check if there is one queen in a set of cells
const hasOneQueen = cells => countQueens(cells) === 1;

// Get a row of cells from a board
const getRow = (board, y) => range(board.width).map(
  x => board.cells[ind({ x, y }, board.width)]
);

// Get a column of cells from a board
const getColumn = (board, x) => range(board.height).map(
  y => board.cells[ind({ x, y }, board.width)]
);

// Group cells by region
// returns { [regionId: number]: cell[] }
const groupByRegion = board => board.cells.reduce(
  (a, c) => ({ ...a, [c.r]: [...(a[c.r] ?? []), c] }),
  {}
);

// Get the indices of all queens on the board
const getQueens = board => board.cells.reduce(
  (a, c, i) => c.q ? [...a, i] : a, []
);

// Get the cells in the area around a queen
const getQueenArea = (board, q) => mooreNeighbourhood(
  pos(q, board.width),
  board.width,
  board.height
).map(p => board.cells[ind(p, board.width)]);

// Clone a board state
const cloneBoard = board => ({
  width: board.width,
  height: board.height,
  cells: [...board.cells.map(({ r, q }) => ({ r, q }))],
});

// Check if a list of cells has unassigned regions
const hasUnassignedRegions = cells => cells.some(cell => cell.r === null);

// Weighted random number generator
const weightedRandom = w => {
  let total = w.reduce((a, i) => a + i, 0), n = 0;
  const r = Math.random() * total;
  while (total > r) {
    total -= w[n++];
  }
  return n - 1;
};

// Fisher-Yates shuffle
const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// -----------------------------------------------------------------------------
// GAME LOGIC
// -----------------------------------------------------------------------------

// Generate a board definition from a 1d array of regions and queen positions
function initialiseBoard(width, height, regions, queens = []) {
  const queenMap = queens
    .map(q => ind(q, width))
    .reduce((a, c) => ({ ...a, [c]: true, }), {});
  return {
    width,
    height,
    cells: regions.map((r, i) => ({ r, q: !!queenMap[i] })),
  };
}

// Remove all queens from a board
function resetBoard(board) {
  return {
    width: board.width,
    height: board.height,
    cells: board.cells.map(cell => ({ ...cell, q: false })),
  };
}

// Generate a new board with a queen at the given position
function addQueenAtPosition(board, p) {
  const clone = cloneBoard(board);
  clone.cells[ind(p, board.width)].q = true;
  return clone;
}

// Check if a board is in winning or losing state
function checkWin(board) {
  const regions = groupByRegion(board);
  return (
    // All columns populated
    range(board.width).every(x => hasOneQueen(getColumn(board, x))) &&

    // All rows populated
    range(board.height).every(y => hasOneQueen(getRow(board, y))) &&

    // All regions populated
    Object.values(regions).every(r => hasOneQueen(r)) &&

    // No queens directly adjacent to each other (inc. diagonals)
    getQueens(board).every(q => hasOneQueen(getQueenArea(board, q)))
  );
}

// Get a list of valid queen placements as an array of positions
function getValidPlacements(board) {
  const rows = range(board.height).map(y => getRow(board, y));
  const columns = range(board.width).map(x => getColumn(board, x));
  const regions = groupByRegion(board);
  return range(board.width * board.height)
    .filter(i => {
      const p = pos(i, board.width);
      return (
        // No queen at this position
        !board.cells[i].q &&

        // No queens in this row
        countQueens(rows[p.y]) === 0 &&

        // No queens in this column
        countQueens(columns[p.x]) === 0 &&

        // No queens in this region
        countQueens(regions[board.cells[i].r]) === 0 &&

        // No queens in this adjacency region
        countQueens(getQueenArea(board, i)) === 0
      );
    })
    .map(i => pos(i, board.width));
}

// -----------------------------------------------------------------------------
// SOLVER
// -----------------------------------------------------------------------------

// Collapse any cells that must have a queen
function collapse(board) {
  let collapsed = cloneBoard(board);
  const groupedValidPlacements = getValidPlacements(board)
    .reduce(
      (a, c) => ({
        ...a,
        [board.cells[ind(c, board.width)].r]: [
          ...(a[board.cells[ind(c, board.width)].r] ?? []),
          c,
        ],
      }),
      {}
    );

  // If any region has one valid placement, then it must have a queen
  Object.values(groupedValidPlacements).forEach(region => {
    if (region.length === 1) {
      collapsed = addQueenAtPosition(collapsed, region[0]);
    }
  });

  return collapsed;
}

// State cache
let seenStates = {};
const hashState = state => state.cells.map(({ r, q }) => `${r}_${q}`).join('|');
const cacheState = state => { seenStates[hashState(state)] = true; }
const hasSeenState = state => !!seenStates[hashState(state)];

// Solve a game of queens
// board => { r: number, q: boolean }[]
async function solve(board) {
  seenStates = {};
  const stack = [board];
  cacheState(board);

  // Iterate until the stack is empty...
  let iterations = 0;
  while (++iterations <= MAX_SOLVER_ITERATIONS && stack.length) {
    const currentVertex = stack.pop();

    // If this is a winning state, then we're done
    if (checkWin(currentVertex)) {
      console.log(`Solved in ${iterations} iterations`);
      render(currentVertex);
      return true;
    }

    // Cache adjacent vertices and push them onto the stack
    getValidPlacements(currentVertex)
      .map(p => ({
        move: p,
        state: addQueenAtPosition(currentVertex, p),
      }))
      .filter(adjacent => !hasSeenState(adjacent.state))
      .map(adjacent => ({
        ...adjacent,
        h: heuristic(adjacent.state, adjacent.move),
      }))
      .sort((a, b) => b.h - a.h)
      .forEach(adjacent => {
        const collapsed = collapse(adjacent.state);
        stack.push(collapsed);
        cacheState(collapsed);
      });

    if (ANIMATE) {
      render(currentVertex);
      await sleep(30);
    }
  }

  // Game is not solvable or we didn't search long enough
  console.log('Failed to solve');
  return false;
}

// Heuristic function generates a score for a board state
function heuristic(board, move) {
  let score = 0;

  // More constrained states are better
  score += 100 / Math.max(getValidPlacements(board).length, 1);

  // Try to place queens in smaller regions first
  const regionSizes = Object.values(groupByRegion(board)).map(
    region => region.length
  );
  const regionThisMove = board.cells[ind(move, board.width)].r;
  score += 100 / regionSizes[regionThisMove];

  return score;
}

// -----------------------------------------------------------------------------
// RENDERING
// -----------------------------------------------------------------------------

// Helper function to sleep for a number of milliseconds
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Dump a board state to the console
function render(board) {
  const canvasWidth = 400;
  const canvasHeight = 400;

  const canvas = document.querySelector('#queens');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext('2d');
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const cellSize = {
    x: canvasWidth / board.width,
    y: canvasHeight / board.height,
  };

  // Regions
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      context.fillStyle = COLOURS[
        board.cells[ind({ x, y }, board.width)].r % COLOURS.length
      ];
      context.fillRect(
        x * cellSize.x,
        y * cellSize.y,
        cellSize.x,
        cellSize.y
      );
    }
  }

  // Grid
  context.strokeStyle = '#00000030';
  for (let i = 0; i < board.width; i++) {
    line(
      context,
      { x: i * cellSize.x, y: 0 },
      { x: i * cellSize.x, y: canvasHeight }
    );
  }
  for (let i = 0; i < board.height; i++) {
    line(
      context,
      { x: 0, y: i * cellSize.y },
      { x: canvasWidth, y: i * cellSize.y }
    );
  }

  // Queens
  context.fillStyle = '#000000';
  context.font = `${
    Math.floor(Math.min(cellSize.x, cellSize.y) / 2)
  }px sans-serif`;
  for (let i = 0; i < board.width * board.height; i++) {
    const p = pos(i, board.width);
    if (board.cells[i].q) {
      context.fillText(
        '👑',
        p.x * cellSize.x + cellSize.x / 2,
        p.y * cellSize.y + cellSize.y / 2
      );
    }
  }
}

function line(context, a, b) {
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

window.addEventListener('DOMContentLoaded', () => {
  render(initialiseBoard(BOARD_1.width, BOARD_1.height, BOARD_1.cells));
});

// -----------------------------------------------------------------------------
// Generator
// -----------------------------------------------------------------------------

// Generate a random game
function generateGame(size) {
  const result = range(size * size).map(() => ({ r: null, growthRate: 0 }));

  // Generate random positions, regions, and growth rates for the N queens
  shuffle(range(size)).forEach((x, y) => {
    const p = { x, y };
    const i = ind(p, size);

    result[i].r = y;
    result[i].q = true;
    result[i].growthRate = Math.random();
  });

  // Iterate until every cell has been assigned a region
  let iterations = 0;
  while (
    hasUnassignedRegions(result) &&
    iterations++ < MAX_GENERATOR_ITERATIONS
  ) {
    // Find all unassigned cells adjacent to assigned cells
    const unassigned = result
      .map((cell, i) => ({ ...cell, i }))
      .filter(cell => cell.r === null)
      .map(cell => {
        const p = pos(cell.i, size);
        return {
          ...cell,
          neighbours: [
            { x: p.x - 1, y: p.y },
            { x: p.x + 1, y: p.y },
            { x: p.x, y: p.y - 1 },
            { x: p.x, y: p.y + 1 },
          ]
            .filter(p => positionInBounds(p, size, size))
            .map(p => result[ind(p, size)]),
        };
      })
      .filter(cell => cell.neighbours.some(n => n.r !== null));

    // Pick a random unassigned cell
    const current = unassigned[randomInt(0, unassigned.length)];

    // Assign the cell to the adjacent region with the highest growth rate
    const neighbour = current.neighbours[
      weightedRandom(current.neighbours.map(n => n.growthRate))
    ];
    result[current.i].r = neighbour.r;
    result[current.i].growthRate = neighbour.growthRate;
  }

  return {
    width: size,
    height: size,
    cells: result.map(({ r, q }) => ({ r, q })),
  };
}
