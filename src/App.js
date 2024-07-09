import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const GRID_SIZE = 50;
const CELL_SIZE = 15;

function App() {
  const [grid, setGrid] = useState(() => Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0)));
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  useEffect(() => {
    initializeGrid();
  }, []);

  useEffect(() => {
    if(grid.length > 0){
      drawGrid();
    }
  }, [grid, start, end]);

  const initializeGrid = () => {
    const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
    setGrid(newGrid);
    setStart(null);
    setEnd(null);
    // Only call drawGrid after setting the grid
    requestAnimationFrame(() => drawGrid(newGrid));
  };
  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        ctx.fillStyle = grid[i][j] === 1 ? 'black' : 'white';
        ctx.fillRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(j * CELL_SIZE, i * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  
    if (start) {
      ctx.fillStyle = 'green';
      ctx.fillRect(start.x * CELL_SIZE, start.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  
    if (end) {
      ctx.fillStyle = 'red';
      ctx.fillRect(end.x * CELL_SIZE, end.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }
  };
  
  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
  
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  
    if (!start) {
      setStart({ x, y });
    } else if (!end) {
      setEnd({ x, y });
    } else {
      const newGrid = [...grid];
      newGrid[y][x] = newGrid[y][x] === 0 ? 1 : 0;
      setGrid(newGrid);
    }
  };

  const handleMouseDown = () => {
    setIsDrawing(true);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !start || !end) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    const newGrid = [...grid];
    newGrid[y][x] = 1;
    setGrid(newGrid);
  };
  const manhattanDistance = (a, b) => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  };
  const astar = () => {
    if (isRunning || !start || !end) return;
    setIsRunning(true);
  
    const openSet = [{ node: start, f: 0, g: 0, h: manhattanDistance(start, end) }];
    const closedSet = new Set();
    const parent = new Map();
    const gScore = new Map();
    gScore.set(`${start.x},${start.y}`, 0);
  
    const animate = () => {
      if (openSet.length === 0) {
        setIsRunning(false);
        return;
      }
  
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift().node;
      const key = `${current.x},${current.y}`;
  
      if (current.x === end.x && current.y === end.y) {
        reconstructPath(parent);
        setIsRunning(false);
        return;
      }
  
      closedSet.add(key);
  
      // Visualize the current cell being explored
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
      ctx.fillRect(current.x * CELL_SIZE, current.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  
      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;
  
        const tentativeGScore = (gScore.get(key) || 0) + 1;
        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
          parent.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          const h = manhattanDistance(neighbor, end);
          const f = tentativeGScore + h;
  
          const existingNode = openSet.find(item => item.node.x === neighbor.x && item.node.y === neighbor.y);
          if (existingNode) {
            existingNode.f = f;
            existingNode.g = tentativeGScore;
          } else {
            openSet.push({ node: neighbor, f, g: tentativeGScore, h });
          }
        }
      }
  
      requestAnimationFrame(animate);
    };
  
    animate();
  };
  const greedyBFS = () => {
    if (isRunning || !start || !end) return;
    setIsRunning(true);
  
    const openSet = [{ node: start, h: manhattanDistance(start, end) }];
    const closedSet = new Set();
    const parent = new Map();
  
    const animate = () => {
      if (openSet.length === 0) {
        setIsRunning(false);
        return;
      }
  
      openSet.sort((a, b) => a.h - b.h);
      const current = openSet.shift().node;
      const key = `${current.x},${current.y}`;
  
      if (current.x === end.x && current.y === end.y) {
        reconstructPath(parent);
        setIsRunning(false);
        return;
      }
  
      closedSet.add(key);
  
      // Visualize the current cell being explored
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
      ctx.fillRect(current.x * CELL_SIZE, current.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  
      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;
  
        if (!openSet.some(item => item.node.x === neighbor.x && item.node.y === neighbor.y)) {
          parent.set(neighborKey, current);
          openSet.push({ node: neighbor, h: manhattanDistance(neighbor, end) });
        }
      }
  
      requestAnimationFrame(animate);
    };
  
    animate();
  };
  const dijkstra = () => {
    if (isRunning || !start || !end) return;
    setIsRunning(true);
  
    const queue = [{ node: start, distance: 0 }];
    const visited = new Set();
    const parent = new Map();
    const distances = new Map();
    distances.set(`${start.x},${start.y}`, 0);
  
    const animate = () => {
      if (queue.length === 0) {
        setIsRunning(false);
        return;
      }
  
      queue.sort((a, b) => a.distance - b.distance);
      const { node: current, distance } = queue.shift();
      const key = `${current.x},${current.y}`;
  
      if (current.x === end.x && current.y === end.y) {
        reconstructPath(parent);
        setIsRunning(false);
        return;
      }
  
      if (visited.has(key)) {
        requestAnimationFrame(animate);
        return;
      }
  
      visited.add(key);
  
      // Visualize the current cell being explored
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
      ctx.fillRect(current.x * CELL_SIZE, current.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  
      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        const newDistance = distance + 1;
  
        if (!distances.has(neighborKey) || newDistance < distances.get(neighborKey)) {
          distances.set(neighborKey, newDistance);
          parent.set(neighborKey, current);
          queue.push({ node: neighbor, distance: newDistance });
        }
      }
  
      requestAnimationFrame(animate);
    };
  
    animate();
  };
  const bfs = () => {
    if (isRunning) return;
    setIsRunning(true);
  
    if (!start || !end) {
      setIsRunning(false);
      return;
    }
  
    const queue = [start];
    const visited = new Set();
    const parent = new Map();
  
    const animate = () => {
      if (queue.length === 0) {
        setIsRunning(false);
        return;
      }
  
      const current = queue.shift();
      const key = `${current.x},${current.y}`;
  
      if (current.x === end.x && current.y === end.y) {
        reconstructPath(parent);
        setIsRunning(false);
        return;
      }
  
      if (visited.has(key)) {
        requestAnimationFrame(animate);
        return;
      }
  
      visited.add(key);
  
      // Visualize the current cell being explored
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fillRect(current.x * CELL_SIZE, current.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  
      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
          parent.set(neighborKey, current);
        }
      }
  
      requestAnimationFrame(animate);
    };
  
    animate();
  };
  const dfs = () => {
    if (isRunning) return;
    setIsRunning(true);
  
    if (!start || !end) {
      setIsRunning(false);
      return;
    }
  
    const stack = [start];
    const visited = new Set();
    const parent = new Map();
  
    const animate = () => {
      if (stack.length === 0) {
        setIsRunning(false);
        return;
      }
  
      const current = stack.pop();
      const key = `${current.x},${current.y}`;
  
      if (current.x === end.x && current.y === end.y) {
        reconstructPath(parent);
        setIsRunning(false);
        return;
      }
  
      if (visited.has(key)) {
        requestAnimationFrame(animate);
        return;
      }
  
      visited.add(key);
  
      // Visualize the current cell being explored
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.fillRect(current.x * CELL_SIZE, current.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  
      const neighbors = getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey)) {
          stack.push(neighbor);
          parent.set(neighborKey, current);
        }
      }
  
      requestAnimationFrame(animate);
    };
  
    animate();
  };
  const generateMaze = () => {
    if (isRunning) return;
    setIsRunning(true);
  
    const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(1));
  
    const stack = [{x: 1, y: 1}];
    newGrid[1][1] = 0;
  
    const animate = () => {
      if (stack.length > 0) {
        const current = stack[stack.length - 1];
        const neighbors = [
          {x: current.x + 2, y: current.y, dir: {x: current.x + 1, y: current.y}},
          {x: current.x - 2, y: current.y, dir: {x: current.x - 1, y: current.y}},
          {x: current.x, y: current.y + 2, dir: {x: current.x, y: current.y + 1}},
          {x: current.x, y: current.y - 2, dir: {x: current.x, y: current.y - 1}}
        ].filter(n => n.x > 0 && n.x < GRID_SIZE - 1 && n.y > 0 && n.y < GRID_SIZE - 1);
  
        const unvisitedNeighbors = neighbors.filter(n => newGrid[n.y][n.x] === 1);
  
        if (unvisitedNeighbors.length > 0) {
          const chosen = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
          newGrid[chosen.y][chosen.x] = 0;
          newGrid[chosen.dir.y][chosen.dir.x] = 0;
          stack.push(chosen);
        } else {
          stack.pop();
        }
  
        setGrid([...newGrid]);
        requestAnimationFrame(animate);
      } else {
        setIsRunning(false);
        setStart(null);
        setEnd(null);
      }
    };
  
    animate();
  };
  const getNeighbors = (cell) => {
    const { x, y } = cell;
    const neighbors = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (const [dx, dy] of directions) {
      const newX = x + dx;
      const newY = y + dy;

      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE && grid[newY][newX] !== 1) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  };

  const reconstructPath = (parent) => {
    let current = end;
    const path = [];

    while (current) {
      path.unshift(current);
      const key = `${current.x},${current.y}`;
      current = parent.get(key);
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(path[0].x * CELL_SIZE + CELL_SIZE / 2, path[0].y * CELL_SIZE + CELL_SIZE / 2);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * CELL_SIZE + CELL_SIZE / 2, path[i].y * CELL_SIZE + CELL_SIZE / 2);
    }

    ctx.stroke();
  };

  return (
    <div className="App">
      <h1>Pathfinding Visualizer</h1>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      ></canvas>
      <div className="controls">
        <button onClick={bfs} disabled={isRunning}>BFS</button>
        <button onClick={dfs} disabled={isRunning}>DFS</button>
        <button onClick={astar} disabled={isRunning}>A*</button>
        <button onClick={greedyBFS} disabled={isRunning}>Greedy BFS</button>
        <button onClick={dijkstra} disabled={isRunning}>Dijkstra</button>
        <button onClick={generateMaze} disabled={isRunning}>Generate Maze</button>
        <button onClick={initializeGrid} disabled={isRunning}>Reset</button>
      </div>
    </div>
  );
}

export default App;