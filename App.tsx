import * as React from 'react';
import * as _ from 'lodash';

class App extends React.Component<any, any> {
	
	game: Game;
	state: {gameState: GameState}
	
	constructor() {
		super();
		this.game = new Game(this.refreshState.bind(this), 1);
		this.state = {
			gameState: this.game.gameState
		}
	}
	
	componentDidMount() {
		document.body.onkeydown = this.handleKeyDown.bind(this);
	}
	
	componentWillUnmount() {
		document.body.onkeydown = null;
	}
	
	refreshState() {
		this.setState({gameState: this.state.gameState});
	}
	
	handleKeyDown(e: KeyboardEvent) {
		let key = e.keyCode;
		switch (key) {
			case 37:
				this.game.checkDirection('left');
				break;
			case 38:
				this.game.checkDirection('up');
				break;
			case 39:
				this.game.checkDirection('right');
				break;
			case 40:
				this.game.checkDirection('down');
				break;
			default:
				break;
		}
	}

	render() {
		return (
			<div id="page-wrapper">
				<h1>React Roguelike</h1>
				<Hud 
					gameState={this.state.gameState} />
				<GameComp
					gameState={this.state.gameState} />
			</div>
		)
	}
}

class Hud extends React.Component<any, any> {
	gameState: GameState;
	
	constructor(props) {
		super(props);
		this.gameState = this.props.gameState;
	}
	
	render() {
		return (
			<div id="hud">
				Health: {this.gameState.playerState.health}
			</div>
		);
	}
}

class GameComp extends React.Component<any, any> {
	gameState: GameState;
	
	blocksWidth = 21;
	blocksHeight = 15;
	
	constructor(props) {
		super(props);
		this.gameState = this.props.gameState;
	}
	
	getCameraOffset() {
		let camOffset = this.gameState.cameraOffset;
		return {
			left: camOffset.left + 'px',
			top: camOffset.top + 'px'
		}
	}
	
	generateTile(tileCoords: MapCoords) {
		let tileSprite = 'tile';
		let tileState = this.gameState.levelMap[tileCoords.row][tileCoords.col];
		switch (tileState.type) {
			case TileType.Player:
				tileSprite += ' player';
				break;
			case TileType.Blank:
				tileSprite += ' blank';
				break;
			case TileType.Wall: 
				tileSprite += ' wall';
				break;
			case TileType.Enemy:
				tileSprite += ' enemy';
				break;
			case TileType.Health:
				tileSprite += ' health';
				break;
			case TileType.Weapon:
				tileSprite += ' weapon';
				break;
			case TileType.Exit:
				tileSprite += ' exit';
				break;
			default:
				break;
		}
		
		return <div className={tileSprite} key={tileCoords.col} />
	}
	
	generateMap(level: number) {
		let map = [];
		let topEdge = this.gameState.viewPort.topEdge;
		let leftEdge = this.gameState.viewPort.leftEdge;
		for (let row = topEdge; row < (topEdge + this.blocksHeight); row++) {
			let genRow = [];
			for (let col = leftEdge; col < (leftEdge + this.blocksWidth); col++) {
				genRow.push(this.generateTile({row: row,  col: col}));
			}
			map.push(<div key={row}>{genRow}</div>)
		}
		return <div id="map">{map}</div>;
	}
	
	render() {
		return (
			<div id="game-screen">
				{this.generateMap(1)}
			</div>
		);
	}
}

class Tile extends React.Component<any, any> {
	render() {
		return (
			<div>
			</div>
		);
	}
}

class Game {
	
	refreshState: () => void;
	
	camOffsetHorizBlocks = 10;
	camOffsetVertBlocks = 7;
	blockSizePx = 32;
	
	leftLimit = this.camOffsetHorizBlocks;
	rightLimit: number;
	bottomLimit: number;
	topLimit = this.camOffsetVertBlocks;
	
	blocksWidth = 21;
	blocksHeight = 15;
	
	gameState: GameState = {
		playerPos: {row: 3, col: 3},
		playerState: {
			type: TileType.Player,
			health: 100,
			attack: [0, 2],
			weapon: 'fists'
		},
		cameraOffset: {
			top: -(this.camOffsetVertBlocks*this.blockSizePx), 
			left: -(this.camOffsetHorizBlocks*this.blockSizePx)
		},
		levelMap: [],
		viewPort: {topEdge: 0, leftEdge: 0}
	}
	
	constructor(refreshState: ()=>void, level: number) {
		this.refreshState = refreshState;
		this.generateRandomMap(3);
	}
	
	// Drunken Walk Generation Algorithm
	generateRandomMap(level: number) {
		/*	Level is a 2d array, selection is map[rowNum][colNum]
			Each tile is an object specifying contents and state
			[
				[{contents: player}, {contents: blank}, ...],	<-- row 0
				[{contents: enemy}, {contents: weapon}, ...],	<-- row 1
				...
			]
		*/
		let width = level * 25;
		let mapSize = {rows: width, cols: width};
		let openness = 0.2; // Percent of dungeon to be open space
		let desiredOpenSpaces = Math.floor( (mapSize.rows * mapSize.cols) * openness );
		let map: TileState[][] = [];
		
		// Generate a full map of walls of desired size.
		for (let row = 0; row < mapSize.rows; row++) {
			let nextRow = [];
			for (let col = 0; col < mapSize.cols; col++) {
				let tile: TileState = {type: TileType.Wall};
				nextRow.push(tile);
			}
			map.push(nextRow);
		}
		
		let curPosition: MapCoords = {
			row: _.random(0, mapSize.rows-1),
			col: _.random(0, mapSize.cols-1)
		};
		this.gameState.playerPos = {row: curPosition.row, col: curPosition.col};
		
		let numOpenSpaces = 1;
		while (numOpenSpaces < desiredOpenSpaces) {
			let randomStep = _.random(0, 3);
			let nextPosition: MapCoords;
			let alreadyVisited = false;
			switch (randomStep) {
				case Direction.Left:
					nextPosition = {row: curPosition.row, col: curPosition.col - 1};
					if (nextPosition.col < 1) continue;
					alreadyVisited = map[nextPosition.row][nextPosition.col].type === TileType.Blank;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					if (!alreadyVisited) numOpenSpaces++;
					break;
				case Direction.Up:
					nextPosition = {row: curPosition.row - 1, col: curPosition.col};
					if (nextPosition.row < 1) continue;
					alreadyVisited = map[nextPosition.row][nextPosition.col].type === TileType.Blank;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					if (!alreadyVisited) numOpenSpaces++;
					break;
				case Direction.Right:
					nextPosition = {row: curPosition.row, col: curPosition.col + 1};
					if (nextPosition.col > mapSize.cols - 2) continue;
					alreadyVisited = map[nextPosition.row][nextPosition.col].type === TileType.Blank;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					if (!alreadyVisited) numOpenSpaces++;
					break;
				case Direction.Down:
					nextPosition = {row: curPosition.row + 1, col: curPosition.col};
					if (nextPosition.row > mapSize.rows - 2) continue;
					alreadyVisited = map[nextPosition.row][nextPosition.col].type === TileType.Blank;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					if (!alreadyVisited) numOpenSpaces++;
					break;
				default:
					break;
			}
		}
		this.gameState.levelMap = map;
		this.rightLimit = this.gameState.levelMap[0].length - 1 - this.camOffsetHorizBlocks;
		this.bottomLimit = this.gameState.levelMap.length - 1 - this.camOffsetVertBlocks;
		this.generateEnemies(numOpenSpaces, level);
		this.generateMisc(numOpenSpaces, level);
		this.placePlayerRandomly();
	}
	
	generateEnemies(openSpaces: number, level: number) {
		let gameState: GameState = this.gameState;
		let mapSize = {rows: gameState.levelMap.length, cols: gameState.levelMap[0].length};
		let enemyFactor = level / 50;
		let desiredNumEnemies = openSpaces * enemyFactor;
		let numEnemies = 0;
		while (numEnemies < desiredNumEnemies) {
			let randomPosition: MapCoords;
			let validPosition = false;
			while (!validPosition) {
				randomPosition = {
					row: _.random(0, mapSize.rows-1),
					col: _.random(0, mapSize.cols-1)
				};
				if (gameState.levelMap[randomPosition.row][randomPosition.col].type != TileType.Blank) continue;
				validPosition = true;
			}
			let enemyState: TileState = {
				type: TileType.Enemy,
				health: _.random(level, level*3),
				attack: [0, _.random(level*2)]
			}
			this.gameState.levelMap[randomPosition.row][randomPosition.col] = enemyState;
			numEnemies++;
		}
	}
	
	generateMisc(openSpaces: number, level: number) {
		let gameState: GameState = this.gameState;
		let mapSize = {rows: gameState.levelMap.length, cols: gameState.levelMap[0].length};
		let healthFactor = level / 100;
		let desiredNumHealth = openSpaces * healthFactor;
		let numHealth = 0;
		while (numHealth < desiredNumHealth) {
			let randomPosition: MapCoords;
			let validPosition = false;
			while (!validPosition) {
				randomPosition = {
					row: _.random(0, mapSize.rows-1),
					col: _.random(0, mapSize.cols-1)
				};
				if (gameState.levelMap[randomPosition.row][randomPosition.col].type != TileType.Blank) continue;
				validPosition = true;
			}
			let healthState: TileState = {
				type: TileType.Health,
				health: _.random(10, 30)	
			};
			this.gameState.levelMap[randomPosition.row][randomPosition.col] = healthState;
			numHealth++;
		}
	}
	
	placePlayerRandomly() {
		let gameState: GameState = this.gameState;
		let mapSize = {rows: gameState.levelMap.length, cols: gameState.levelMap[0].length};
		let randomPosition: MapCoords;
		let validPosition = false;
		while (!validPosition) {
			randomPosition = {
				row: _.random(0, mapSize.rows-1),
				col: _.random(0, mapSize.cols-1)
			};
			if (gameState.levelMap[randomPosition.row][randomPosition.col].type != TileType.Blank) continue;
			validPosition = true;
		}
		this.gameState.playerPos = randomPosition;
		this.gameState.levelMap[randomPosition.row][randomPosition.col] = {type: TileType.Player};
		this.adjustViewport(randomPosition);
	}
	
	checkDirection(direction: string) {
		let playerNextPos: MapCoords;
		// Middle = 9 left/right, 6 up/down
		switch (direction) {
			case 'left':
				playerNextPos = {row: this.gameState.playerPos.row, col: this.gameState.playerPos.col - 1};
				break;
			case 'up':
				playerNextPos = {row: this.gameState.playerPos.row - 1, col: this.gameState.playerPos.col};
				break;
			case 'right':
				playerNextPos = {row: this.gameState.playerPos.row, col: this.gameState.playerPos.col + 1};
				break;
			case 'down':
				playerNextPos = {row: this.gameState.playerPos.row + 1, col: this.gameState.playerPos.col};
				break;
			default:
				break;
		}
		let nextState = this.gameState.levelMap[playerNextPos.row][playerNextPos.col];
		switch (nextState.type) {
			case TileType.Blank:
				this.movePlayer(playerNextPos);
				break;
			case TileType.Enemy:
				this.attackEnemy(nextState, playerNextPos);
				break;
			case TileType.Health:
				this.gameState.playerState.health += nextState.health;
				if (this.gameState.playerState.health > 100) this.gameState.playerState.health = 100;
				this.movePlayer(playerNextPos);
				break;
			case TileType.Weapon:
				
				break;
			case TileType.Enemy:
				
				break;
			default:
				break;
		}
	}
	
	movePlayer(nextState: MapCoords) {
		let curState = this.gameState.playerPos;
		this.gameState.levelMap[curState.row][curState.col] = {type: TileType.Blank};
		this.gameState.playerPos = nextState;
		this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = {type: TileType.Player};
		this.adjustViewport(nextState);
		this.refreshState();
	}
	
	attackEnemy(enemyState: TileState, enemyPos: MapCoords) {
		let playerState = this.gameState.playerState;
		let playerPos = this.gameState.playerPos;
		enemyState.health -= _.random(playerState.attack[0], playerState.attack[1]);
		playerState.health -= _.random(enemyState.attack[0], enemyState.attack[1]);
		if (playerState.health <= 0) this.gameOver();
		else if (enemyState.health <= 0) {
			this.enemyDeath(enemyState);
			this.movePlayer(enemyPos);
		} else {
			this.refreshState();
		}
	}
	
	enemyDeath(enemyState: TileState) {
		
	}
	
	adjustViewport(playerState: MapCoords) {
		let viewPort: ViewPort = {topEdge: 0, leftEdge: 0};
		if (playerState.col > this.leftLimit) {
			if (playerState.col < this.rightLimit) {
				viewPort.leftEdge += playerState.col - this.leftLimit;
			} else {
				viewPort.leftEdge += (playerState.col - this.leftLimit)
					- (playerState.col - this.rightLimit);
			}
		} 
		if (playerState.row > this.topLimit) {
			if (playerState.row < this.bottomLimit) {
				viewPort.topEdge += playerState.row - this.topLimit;
			} else {
				viewPort.topEdge += (playerState.row - this.topLimit) 
					- (playerState.row - this.bottomLimit);
			}
		}
		this.gameState.viewPort = viewPort;
	}
	
	gameOver() {
		
	}
}

interface MapCoords {
	row: number;
	col: number;
}

interface GameState {
	playerPos: MapCoords;
	playerState: TileState;
	cameraOffset: CameraOffset;
	levelMap: TileState[][];
	viewPort: ViewPort;
}

interface CameraOffset {
	top: number;
	left: number;
}

interface ViewPort {
	topEdge: number;
	leftEdge: number;
}

interface TileState {
	type: TileType;
	health?: number;
	attack?: number[];
	weapon?: string;
}

enum TileType {
	Blank,
	Player,
	Enemy,
	Health,
	Weapon,
	Wall,
	Exit
}

enum Direction {
	Left, Up, Right, Down
}

export default App;