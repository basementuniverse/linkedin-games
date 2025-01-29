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
const COLOURS = [
  'red', 'green', 'blue', 'purple', 'orange', 'lime', 'yellow', 'navy'
];
const MAX_ITERATIONS = 5000;

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
function generateBoard(regions, queens) {
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

// State cache
let seenStates = {};
const hashState = state => state.map(({ r, q }) => `${r}_${q}`).join('|');
const cacheState = state => { seenStates[hashState(state)] = true; }
const hasSeenState = state => !!seenStates[hashState(state)];

// Solve a game of queens
// board => { r: number, q: boolean }[]
function solve(board) {
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
      .map(p => addQueenAtPosition(currentVertex, p))
      .filter(adjacent => !hasSeenState(adjacent))
      .forEach(adjacent => {
        stack.push(adjacent);
        cacheState(adjacent);
      });
  }

  // Game is not solvable or we didn't search long enough
  console.log(`Not solvable`);
  return false;
}

// Dump a board state to the console
function render(board) {
  console.log(
    range(HEIGHT).map(
      y => board
        .slice(WIDTH * y, WIDTH * (y + 1))
        .map(cell => `%c${cell.q ? '👑' : '  '}`)
        .join('')
    ).join('\n'),
    ...board.map(
      cell => `background-color: ${COLOURS[cell.r % COLOURS.length]}`
    )
  );
}
