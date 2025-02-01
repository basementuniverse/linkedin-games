// Solver for LinkedIn's Tango game
// Instructions: solve(BOARD)
// Rules:
// - place suns ('s') and moons ('m') in each cell
// - no more than 2 suns or moons can be horizontally or vertically adjacent
// - each row and column must contain the same number of suns and moons
// - cells separated with '=' must contain the same type
// - cells separated with 'x' must contain different types

const HEIGHT = 6;
const WIDTH = 6;
// const BOARD = [
//   null, null, null, 'm', null, null,
//   null, null, null, null, null, null,
//   null, null, null, null, null, 'm',
//   'm', null, null, null, null, null,
//   's', null, null, null, null, null,
//   'm', 's', 'm', null, null, null,
// ];
const BOARD = [
  null, null, 's', 'm', null, null,
  null, 's', null, null, null, null,
  'm', null, null, null, null, 's',
  's', null, null, null, null, 'm',
  null, null, null, null, 's', null,
  null, null, 'm', 'm', null, null,
];
// const CONSTRAINTS = [
//   {
//     type: 'equals',
//     a: { x: 4, y: 0 },
//     b: { x: 5, y: 0 },
//   },
//   {
//     type: 'opposites',
//     a: { x: 5, y: 0 },
//     b: { x: 5, y: 1 },
//   },
//   {
//     type: 'equals',
//     a: { x: 3, y: 1 },
//     b: { x: 3, y: 2 },
//   },
//   {
//     type: 'opposites',
//     a: { x: 3, y: 2 },
//     b: { x: 4, y: 2 },
//   },
//   {
//     type: 'equals',
//     a: { x: 1, y: 3 },
//     b: { x: 2, y: 3 },
//   },
//   {
//     type: 'equals',
//     a: { x: 2, y: 3 },
//     b: { x: 2, y: 4 },
//   },
// ];
const CONSTRAINTS = [
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
];
const MAX_ITERATIONS = 100000;
const ANIMATE = false;

// Convert between positions { x: number, y: number } and indices
const pos = i => ({ x: i % WIDTH, y: Math.floor(i / WIDTH) });
const ind = ({ x, y }) => y * WIDTH + x;

// Get an array of integers in the interval [0, n)
const range = n => Array(n).fill(0).map((_, i) => i);

// Remap a value i from range [a1, a2] to [b1, b2]
const remap = (i, a1, a2, b1, b2) => b1 + (i - a1) * (b2 - b1) / (a2 - a1);

// Get a row of cells from a board
const getRow = (board, y) => range(WIDTH).map(x => board[ind({ x, y })]);

// Get a column of cells from a board
const getColumn = (board, x) => range(HEIGHT).map(y => board[ind({ x, y })]);

// Count how many times a value appears in an array
const countEntries = (a, v) => a.filter(e => e === v).length;

// Count how many empty cells are in an array
const countEmpties = a => countEntries(a, null);

// Clone a board state
const cloneBoard = board => [...board];

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

// Find the longest run of a value in an array
const longestRun = a => Math.max(...rle(a).map(r => r.l));

// Check if adding a value at a position would result in an overrun
const checkRunAtPosition = (board, p, v) => {
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
};

// Check if a constraint is satisfied
const satisfied = (constraint, a, b) => {
  switch (constraint.type) {
    case 'equals':
      return a === b;
    case 'opposites':
      return a !== b;
  };
  return false;
}

// Add a sun or moon to a cell
function addValueAtPosition(board, p, v) {
  const clone = cloneBoard(board);
  clone[ind(p)] = v;
  return clone;
}

// Check if a board is in winning or losing state
function checkWin(board) {
  return (
    // All tiles populated
    !board.includes(null) &&

    // All rows have the same number of suns and moons
    range(HEIGHT).every(y => {
      const row = getRow(board, y);
      return countEntries(row, 's') === countEntries(row, 'm');
    }) &&

    // All columns have the same number of suns and moons
    range(WIDTH).every(x => {
      const column = getColumn(board, x);
      return countEntries(column, 's') === countEntries(column, 'm');
    }) &&

    // No rows have a run of 3 or more of the same type
    range(HEIGHT).every(y => longestRun(getRow(board, y)) < 3) &&

    // No columns have a run of 3 or more of the same type
    range(WIDTH).every(x => longestRun(getColumn(board, x)) < 3) &&

    // All constraints are satisfied
    CONSTRAINTS.every(c => satisfied(c, board[ind(c.a)], board[ind(c.b)]))
  );
}

// Get a list of valid moves
// returns { p: { x: number, y: number }, v: 's' | 'm' }[]
function getValidMoves(board) {
  return cartesian(range(HEIGHT * WIDTH), ['m', 's'])
    .filter(([i, v]) => {
      const p = pos(i);
      return (
        // No value already present
        !board[i] &&

        // No more than 2 suns or moons horizontally/vertically adjacent
        checkRunAtPosition(board, p, v) &&

        // Already WIDTH / 2 values of this type in this row
        countEntries(getRow(board, p.y), v) < WIDTH / 2 &&

        // Already HEIGHT / 2 values of this type in this column
        countEntries(getColumn(board, p.x), v) < HEIGHT / 2 &&

        // All constraints are satisfied
        CONSTRAINTS.every(c => {
          const aIndex = ind(c.a);
          const bIndex = ind(c.b);
          let a = board[aIndex];
          let b = board[bIndex];
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
    .map(([i, v]) => ({ p: pos(i), v }));
}

// Given a board state, recursively collapse as many cells to known values
// as possible
function collapse(board) {
  let changed = false;
  let collapsed = cloneBoard(board);
  const validMoves = getValidMoves(collapsed);

  // Collapse cells with only one possible value
  for (let i = 0; i < board.length; i++) {
    const p = pos(i);
    const cell = board[i];
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
const hashState = state => state.map(v => v || ' ').join('');
const cacheState = state => { seenStates[hashState(state)] = true; }
const hasSeenState = state => !!seenStates[hashState(state)];

// Solve a game of tango
// board => ('s' | 'm')[]
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

    if (ANIMATE) {
      render(currentVertex);
      await sleep(30);
    }
  }

  // Game is not solvable or we didn't search long enough
  console.log(`Not solvable`);
  return false;
}

// Apply a heuristic to a board state and a move
function heuristic(board, move) {
  let score = 0;//Math.random();

  // Make moves in constrained positions first
  for (const constraint of CONSTRAINTS) {
    const moveIndex = ind(move.p);
    const aIndex = ind(constraint.a);
    const bIndex = ind(constraint.b);

    if (moveIndex === aIndex || moveIndex === bIndex) {
      score += 100;

      // Extra points if the move completes a partially filled constraint
      if (board[aIndex] || board[bIndex]) {
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
            const adjacent = board[ind({ x: before, y: constraint.a.y })];
            if (adjacent && adjacent !== move.v) {
              score += 10000;
            }
          }
          const after = Math.max(constraint.a.x, constraint.b.x) + 1;
          if (after < WIDTH) {
            const adjacent = board[ind({ x: after, y: constraint.a.y })];
            if (adjacent && adjacent !== move.v) {
              score += 10000;
            }
          }
        }

        // Vertical case
        if (constraint.a.x === constraint.b.x) {
          const before = Math.min(constraint.a.y, constraint.b.y) - 1;
          if (before >= 0) {
            const adjacent = board[ind({ x: constraint.a.x, y: before })];
            if (adjacent && adjacent !== move.v) {
              score += 10000;
            }
          }
          const after = Math.max(constraint.a.y, constraint.b.y) + 1;
          if (after < HEIGHT) {
            const adjacent = board[ind({ x: constraint.a.x, y: after })];
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
  score += remap(countEmpties(row), WIDTH, 0, 0, 20);
  score += remap(countEmpties(column), 0, HEIGHT, 0, 20);

  // Bonus points if the row or column already has (MAX - 1) of this type
  // or if the row has MAX of the opposite type
  const halfWidth = Math.floor(WIDTH / 2);
  const halfHeight = Math.floor(HEIGHT / 2);
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

// Helper function to sleep for a number of milliseconds
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Render a board state
function render(board) {
  const canvasWidth = 400;
  const canvasHeight = 400;

  const canvas = document.querySelector('#tango');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext('2d');
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // Grid
  const cellSize = { x: canvasWidth / WIDTH, y: canvasHeight / HEIGHT };
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

  // Highlight cells populated in the initial state
  context.fillStyle = '#00000010';
  for (const [i, v] of BOARD.entries()) {
    if (!v) {
      continue;
    }
    const p = pos(i);
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
  for (const [i, v] of board.entries()) {
    if (!v) {
      continue;
    }
    const p = pos(i);
    context.fillText(
      { s: '🌞', m: '🌙' }[v],
      p.x * cellSize.x + cellSize.x / 2,
      p.y * cellSize.y + cellSize.y / 2
    );
  }

  // Render constraints
  for (const constraint of CONSTRAINTS) {
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
    context.fillStyle = '#000000cc';
    context.fillText(
      { equals: '=', opposites: 'x' }[constraint.type],
      p.x * cellSize.x,
      p.y * cellSize.y
    );
  }
}

function line(context, a, b) {
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
}

window.addEventListener('DOMContentLoaded', () => {
  render(BOARD);
});
