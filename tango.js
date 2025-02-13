// Solver for LinkedIn's Tango game
// Instructions: solve(BOARD)
// Rules:
// - place suns ('s') and moons ('m') in each cell
// - no more than 2 suns or moons can be horizontally or vertically adjacent
// - each row and column must contain the same number of suns and moons
// - cells separated with '=' must contain the same type
// - cells separated with 'x' must contain different types

// -----------------------------------------------------------------------------
// Sample games
// -----------------------------------------------------------------------------

const BOARD_1 = {
  height: 6,
  width: 6,
  cells: [
    null, null, null, 'm', null, null,
    null, null, null, null, null, null,
    null, null, null, null, null, 'm',
    'm', null, null, null, null, null,
    's', null, null, null, null, null,
    'm', 's', 'm', null, null, null,
  ],
  constraints: [
    {
      type: 'equals',
      a: { x: 4, y: 0 },
      b: { x: 5, y: 0 },
    },
    {
      type: 'opposites',
      a: { x: 5, y: 0 },
      b: { x: 5, y: 1 },
    },
    {
      type: 'equals',
      a: { x: 3, y: 1 },
      b: { x: 3, y: 2 },
    },
    {
      type: 'opposites',
      a: { x: 3, y: 2 },
      b: { x: 4, y: 2 },
    },
    {
      type: 'equals',
      a: { x: 1, y: 3 },
      b: { x: 2, y: 3 },
    },
    {
      type: 'equals',
      a: { x: 2, y: 3 },
      b: { x: 2, y: 4 },
    },
  ],
};
const BOARD_2 = {
  height: 6,
  width: 6,
  cells: [
    null, null, 's', 'm', null, null,
    null, 's', null, null, null, null,
    'm', null, null, null, null, 's',
    's', null, null, null, null, 'm',
    null, null, null, null, 's', null,
    null, null, 'm', 'm', null, null,
  ],
  constraints: [
    {
      type: 'opposites',
      a: { x: 4, y: 0 },
      b: { x: 5, y: 0 },
    },
    {
      type: 'opposites',
      a: { x: 5, y: 0 },
      b: { x: 5, y: 1 },
    },
    {
      type: 'opposites',
      a: { x: 0, y: 4 },
      b: { x: 0, y: 5 },
    },
    {
      type: 'opposites',
      a: { x: 0, y: 5 },
      b: { x: 1, y: 5 },
    },
  ],
};

// -----------------------------------------------------------------------------
// Constants & state
// -----------------------------------------------------------------------------

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;

const MAX_SOLVER_ITERATIONS = 100000;
const MAX_GENERATOR_ITERATIONS = 50;
const MAX_GENERATOR_SOLVER_ITERATIONS = 100;
const DEFAULT_GENERATOR_OPTIONS = {
  minInitialCells: 2,
  maxInitialCells: 10,
  minConstraints: 4,
  maxConstraints: 16,
  allowConstraintsOnInitialCells: true,
};

let CURRENT_BOARD = initialiseBoard(BOARD_1);
let ANIMATE = true;

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

// Remap a value i from range [a1, a2] to [b1, b2]
const remap = (i, a1, a2, b1, b2) => b1 + (i - a1) * (b2 - b1) / (a2 - a1);

// Get a row of cells from a board
const getRow = (board, y) => range(board.width).map(
  x => board.cells[ind({ x, y }, board.width)]
);

// Get a column of cells from a board
const getColumn = (board, x) => range(board.height).map(
  y => board.cells[ind({ x, y }, board.width)]
);

// Count how many times a value appears in an array
const countEntries = (a, v) => a.filter(e => e === v).length;

// Count how many empty cells are in an array
const countEmpties = a => countEntries(a, null);

// Run-length encode an array
const rle = arr => arr.reduce((a, c, i) => {
  if (i === 0 || c === null || c !== a[a.length - 1].v) {
    a.push({ v: c, l: 1 });
  } else{
    a[a.length - 1].l++;
  }
  return a;
}, []).filter(r => r.v !== null);

// Cartesian product of arrays
const cartesian = (...arr) => arr.reduce(
  (a, b) => a.flatMap(c => b.map(d => [...c, d])),
  [[]]
);

// Get the Manhattan distance between two points
const manhattanDistance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

// Find the longest run of a value in an array
const longestRun = a => Math.max(...rle(a).map(r => r.l));

// Check if a constraint is satisfied
const satisfied = (constraint, a, b) => {
  switch (constraint.type) {
    case 'equals':
      return a === b;
    case 'opposites':
      return a !== b;
  };
  return false;
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

// Initialise a board with a list of initially-populated cell indices, so that
// they can be highlighted when rendering the board
function initialiseBoard(board) {
  return {
    ...board,
    initialCells: [
      ...board.cells
        .entries()
        .filter(([, c]) => c !== null).map(([i]) => i)
    ],
  };
}

// Reset a board to its initial state
// (all cells with indices in the initialCells array should be set to null)
function resetBoard(board) {
  return {
    ...board,
    cells: board.cells.map((c, i) => board.initialCells.includes(i) ? c : null),
  };
}

// Clone a board state
function cloneBoard(board) {
  return {
    width: board.width,
    height: board.height,
    cells: [...board.cells],
    initialCells: [...board.initialCells],
    constraints: [...board.constraints.map(
      ({ type, a, b}) => ({ type, a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } })
    )],
  };
}

// Add a sun or moon to a cell
function addValueAtPosition(board, p, v) {
  const clone = cloneBoard(board);
  clone.cells[ind(p, board.width)] = v;
  return clone;
}

// Check if adding a value at a position would result in an overrun
function checkRunAtPosition(board, p, v) {
  // Horizontal case
  const row = getRow(board, p.y);
  if (longestRun(row.toSpliced(p.x, 1, v)) > 2) {
    return false;
  }

  // Vertical case
  const column = getColumn(board, p.x);
  if (longestRun(column.toSpliced(p.y, 1, v)) > 2) {
    return false;
  }

  return true;
}

// Check if a board is in winning or losing state
function checkWin(board) {
  return (
    // All tiles populated
    !board.cells.includes(null) &&

    // All rows have the same number of suns and moons
    range(board.height).every(y => {
      const row = getRow(board, y);
      return countEntries(row, 's') === countEntries(row, 'm');
    }) &&

    // All columns have the same number of suns and moons
    range(board.width).every(x => {
      const column = getColumn(board, x);
      return countEntries(column, 's') === countEntries(column, 'm');
    }) &&

    // No rows have a run of 3 or more of the same type
    range(board.height).every(y => longestRun(getRow(board, y)) < 3) &&

    // No columns have a run of 3 or more of the same type
    range(board.width).every(x => longestRun(getColumn(board, x)) < 3) &&

    // All constraints are satisfied
    board.constraints.every(c => satisfied(
      c,
      board.cells[ind(c.a, board.width)],
      board.cells[ind(c.b, board.width)]
    ))
  );
}

// Check if a move is valid
function isValidMove(board, p, v) {
  return (
    // No value already present
    !board.cells[ind(p, board.width)] &&

    // No more than 2 suns or moons horizontally/vertically adjacent
    checkRunAtPosition(board, p, v) &&

    // Already width / 2 values of this type in this row
    countEntries(getRow(board, p.y), v) < board.width / 2 &&

    // Already height / 2 values of this type in this column
    countEntries(getColumn(board, p.x), v) < board.height / 2 &&

    // All constraints are satisfied
    board.constraints.every(c => {
      const a = board.cells[ind(c.a, board.width)];
      const b = board.cells[ind(c.b, board.width)];
      return !a || !b || satisfied(c, a, b);
    })
  );
}

// Get a list of valid moves
// returns { p: { x: number, y: number }, v: 's' | 'm' }[]
function getValidMoves(board) {
  return cartesian(range(board.height * board.width), ['m', 's'])
    .filter(([i, v]) => {
      const p = pos(i, board.width);
      return (
        // No value already present
        !board.cells[i] &&

        // No more than 2 suns or moons horizontally/vertically adjacent
        checkRunAtPosition(board, p, v) &&

        // Already width / 2 values of this type in this row
        countEntries(getRow(board, p.y), v) < board.width / 2 &&

        // Already height / 2 values of this type in this column
        countEntries(getColumn(board, p.x), v) < board.height / 2 &&

        // All constraints are satisfied
        board.constraints.every(c => {
          const aIndex = ind(c.a, board.width);
          const bIndex = ind(c.b, board.width);
          let a = board.cells[aIndex];
          let b = board.cells[bIndex];
          if (a === null && i === aIndex) {
            a = v;
          }
          if (b === null && i === bIndex) {
            b = v;
          }
          return !a || !b || satisfied(c, a, b);
        })
      );
    })
    .map(([i, v]) => ({ p: pos(i, board.width), v }));
}

// -----------------------------------------------------------------------------
// Solver
// -----------------------------------------------------------------------------

// Given a board state, recursively collapse as many cells to known values
// as possible
function collapse(board) {
  let changed = false;
  let collapsed = cloneBoard(board);
  const validMoves = getValidMoves(collapsed);

  // Collapse cells with only one possible value
  for (let i = 0; i < board.cells.length; i++) {
    const p = pos(i, board.width);
    const cell = board.cells[i];
    if (cell) {
      continue;
    }

    const validMovesThisPosition = validMoves.filter(
      m => m.p.x === p.x && m.p.y === p.y
    );
    if (validMovesThisPosition.length === 1) {
      collapsed = addValueAtPosition(collapsed, p, validMovesThisPosition[0].v);
      changed = true;
    }
  }

  return changed ? collapse(collapsed) : collapsed;
}

// State cache
let seenStates = {};
const hashState = state => state.cells.map(v => v || ' ').join('');
const cacheState = state => { seenStates[hashState(state)] = true; }
const hasSeenState = state => !!seenStates[hashState(state)];

// Solve a game of tango
async function solve(
  board,
  maxIterations = MAX_SOLVER_ITERATIONS,
  output = true
) {
  seenStates = {};
  const stack = [board];
  cacheState(board);

  // Iterate until the stack is empty...
  let iterations = 0;
  while (++iterations <= maxIterations && stack.length) {
    const currentVertex = stack.pop();

    // If this is a winning state, then we're done
    if (checkWin(currentVertex)) {
      if (output) {
        console.log(`Solved in ${iterations} iterations`);
        render(currentVertex);
        return true;
      }

      return currentVertex;
    }

    // Cache adjacent vertices and push them onto the stack
    let adjacentVertices = getValidMoves(currentVertex)
      .map(move => (
        ((move, state) => ({
          move,
          state,
          h: heuristic(state, move)
        }))(
          move,
          addValueAtPosition(currentVertex, move.p, move.v)
        )
      ));

    // Filter adjacent vertices
    adjacentVertices = adjacentVertices.filter(adjacent => {
      // Ignore states that we've already seen
      if (hasSeenState(adjacent.state)) {
        return false;
      }

      return true;
    });

    // Sort by heuristic to search more promising branches first
    adjacentVertices.sort((a, b) => a.h - b.h);

    // Cache adjacent vertices and push them onto the stack
    adjacentVertices.forEach(adjacent => {
      stack.push(collapse(adjacent.state));
      cacheState(adjacent.state);
    });

    if (output && ANIMATE) {
      render(currentVertex);
      await sleep(30);
    }
  }

  // Game is not solvable or we didn't search long enough
  if (output) {
    console.log(`Failed to solve`);
  }
  return false;
}

// Apply a heuristic to a board state and a move
function heuristic(board, move) {
  let score = 0;

  // Make moves in constrained positions first
  for (const constraint of board.constraints) {
    const moveIndex = ind(move.p, board.width);
    const aIndex = ind(constraint.a, board.width);
    const bIndex = ind(constraint.b, board.width);

    if (moveIndex === aIndex || moveIndex === bIndex) {
      score += 100;

      // Extra points if the move completes a partially filled constraint
      if (board.cells[aIndex] || board.cells[bIndex]) {
        score += 10000;
      }

      // Extra *extra* points if we have an equality constraint colinear to and
      // adjacent to a populated cell (in which case we know the value of the
      // constrained cells must be different to the populated cell, otherwise
      // we would have a run of 3+)
      if (constraint.type === 'equals') {
        // Horizontal case
        if (constraint.a.y === constraint.b.y) {
          const before = Math.min(constraint.a.x, constraint.b.x) - 1;
          if (before >= 0) {
            const adjacent = board.cells[
              ind({ x: before, y: constraint.a.y }, board.width)
            ];
            if (adjacent && adjacent !== move.v) {
              score += 10000;
            }
          }
          const after = Math.max(constraint.a.x, constraint.b.x) + 1;
          if (after < board.width) {
            const adjacent = board.cells[
              ind({ x: after, y: constraint.a.y }, board.width)
            ];
            if (adjacent && adjacent !== move.v) {
              score += 10000;
            }
          }
        }

        // Vertical case
        if (constraint.a.x === constraint.b.x) {
          const before = Math.min(constraint.a.y, constraint.b.y) - 1;
          if (before >= 0) {
            const adjacent = board.cells[
              ind({ x: constraint.a.x, y: before }, board.width)
            ];
            if (adjacent && adjacent !== move.v) {
              score += 10000;
            }
          }
          const after = Math.max(constraint.a.y, constraint.b.y) + 1;
          if (after < board.height) {
            const adjacent = board.cells[
              ind({ x: constraint.a.x, y: after }, board.width)
            ];
            if (adjacent && adjacent !== move.v) {
              score += 10000;
            }
          }
        }
      }
    }
  }

  // Try to fill rows and columns
  // Almost-filled rows and columns are more valuable
  const row = getRow(board, move.p.y);
  const column = getColumn(board, move.p.x);
  score += remap(countEmpties(row), board.width, 0, 0, 20);
  score += remap(countEmpties(column), 0, board.height, 0, 20);

  // Bonus points if the row or column already has (MAX - 1) of this type
  // or if the row has MAX of the opposite type
  const halfWidth = Math.floor(board.width / 2);
  const halfHeight = Math.floor(board.height / 2);
  if (countEntries(row, move.v) === halfWidth - 1) {
    score += 500;
  }
  if (countEntries(column, move.v) === halfHeight - 1) {
    score += 500;
  }
  if (countEntries(row, { s: 'm', m: 's' }[move.v]) === halfWidth) {
    score += 500;
  }
  if (countEntries(column, { s: 'm', m: 's' }[move.v]) === halfHeight) {
    score += 500;
  }

  return score;
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

let canvas;
let context;

// Render a board state
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

  // Grid
  context.strokeStyle = '#00000030';
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

  // Highlight cells populated in the initial state
  context.fillStyle = '#00000010';
  for (const i of board.initialCells ?? []) {
    const p = pos(i, board.width);
    context.fillRect(
      p.x * cellSize.x,
      p.y * cellSize.y,
      cellSize.x,
      cellSize.y
    );
  }

  // Render suns and moons
  context.fillStyle = '#000000';
  context.font = `${
    Math.floor(Math.min(cellSize.x, cellSize.y) / 2)
  }px sans-serif`;
  for (const [i, v] of board.cells.entries()) {
    if (!v) {
      continue;
    }
    const p = pos(i, board.width);
    context.fillText(
      { s: '🌞', m: '🌙' }[v],
      p.x * cellSize.x + cellSize.x / 2,
      p.y * cellSize.y + cellSize.y / 2
    );
  }

  // Render constraints
  for (const constraint of board.constraints) {
    const p = {
      x: constraint.a.x + 0.5 + 0.5 * (constraint.b.x - constraint.a.x),
      y: constraint.a.y + 0.5 + 0.5 * (constraint.b.y - constraint.a.y),
    };
    context.fillStyle = '#ffffff';
    context.fillRect(
      p.x * cellSize.x - cellSize.x / 4,
      p.y * cellSize.y - cellSize.y / 4,
      cellSize.x / 2,
      cellSize.y / 2
    );

    // Highlight the constraint if it's populated but not satisfied
    const a = board.cells[ind(constraint.a, board.width)];
    const b = board.cells[ind(constraint.b, board.width)];
    if (
      a !== null &&
      b !== null &&
      !satisfied(constraint, a, b)
    ) {
      context.fillStyle = '#ff0000cc';
    } else {
      context.fillStyle = '#000000cc';
    }
    context.fillText(
      { equals: '=', opposites: 'x' }[constraint.type],
      p.x * cellSize.x,
      p.y * cellSize.y
    );
  }

  // Invalid placements
  context.save();
  context.strokeStyle = 'red';
  context.setLineDash([5, 5]);

  // Check columns
  range(board.width).forEach(x => {
    const column = getColumn(board, x);
    let invalid = false;

    // Runs of 3 or more of the same value
    if (longestRun(column) > 2) {
      invalid = true;
    }

    // Unequal balance in filled columns
    if (
      column.every(v => v !== null) &&
      countEntries(column, 's') !== countEntries(column, 'm')
    ) {
      invalid = true;
    }

    if (invalid) {
      context.strokeRect(x * cellSize.x, 0, cellSize.x, CANVAS_HEIGHT);
    }
  });

  // Check for runs of 3 or more in rows
  range(board.height).forEach(y => {
    const row = getRow(board, y);
    let invalid = false;

    // Runs of 3 or more of the same value
    if (longestRun(row) > 2) {
      invalid = true;
    }

    // Unequal balance in filled rows
    if (
      row.every(v => v !== null) &&
      countEntries(row, 's') !== countEntries(row, 'm')
    ) {
      invalid = true;
    }

    if (invalid) {
      context.strokeRect(0, y * cellSize.y, CANVAS_WIDTH, cellSize.y);
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
async function generateGame(size, options) {
  let result;
  const actualOptions = { ...DEFAULT_GENERATOR_OPTIONS, ...options };

  // Disable animation
  let originalAnimate = ANIMATE;
  ANIMATE = false;

  // Check that the board size is even
  if (size % 2 !== 0) {
    throw new Error('Size must be even');
  }

  let iterations = 0;
  let solvable = false;
  do {
    if (iterations >= MAX_GENERATOR_ITERATIONS) {
      throw new Error('Failed to generate a valid board');
    }

    // Initialise an empty board
    result = {
      width: size,
      height: size,
      cells: Array(size * size).fill(null),
      initialCells: [],
      constraints: [],
    };

    // Randomly populate some cells
    let remainingCellsToPopulate = randomInt(
      actualOptions.minInitialCells,
      actualOptions.maxInitialCells
    );
    const shuffledCells = shuffle(range(size * size));
    while (remainingCellsToPopulate > 0 && shuffledCells.length) {
      const i = shuffledCells.pop();
      const p = pos(i, size);
      const v = shuffle(['s', 'm']).pop();

      if (isValidMove(result, p, v)) {
        result = addValueAtPosition(result, p, v);
        remainingCellsToPopulate--;
      }
    }

    result = initialiseBoard(result);
    result = await solve(result, MAX_GENERATOR_SOLVER_ITERATIONS, false);
    solvable = !!result;
  } while (iterations++ < MAX_GENERATOR_ITERATIONS && !solvable);
  ANIMATE = originalAnimate;

  // Randomly add constraints
  shuffle(
    cartesian(range(size), range(size), range(size), range(size))
      .map(([x1, y1, x2, y2]) => ({ a: { x: x1, y: y1 }, b: { x: x2, y: y2 } }))
      .filter(({ a, b }) => manhattanDistance(a, b) === 1)
      .filter(({ a, b }) => (
        actualOptions.allowConstraintsOnInitialCells
          ? (
            !result.initialCells.includes(ind(a, size)) ||
            !result.initialCells.includes(ind(b, size))
          )
          : (
            !result.initialCells.includes(ind(a, size)) &&
            !result.initialCells.includes(ind(b, size))
          )
      ))
  ).slice(
    0,
    randomInt(actualOptions.minConstraints, actualOptions.maxConstraints)
  ).forEach(({ a, b }) => {
    const currentA = result.cells[ind(a, size)];
    const currentB = result.cells[ind(b, size)];
    result.constraints.push({
      type: currentA === currentB ? 'equals' : 'opposites',
      a,
      b,
    });
  });

  // Reset the board, leaving initial cells and constraints intact
  return resetBoard(result);
}

// -----------------------------------------------------------------------------
// Interaction
// -----------------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.querySelector('#tango');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  context = canvas.getContext('2d');

  render(CURRENT_BOARD);

  // Mouse input
  canvas.addEventListener('click', e => {
    if (!CURRENT_BOARD) {
      return;
    }

    const p = {
      x: Math.floor(e.offsetX / (CANVAS_WIDTH / CURRENT_BOARD.width)),
      y: Math.floor(e.offsetY / (CANVAS_HEIGHT / CURRENT_BOARD.height)),
    };
    const i = ind(p, CURRENT_BOARD.width);

    if (!positionInBounds(p, CURRENT_BOARD.width, CURRENT_BOARD.height)) {
      return;
    }

    if (CURRENT_BOARD.initialCells.includes(i)) {
      return;
    }

    const v = CURRENT_BOARD.cells[ind(p, CURRENT_BOARD.width)];
    switch (v) {
      case null:
        CURRENT_BOARD = addValueAtPosition(CURRENT_BOARD, p, 's');
        break;

      case 's':
        CURRENT_BOARD = addValueAtPosition(CURRENT_BOARD, p, 'm');
        break;

      case 'm':
        CURRENT_BOARD = addValueAtPosition(CURRENT_BOARD, p, null);
        break;
    }

    render(CURRENT_BOARD);
  });
});


// Buttons
function handleNewGameClick(n) {
  const game = generateGame(n).then(game => {
    CURRENT_BOARD = resetBoard(game);
    render(CURRENT_BOARD);
  });
}
function handleResetClick() {
  CURRENT_BOARD = resetBoard(CURRENT_BOARD);
  render(CURRENT_BOARD);
}
function handleSolveClick(a) {
  ANIMATE = a;
  solve(CURRENT_BOARD);
}
