// Solver for LinkedIn's Queens game
// Instructions: solve(generateBoard(BOARD, []))
// (optionally pass in an array of known queen positions as the second argument to generateBoard)
// Rules:
// - place 1 queen in each row, column, and region
// - queens cannot be adjacent to each other (including diagonals)

const HEIGHT = 8;
const WIDTH = 8;
const BOARD = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 1, 2, 0, 0, 0, 0,
  1, 1, 2, 2, 3, 4, 4, 0,
  5, 5, 2, 3, 3, 4, 0, 0,
  5, 5, 5, 5, 3, 6, 6, 0,
  5, 5, 5, 5, 5, 5, 6, 0,
  5, 5, 5, 5, 5, 5, 7, 7,
  5, 5, 5, 5, 5, 5, 5, 7,
];
// const BOARD = [
//   0, 0, 0, 0, 0, 0, 0, 0, 0,
//   1, 0, 0, 0, 0, 0, 0, 0, 0,
//   1, 0, 0, 0, 0, 0, 2, 0, 0,
//   1, 3, 3, 3, 3, 0, 2, 2, 2,
//   1, 1, 4, 3, 3, 0, 5, 5, 5,
//   6, 1, 4, 3, 3, 0, 5, 7, 7,
//   6, 1, 4, 8, 3, 0, 5, 5, 7,
//   6, 1, 4, 8, 3, 0, 5, 7, 7,
//   6, 6, 4, 8, 8, 8, 5, 5, 5,
// ];
// const BOARD = [
//   0, 1, 2, 2, 2, 3, 3, 3, 3, 3,
//   0, 1, 1, 2, 2, 3, 3, 3, 4, 4,
//   0, 1, 1, 2, 2, 5, 3, 3, 3, 4,
//   0, 0, 1, 2, 2, 5, 3, 3, 3, 4,
//   1, 0, 1, 2, 2, 5, 5, 3, 3, 4,
//   1, 1, 1, 2, 2, 6, 5, 3, 3, 4,
//   1, 1, 1, 1, 2, 6, 6, 4, 4, 4,
//   7, 2, 2, 2, 2, 9, 9, 4, 4, 4,
//   7, 2, 8, 2, 2, 9, 9, 4, 4, 9,
//   7, 7, 8, 8, 2, 9, 9, 9, 9, 9,
// ];
const COLOURS = [
  'red', 'green', 'blue', 'purple', 'orange', 'lime', 'yellow', 'navy',
  'pink', 'cyan', 'teal', 'magenta', 'maroon', 'olive', 'silver', 'gray',
];
const MAX_ITERATIONS = 100000;
const ANIMATE = false;

// Convert between positions { x: number, y: number } and indices
const pos = i => ({ x: i % WIDTH, y: Math.floor(i / WIDTH) });
const ind = ({ x, y }) => y * WIDTH + x;

// Get an array of integers in the interval [0, n)
const range = n => Array(n).fill(0).map((_, i) => i);

// Check if a position is within the bounds of the board
const positionInBounds = p => (
  p.x >= 0 && p.x < WIDTH && p.y >= 0 && p.y < HEIGHT
);

// Get a 3x3 area around a position
const area = p => range(3).flatMap(y => range(3).map(x => ({
  x: p.x + (x - 1),
  y: p.y + (y - 1),
}))).filter(positionInBounds);

// Count how many queens are in a set of cells
// type cell => { r: number (region id), q: boolean (queen) }
const countQueens = cells => cells.filter(cell => cell.q).length;

// Check if there is one queen in a set of cells
const hasOneQueen = cells => countQueens(cells) === 1;

// Get a row of cells from a board
const getRow = (board, y) => range(WIDTH).map(x => board[ind({ x, y })]);

// Get a column of cells from a board
const getColumn = (board, x) => range(HEIGHT).map(y => board[ind({ x, y })]);

// Group cells by region
// returns { [regionId: number]: cell[] }
const groupByRegion = board => board.reduce(
  (a, c) => ({ ...a, [c.r]: [...(a[c.r] ?? []), c] }),
  {}
);

// Get the indices of all queens on the board
const getQueens = board => board.reduce(
  (a, c, i) => c.q ? [...a, i] : a, []
);

// Get the cells in the area around a queen
const getQueenArea = (board, q) => area(pos(q)).map(p => board[ind(p)]);

// Clone a board state
const cloneBoard = board => [...board.map(({ r, q }) => ({ r, q }))];

// Generate an unrolled list of cells from lists of regions and queen indices
function generateBoard(regions, queens = []) {
  const queenMap = queens.reduce((a, c) => ({ ...a, [c]: true, }), {});
  return regions.map((r, i) => ({ r, q: !!queenMap[i] }));
}

// Generate a new board with a queen at the given position
function addQueenAtPosition(board, p) {
  const clone = cloneBoard(board);
  clone[ind(p)].q = true;
  return clone;
}

// Check if a board is in winning or losing state
function checkWin(board) {
  const regions = groupByRegion(board);
  return (
    // All columns populated
    range(WIDTH).every(x => hasOneQueen(getColumn(board, x))) &&

    // All rows populated
    range(HEIGHT).every(y => hasOneQueen(getRow(board, y))) &&

    // All regions populated
    Object.values(regions).every(r => hasOneQueen(r)) &&

    // No queens directly adjacent to each other (inc. diagonals)
    getQueens(board).every(q => hasOneQueen(getQueenArea(board, q)))
  );
}

// Get a list of valid queen placements as an array of positions
function getValidPlacements(board) {
  const rows = range(HEIGHT).map(y => getRow(board, y));
  const columns = range(WIDTH).map(x => getColumn(board, x));
  const regions = groupByRegion(board);
  return range(WIDTH * HEIGHT)
    .filter(i => {
      const p = pos(i);
      return (
        // No queen at this position
        !board[i].q &&

        // No queens in this row
        countQueens(rows[p.y]) === 0 &&

        // No queens in this column
        countQueens(columns[p.x]) === 0 &&

        // No queens in this region
        countQueens(regions[board[i].r]) === 0 &&

        // No queens in this adjacency region
        countQueens(getQueenArea(board, i)) === 0
      );
    })
    .map(i => pos(i));
}

// Collapse any cells that must have a queen
function collapse(board) {
  let collapsed = cloneBoard(board);
  const groupedValidPlacements = getValidPlacements(board)
    .reduce(
      (a, c) => ({
        ...a,
        [board[ind(c)].r]: [...(a[board[ind(c)].r] ?? []), c],
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
const hashState = state => state.map(({ r, q }) => `${r}_${q}`).join('|');
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
  while (++iterations <= MAX_ITERATIONS && stack.length) {
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
  console.log(`Not solvable`);
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
  const regionThisMove = board[ind(move)].r;
  score += 100 / regionSizes[regionThisMove];

  return score;
}

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

  const cellSize = { x: canvasWidth / WIDTH, y: canvasHeight / HEIGHT };

  // Regions
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      context.fillStyle = COLOURS[board[ind({ x, y })].r % COLOURS.length];
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
  for (let i = 0; i < WIDTH; i++) {
    line(
      context,
      { x: i * cellSize.x, y: 0 },
      { x: i * cellSize.x, y: canvasHeight }
    );
  }
  for (let i = 0; i < HEIGHT; i++) {
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
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    const p = pos(i);
    if (board[i].q) {
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
  render(generateBoard(BOARD));
});
