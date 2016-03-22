import * as React from 'react';
import * as _ from 'lodash';

class App extends React.Component<any, any> {
	
	game: Game;
	state: {gameState: GameState}
	
	constructor() {
		super();
		this.game = new Game(this.refreshState.bind(this));
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
	
	resetGame() {
		this.game.init(true);
		this.refreshState();
	}
	
	gameOver() {
		let gameOver = this.state.gameState.gameOver;
		if (gameOver == 'no') return true;
		return false;
	}

	render() {
		return (
			<div id="page-wrapper">
				<h1>React Roguelike</h1>
				<div id="hud-game">
					<GameOver 
						gameState={this.state.gameState}
						resetGame={() => this.resetGame()} />
					<Hud 
						gameState={this.state.gameState} />
					<GameComp
						gameState={this.state.gameState} />
				</div>
			</div>
		)
	}
}

class GameOver extends React.Component<any, any> {
	gameState: GameState;
	
	constructor(props) {
		super(props);
		this.gameState = this.props.gameState;
	}
	
	gameOver() {
		let gameOver = this.gameState.gameOver;
		if (gameOver == 'no') return true;
		return false;
	}
	
	render() {
		return (
			<div id="game-over" hidden={this.gameOver()}>
				<p>You {this.gameState.gameOver}!!</p>
				<span className='button' onClick={() => this.props.resetGame()}>Play again?</span>
			</div>
		);
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
				<p>Level: {this.gameState.playerState.level}</p>
				<p>Exp: {this.gameState.playerState.exp[0]}/{this.gameState.playerState.exp[1]}</p>
				<p>Health: {this.gameState.playerState.health[0]}/{this.gameState.playerState.health[1]}</p>
				<p>Weapon: {Weapons[this.gameState.playerState.weapon].name}</p>
				<p>Armor: {Armors[this.gameState.playerState.armor].name}</p>
				<p>Attack: {this.gameState.playerState.attack[0]}-{this.gameState.playerState.attack[1]}</p>
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
			case TileType.Boss:
				tileSprite += ' boss';
				break;
			case TileType.Health:
				tileSprite += ' health';
				break;
			case TileType.Weapon:
				tileSprite += ' weapon';
				break;
			case TileType.Armor:
				tileSprite += ' armor';
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
	
	gameState: GameState;
	
	constructor(refreshState: ()=>void) {
		this.refreshState = refreshState;
		this.init();
	}
	
	init(reset?: boolean) {
		console.log('initting!');
		let initialState: GameState = {
			playerPos: {row: 3, col: 3},
			playerState: {
				type: TileType.Player,
				health: [100, 100],
				level: 1,
				exp: [0, 100],
				weapon: 0,
				attack: [0, 2],
				armor: 0
			},
			levelMap: [],
			currentLevel: 1,
			viewPort: {topEdge: 0, leftEdge: 0},
			gameOver: 'no'
		}
		if (reset) {
			this.gameState.playerState = {
					type: TileType.Player,
					health: [100, 100],
					level: 1,
					exp: [0, 100],
					weapon: 0,
					attack: [0, 2],
					armor: 0
			};
			this.gameState.levelMap = [];
			this.gameState.currentLevel = 1;
			this.gameState.gameOver = 'no';
		} else this.gameState = initialState;
		this.generateRandomMap(this.gameState.currentLevel);
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
		let openness = 0.2 / level; // Percent of dungeon to be open space
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
			row: _.random(1, mapSize.rows-2),
			col: _.random(1, mapSize.cols-2)
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
			let randomPosition: MapCoords = this.randomPosition(mapSize);
			let randomHealth = _.random(level, level*10);
			let randomAttack = _.random(1, level*8);
			let relativeLevel = level + Math.floor(randomHealth*.25) + Math.floor(randomAttack*.333);
			let armor: number;
			if (level < Armors.length-1) {
				armor = level-1;
			} else armor = 4;
			let enemyState: TileState = {
				type: TileType.Enemy,
				health: [randomHealth, randomHealth],
				level: relativeLevel,
				attack: [level-1, randomAttack],
				armor: armor
			}
			this.gameState.levelMap[randomPosition.row][randomPosition.col] = enemyState;
			numEnemies++;
		}
		if (this.gameState.currentLevel === 7) {
			let randomPosition: MapCoords = this.randomPosition(mapSize);
			let bossState:  TileState = {
				type: TileType.Boss,
				health: [10000, 10000],
				level: 100,
				attack: [50, 100],
				armor: 4
			}
			this.gameState.levelMap[randomPosition.row][randomPosition.col] = bossState;
		}
	}
	
	generateMisc(openSpaces: number, level: number) {
		let gameState: GameState = this.gameState;
		let mapSize = {rows: gameState.levelMap.length, cols: gameState.levelMap[0].length};
		let healthFactor = level / 100;
		let desiredNumHealth = openSpaces * healthFactor;
		let numHealth = 0;
		while (numHealth < desiredNumHealth) {
			let randomPosition: MapCoords = this.randomPosition(mapSize);
			let healthState: TileState = {
				type: TileType.Health,
				health: [_.random(10, 30)]	
			};
			this.gameState.levelMap[randomPosition.row][randomPosition.col] = healthState;
			numHealth++;
		}
		if (this.gameState.playerState.weapon < Weapons.length-1 && level > 1) {
			let randomWeapon = this.randomPosition(mapSize);
			this.gameState.levelMap[randomWeapon.row][randomWeapon.col] = {type: TileType.Weapon};
		}
		if (this.gameState.playerState.armor < Armors.length-1 && level > 1) {
			let randomArmor = this.randomPosition(mapSize);
			this.gameState.levelMap[randomArmor.row][randomArmor.col] = {type: TileType.Armor};
		}
		if (this.gameState.currentLevel < 7) {
			let randomExit = this.randomPosition(mapSize);
			this.gameState.levelMap[randomExit.row][randomExit.col] = {type: TileType.Exit};
		}
	}
	
	randomPosition(mapSize: {rows: number, cols: number}): MapCoords {
		let randomPos: MapCoords;
		let validPosition = false;
		while (!validPosition) {
			randomPos = {
				row: _.random(0, mapSize.rows-1),
				col: _.random(0, mapSize.cols-1)
			};
			if (this.gameState.levelMap[randomPos.row][randomPos.col].type != TileType.Blank) continue;
			validPosition = true;
		}
		return randomPos;
	}
	
	placePlayerRandomly() {
		let gameState: GameState = this.gameState;
		let mapSize = {rows: gameState.levelMap.length, cols: gameState.levelMap[0].length};
		let randomPosition: MapCoords = this.randomPosition(mapSize);
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
			case TileType.Boss:
				this.attackEnemy(nextState, playerNextPos);
				break;
			case TileType.Health:
				this.gameState.playerState.health[0] += nextState.health[0];
				if (this.gameState.playerState.health[0] > this.gameState.playerState.health[1]) {
					this.gameState.playerState.health[0] = this.gameState.playerState.health[1];	
				} 
				this.movePlayer(playerNextPos);
				break;
			case TileType.Weapon:
				this.gameState.playerState.weapon += 1;
				this.calcAttack();
				this.movePlayer(playerNextPos);
				break;
			case TileType.Armor:
				this.gameState.playerState.armor += 1;
				this.movePlayer(playerNextPos);
				break;
			case TileType.Exit:
				this.gameState.currentLevel += 1;
				this.generateRandomMap(this.gameState.currentLevel);
				this.refreshState();
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
		enemyState.health[0] -= Math.floor(_.random(playerState.attack[0], playerState.attack[1])/Armors[enemyState.armor].defense);
		playerState.health[0] -= Math.floor(_.random(enemyState.attack[0], enemyState.attack[1])/Armors[playerState.armor].defense);
		if (playerState.health[0] <= 0)  {
			this.gameState.gameOver = 'lose';
			this.refreshState();
		}
		else if (enemyState.health[0] <= 0) {
			this.enemyDeath(enemyState);
			this.movePlayer(enemyPos);
		} else {
			this.refreshState();
		}
	}
	
	enemyDeath(enemyState: TileState) {
		let exp = enemyState.level * 10;
		this.gameState.playerState.exp[0] += exp;
		if (this.gameState.playerState.exp[0] >= this.gameState.playerState.exp[1]) this.levelUp();
		if (enemyState.type === TileType.Boss) {
			this.gameState.gameOver = 'win';
			this.refreshState();
		}
	}
	
	levelUp() {
		this.gameState.playerState.exp[1] *= 2;
		this.gameState.playerState.health[1] += 10;
		this.gameState.playerState.health[0] += 10;
		this.gameState.playerState.level += 1;
		this.calcAttack();
	}
	
	calcAttack() {
		this.gameState.playerState.attack = [
			(this.gameState.playerState.level-1) + Weapons[this.gameState.playerState.weapon].attack[0],
			this.gameState.playerState.level + Weapons[this.gameState.playerState.weapon].attack[1]
		]
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
}

const Weapons: Weapon[] = [
	{
		name: 'fists',
		attack: [0, 0]
	},
	{
		name: 'brass knuckles',
		attack: [1, 2]
	},
	{
		name: 'bat',
		attack: [3, 4]
	},
	{
		name: 'knife',
		attack: [5, 10]
	},
	{
		name: 'short sword',
		attack: [10, 20]
	},
	{
		name: 'axe',
		attack: [15, 25]
	},
	{
		name: 'katana',
		attack: [20, 30]
	},
	{
		name: "thor's hammer",
		attack: [40, 80]
	}
]

const Armors: Armor[] = [
	{
		name: 't-shirt',
		defense: 1
	},
	{
		name: 'leather jacket',
		defense: 2
	},
	{
		name: 'chainmail',
		defense: 3
	},
	{
		name: 'platemail',
		defense: 4
	},
	{
		name: 'dragonmail',
		defense: 10
	}
]

interface Weapon {
	name: string; 
	attack: number[]
}

interface Armor {
	name: string;
	defense: number
}

interface MapCoords {
	row: number;
	col: number;
}

interface GameState {
	playerPos: MapCoords;
	playerState: TileState;
	levelMap: TileState[][];
	currentLevel: number;
	viewPort: ViewPort;
	gameOver: string;
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
	health?: number[];
	level?: number;
	attack?: number[];
	weapon?: number;
	armor?: number;
	exp?: number[];
}

enum TileType {
	Blank,
	Player,
	Enemy,
	Boss,
	Health,
	Weapon,
	Armor,
	Wall,
	Exit
}

enum Direction {
	Left, Up, Right, Down
}

export default App;