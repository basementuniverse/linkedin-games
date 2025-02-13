// Solver for LinkedIn's Queens game
// Instructions: solve(initialiseBoard(BOARD, []))
// (optionally pass in an array of known queen positions as the second argument to initialiseBoard)
// Rules:
// - place 1 queen in each row, column, and region
// - queens cannot be adjacent to each other (including diagonals)

// -----------------------------------------------------------------------------
// Sample games
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
const BOARD_4 = {
  width: 10,
  height: 10,
  cells: [
    0, 1, 1, 1, 1, 1, 2, 2, 2, 2,
    0, 0, 1, 1, 1, 1, 2, 3, 2, 2,
    0, 0, 1, 1, 1, 1, 2, 3, 2, 2,
    0, 0, 4, 4, 4, 3, 3, 3, 2, 2,
    0, 0, 5, 5, 5, 5, 6, 3, 2, 2,
    0, 0, 7, 6, 6, 6, 6, 3, 2, 2,
    0, 0, 7, 7, 7, 7, 7, 3, 2, 2,
    8, 8, 8, 8, 9, 9, 8, 8, 8, 2,
    8, 8, 9, 9, 9, 8, 8, 8, 2, 2,
    8, 8, 8, 8, 8, 8, 8, 8, 8, 8,
  ],
};
const BOARD_5 = {
  width: 9,
  height: 9,
  cells: [
    0, 0, 1, 1, 2, 3, 3, 3, 3,
    0, 0, 1, 2, 2, 2, 4, 4, 3,
    0, 0, 5, 5, 2, 5, 5, 4, 3,
    0, 5, 5, 5, 5, 5, 5, 5, 3,
    0, 5, 5, 5, 5, 5, 5, 5, 3,
    0, 0, 5, 5, 5, 5, 5, 3, 3,
    0, 0, 6, 5, 5, 5, 3, 3, 7,
    0, 6, 6, 6, 5, 8, 3, 3, 7,
    0, 0, 0, 6, 8, 8, 7, 7, 7,
  ],
};

// -----------------------------------------------------------------------------
// Constants & state
// -----------------------------------------------------------------------------

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

const COLOURS = [
  'red', 'green', 'blue', 'purple', 'orange', 'lime', 'yellow', 'lightblue',
  'pink', 'cyan', 'teal', 'magenta', 'maroon', 'olive', 'silver', 'gray',
];

const MAX_SOLVER_ITERATIONS = 100000;
const MAX_GENERATOR_ITERATIONS = 1000;

let CURRENT_BOARD = initialiseBoard(BOARD_1);
let ANIMATE = false;

// -----------------------------------------------------------------------------
// Utilities
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

// Check if there's a queen at a position
const queenAtPosition = (board, p) => board.cells[ind(p, board.width)].q;

// Check if a position is marked as invalid
const positionIsMarked = (board, p) => board.cells[ind(p, board.width)].m;

// Get a row of cells from a board
const getRow = (board, y) => range(board.width).map(
  x => board.cells[ind({ x, y }, board.width)]
);

// Get a column of cells from a board
const getColumn = (board, x) => range(board.height).map(
  y => board.cells[ind({ x, y }, board.width)]
);

// Get a list of cell indices for a given region
const getRegionIndices = (board, r) => range(board.width * board.height)
  .filter(i => board.cells[i].r === r);

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

// Helper function to sleep for a number of milliseconds
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// -----------------------------------------------------------------------------
// Game logic
// -----------------------------------------------------------------------------

// Convert a board with a flattened array of regions into a valid board with
// an array of cell objects
function initialiseBoard(board, queens = []) {
  const queenMap = queens
    .map(q => ind(q, width))
    .reduce((a, c) => ({ ...a, [c]: true, }), {});
  return {
    ...board,
    cells: board.cells.map((r, i) => ({ r, q: !!queenMap[i], m: false })),
  };
}

// Remove all queens from a board
function resetBoard(board) {
  return {
    width: board.width,
    height: board.height,
    cells: board.cells.map(cell => ({ ...cell, q: false, m: false })),
  };
}

// Clone a board state
function cloneBoard(board) {
  return {
    width: board.width,
    height: board.height,
    cells: [...board.cells.map(({ r, q, m }) => ({ r, q, m }))],
  };
}

// Clear queens and markings at a given position
function clearPosition(board, p) {
  const clone = cloneBoard(board);
  const i = ind(p, board.width);
  clone.cells[i].q = false;
  clone.cells[i].m = false;
  return clone;
}

// Generate a new board with a queen at the given position
function addQueenAtPosition(board, p) {
  const clone = cloneBoard(board);
  clone.cells[ind(p, board.width)].q = true;
  return clone;
}

// Generate a board with the specified position marked as invalid
function markInvalidPositions(board, pp) {
  const clone = cloneBoard(board);
  for (const p of pp) {
    clone.cells[ind(p, board.width)].m = true;
  }
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

// Get a list of positions where a queen cannot be placed
function getInvalidPlacements(board) {
  const invalid = [];

  // If the playable cells in a region all occupy the same row or column, then
  // the remaining cells in that row or column cannot have a queen
  const cellsByUnoccupiedRegion = Object.fromEntries(
    Object.entries(
      board.cells.reduce(
        (a, c, i) => ({
          ...a,
          [c.r]: [...(a[c.r] ?? []), { p: pos(i, board.width), ...c }],
        }),
        {}
      )
    )
      .filter(([, cells]) => !cells.some(c => c.q))
      .map(([region, cells]) => [region, cells.filter(c => !c.m)])
  );
  Object.values(cellsByUnoccupiedRegion).forEach(
    cells => {
      if (cells.every(c => c.p.x === cells[0].p.x)) {
        const valid = cells.reduce((a, c) => ({ ...a, [c.p.y]: true }), {});
        invalid.push(
          ...range(board.height)
            .map(y => ({ x: cells[0].p.x, y }))
            .filter(p => !valid[p.y])
        );
      }

      if (cells.every(c => c.p.y === cells[0].p.y)) {
        const valid = cells.reduce((a, c) => ({ ...a, [c.p.x]: true }), {});
        invalid.push(
          ...range(board.width)
            .map(x => ({ x, y: cells[0].p.y }))
            .filter(p => !valid[p.x])
        );
      }
    }
  );

  // If the playable cells in an unoccupied row or column are all of the same
  // region, then all other cells in that region (i.e. not in the row or column)
  // cannot have a queen
  range(board.height)
    .map(y => ({ row: y, cells: getRow(board, y) }))
    .filter(
      ({ cells }) => !cells.some(cell => cell.q)
    )
    .map(({ row, cells }) => ({
      row,
      regions: [...new Set(
        cells
          .filter(cell => !cell.m)
          .map(cell => cell.r)
      )],
    }))
    .filter(({ regions }) => regions.length === 1)
    .forEach(({ row, regions }) => {
      getRegionIndices(board, regions[0]).forEach(i => {
        const p = pos(i, board.width);
        if (p.y !== row) {
          invalid.push(p);
        }
      });
    });
  range(board.width)
    .map(x => ({ column: x, cells: getColumn(board, x) }))
    .filter(
      ({ cells }) => !cells.some(cell => cell.q)
    )
    .map(({ column, cells }) => ({
      column,
      regions: [...new Set(
        cells
          .filter(cell => !cell.m)
          .map(cell => cell.r)
      )],
    }))
    .filter(({ regions }) => regions.length === 1)
    .forEach(({ column, regions }) => {
      getRegionIndices(board, regions[0]).forEach(i => {
        const p = pos(i, board.width);
        if (p.x !== column) {
          invalid.push(p);
        }
      });
    });

  return invalid.filter(p => !positionIsMarked(board, p));
}

// -----------------------------------------------------------------------------
// Solver
// -----------------------------------------------------------------------------

// Collapse any cells that must have a queen
function collapse(board) {
  let changed = false;
  let collapsed = cloneBoard(board);
  const validPlacements = getValidPlacements(board);
  const validPlacementsGroupedByRow = validPlacements
    .reduce(
      (a, c) => ({
        ...a,
        [c.y]: [...(a[c.y] ?? []), c],
      }),
      {}
    );
  const validPlacementsGroupedByColumn = validPlacements
    .reduce(
      (a, c) => ({
        ...a,
        [c.x]: [...(a[c.x] ?? []), c],
      }),
      {}
    );
  const validPlacementsGroupedByRegion = validPlacements
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

  // If any row has one valid placement, then it must have a queen
  Object.values(validPlacementsGroupedByRow).forEach(row => {
    if (row.length === 1) {
      collapsed = addQueenAtPosition(collapsed, row[0]);
      changed = true;
    }
  });

  // If any column has one valid placement, then it must have a queen
  Object.values(validPlacementsGroupedByColumn).forEach(column => {
    if (column.length === 1) {
      collapsed = addQueenAtPosition(collapsed, column[0]);
      changed = true;
    }
  });

  // If any region has one valid placement, then it must have a queen
  Object.values(validPlacementsGroupedByRegion).forEach(region => {
    if (region.length === 1) {
      collapsed = addQueenAtPosition(collapsed, region[0]);
      changed = true;
    }
  });

  // Mark positions that cannot have a queen
  const invalidPlacements = getInvalidPlacements(collapsed);
  if (invalidPlacements.length) {
    collapsed = markInvalidPositions(collapsed, invalidPlacements);
    changed = true;
  }

  return changed ? collapse(collapsed) : collapsed;
}

// State cache
let seenStates = {};
const hashState = state => state.cells
  .map(({ r, q, m }) => `${r}_${q}_${m}`)
  .join('|');
const cacheState = state => { seenStates[hashState(state)] = true; }
const hasSeenState = state => !!seenStates[hashState(state)];

// Solve a game of queens
async function solve(board) {
  seenStates = {};
  const stack = [board];
  cacheState(board);

  // Iterate until the stack is empty...
  let iterations = 0;
  while (++iterations <= MAX_SOLVER_ITERATIONS && stack.length) {
    let currentVertex = stack.pop();

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

        // If the position is not marked, then add it to the stack
        if (!positionIsMarked(collapsed, adjacent.move)) {
          stack.push(collapsed);
          cacheState(collapsed);
        }
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
// Rendering
// -----------------------------------------------------------------------------

let canvas;
let context;

// Dump a board state to the console
function render(board) {
  if (!canvas || !context) {
    return;
  }

  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.textAlign = 'center';
  context.textBaseline = 'middle';

  const cellSize = {
    x: CANVAS_WIDTH / board.width,
    y: CANVAS_HEIGHT / board.height,
  };

  // Regions
  context.save();
  context.globalAlpha = 0.3;
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
  context.restore();

  // Grid
  context.strokeStyle = '#00000030';
  context.lineWidth = 2;
  for (let i = 0; i < board.width; i++) {
    line(
      context,
      { x: i * cellSize.x, y: 0 },
      { x: i * cellSize.x, y: CANVAS_HEIGHT }
    );
  }
  for (let i = 0; i < board.height; i++) {
    line(
      context,
      { x: 0, y: i * cellSize.y },
      { x: CANVAS_WIDTH, y: i * cellSize.y }
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

  // Marked cells
  context.fillStyle = '#000000aa';
  for (let i = 0; i < board.width * board.height; i++) {
    const p = pos(i, board.width);
    if (board.cells[i].m) {
      context.fillText(
        'x',
        p.x * cellSize.x + cellSize.x / 2,
        p.y * cellSize.y + cellSize.y / 2
      );
    }
  }

  // Invalid placements
  context.save();
  context.strokeStyle = 'red';
  context.setLineDash([5, 5]);

  // Check for multiple queens in a single column
  range(board.width).forEach(x => {
    if (countQueens(getColumn(board, x)) > 1) {
      context.strokeRect(x * cellSize.x, 0, cellSize.x, CANVAS_HEIGHT);
    }
  });

  // Check for multiple queens in a single row
  range(board.height).forEach(y => {
    if (countQueens(getRow(board, y)) > 1) {
      context.strokeRect(0, y * cellSize.y, CANVAS_WIDTH, cellSize.y);
    }
  });

  // Check for multiple queens in a single region
  Object.entries(groupByRegion(board)).forEach(([region, cells]) => {
    if (countQueens(cells) > 1) {
      Object.values(
        getRegionIndices(board, Number(region))
          .map(i => pos(i, board.width))
          .flatMap(p => [
            { // Top edge
              start: { x: p.x * cellSize.x, y: p.y * cellSize.y },
              end: { x: (p.x + 1) * cellSize.x, y: p.y * cellSize.y },
            },
            { // Right edge
              start: { x: (p.x + 1) * cellSize.x, y: p.y * cellSize.y },
              end: { x: (p.x + 1) * cellSize.x, y: (p.y + 1) * cellSize.y },
            },
            { // Bottom edge
              start: { x: p.x * cellSize.x, y: (p.y + 1) * cellSize.y },
              end: { x: (p.x + 1) * cellSize.x, y: (p.y + 1) * cellSize.y },
            },
            { // Left edge
              start: { x: p.x * cellSize.x, y: p.y * cellSize.y },
              end: { x: p.x * cellSize.x, y: (p.y + 1) * cellSize.y },
            },
          ])
          .reduce(
            (a, c) => (h => ({
              ...a,
              [h]: { edge: c, count: (a[h]?.count ?? 0) + 1 },
            }))(
              `${Math.floor(c.start.x)}_${Math.floor(c.start.y)}_${Math.floor(c.end.x)}_${Math.floor(c.end.y)}`
            ),
            {}
          )
      )
        .filter(({ count }) => count === 1)
        .map(({ edge }) => edge)
        .forEach(({ start, end }) => line(context, start, end));
    }
  });

  // Check for queens adjacent to each other
  getQueens(board).forEach(q => {
    if (!hasOneQueen(getQueenArea(board, q))) {
      const p = pos(q, board.width);
      context.strokeRect(
        (p.x - 1) * cellSize.x,
        (p.y - 1) * cellSize.y,
        cellSize.x * 3,
        cellSize.y * 3
      );
    }
  });
  context.restore();

  // Win state
  if (checkWin(board)) {
    context.save();
    context.fillStyle = 'white';
    context.globalAlpha = 0.3;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.font = `${Math.floor(CANVAS_HEIGHT * 0.8)}px sans-serif`;
    context.fillStyle = 'green';
    context.globalAlpha = 0.2;
    context.fillText('✔', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    context.restore();
  }
}

function line(context, a, b) {
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

// -----------------------------------------------------------------------------
// Generator
// -----------------------------------------------------------------------------

// Generate a random game
function generateGame(size) {
  let result;

  // Generate random positions, regions, and growth rates for the N queens
  // This method of using a shuffled array's values for x and indexes for y
  // guarantees that each row and column will have 1 queen, but we still need
  // to make sure no queens are directly adjacent
  let noAdjacentQueens = false;
  let shuffleIterations = 0;
  do {
    if (shuffleIterations >= MAX_GENERATOR_ITERATIONS) {
      throw new Error('Failed to generate a valid board');
    }

    result = range(size * size).map(() => ({ r: null, growthRate: 0 }));
    shuffle(range(size)).forEach((x, y) => {
      const p = { x, y };
      const i = ind(p, size);

      result[i].r = y;
      result[i].q = true;
      result[i].growthRate = Math.random();
    });

    const board = { width: size, height: size, cells: result };
    noAdjacentQueens = getQueens(board).every(
      q => hasOneQueen(getQueenArea(board, q))
    );
  } while (!noAdjacentQueens && shuffleIterations++ < MAX_GENERATOR_ITERATIONS);

  // Iterate until every cell has been assigned a region
  let solverIterations = 0;
  while (
    hasUnassignedRegions(result) &&
    solverIterations++ < MAX_GENERATOR_ITERATIONS
  ) {
    if (solverIterations >= MAX_GENERATOR_ITERATIONS) {
      throw new Error('Failed to generate a valid board');
    }

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
    cells: result.map(({ r, q }) => ({ r, q, m: false })),
  };
}

// -----------------------------------------------------------------------------
// Interaction
// -----------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.querySelector('#queens');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  context = canvas.getContext('2d');

  render(CURRENT_BOARD);

  // Mouse input
  let mouseDown = false;
  canvas.addEventListener('mousedown', e => {
    mouseDown = true;

    if (!CURRENT_BOARD) {
      return;
    }

    const p = {
      x: Math.floor(e.offsetX / (CANVAS_WIDTH / CURRENT_BOARD.width)),
      y: Math.floor(e.offsetY / (CANVAS_HEIGHT / CURRENT_BOARD.height)),
    };

    if (!positionInBounds(p, CURRENT_BOARD.width, CURRENT_BOARD.height)) {
      return;
    }

    if (queenAtPosition(CURRENT_BOARD, p)) {
      CURRENT_BOARD = clearPosition(CURRENT_BOARD, p);
    } else if (positionIsMarked(CURRENT_BOARD, p)) {
      CURRENT_BOARD = addQueenAtPosition(clearPosition(CURRENT_BOARD, p), p);
    } else {
      CURRENT_BOARD = markInvalidPositions(clearPosition(CURRENT_BOARD, p), [p]);
    }

    render(CURRENT_BOARD);
  });
  canvas.addEventListener('mouseup', () => {
    mouseDown = false;
  });
  canvas.addEventListener('mouseout', () => {
    mouseDown = false;
  });
  window.addEventListener('mouseout', () => {
    mouseDown = false;
  });
  canvas.addEventListener('mousemove', e => {
    if (!CURRENT_BOARD) {
      return;
    }

    if (mouseDown) {
      const p = {
        x: Math.floor(e.offsetX / (CANVAS_WIDTH / CURRENT_BOARD.width)),
        y: Math.floor(e.offsetY / (CANVAS_HEIGHT / CURRENT_BOARD.height)),
      };

      if (!positionInBounds(p, CURRENT_BOARD.width, CURRENT_BOARD.height)) {
        return;
      }

      if (
        !queenAtPosition(CURRENT_BOARD, p) &&
        !positionIsMarked(CURRENT_BOARD, p)
      ) {
        CURRENT_BOARD = markInvalidPositions(CURRENT_BOARD, [p]);
        render(CURRENT_BOARD);
      }
    }
  });
});

// Buttons
function handleNewGameClick(n) {
  CURRENT_BOARD = resetBoard(generateGame(n));
  render(CURRENT_BOARD);
}
function handleResetClick() {
  CURRENT_BOARD = resetBoard(CURRENT_BOARD);
  render(CURRENT_BOARD);
}
function handleSolveClick(a) {
  ANIMATE = a;
  solve(CURRENT_BOARD);
}
