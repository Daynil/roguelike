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
	
	displayLevel() {
		let level = this.state.gameState.currentLevel;
		return level < 7 ? level : 'Final';
	}

	render() {
		return (
			<div id="page-wrapper">
				<h1>React Roguelike</h1><Foot />
				<p>Dungeon Level: {this.displayLevel()}</p>
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
		let healthPercent = this.gameState.playerState.health[0] / this.gameState.playerState.health[1];
		let color = healthPercent < 0.25 ? {color: '#ff0000'} : {color: '#ffffff'};
		return (
			<div id="hud">
				<p>Level: {this.gameState.playerState.level}</p>
				<p>Exp: {this.gameState.playerState.exp[0]}/{this.gameState.playerState.exp[1]}</p>
				<p style={color}>Health: {this.gameState.playerState.health[0]}/{this.gameState.playerState.health[1]}</p>
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
	
	produceEnemy(coords: MapCoords, visibility, boss?) {
		let enemyType = boss ? 'tile boss' : 'tile enemy';
		let enemyState: TileState = this.gameState.levelMap[coords.row][coords.col];
		let fullWidth = 32;
		let fractionHealth = enemyState.health[0] / enemyState.health[1] * fullWidth;
		let healthLeft = {width: fractionHealth + 'px'};
		let isFull = fractionHealth === 32;
		return (
			<div className={'tile'} key={coords.col} style={visibility}>
				<div className={'tile'} style={{position: 'absolute'}} />
				<div className={enemyType}>
					<div className="health-bar" hidden={isFull}>
						<div 
							className="remaining" 
							style={healthLeft}></div>
					</div>	
				</div>
			</div>
		)
	}
	
	generateTile(tileCoords: MapCoords) {
		let tileSprite = 'tile';
		let tileState = this.gameState.levelMap[tileCoords.row][tileCoords.col];
		let alpha = tileState.explored ? '0' : '1';
		let visible = tileState.explored ? 'visible' : "hidden !important";
		let visibility = {
			//backgroundColor: `hsla(0, 100%, 0%, ${alpha})`,
			visibility: visible
		}
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
				return this.produceEnemy(tileCoords, visibility);
			case TileType.Boss:
				return this.produceEnemy(tileCoords, visibility, true);
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
		
		//return <div className={tileSprite} key={tileCoords.col} />
		return (
			<div className={'tile'} key={tileCoords.col} style={visibility}>
				<div className={'tile'} style={{position: 'absolute'}} />
				<div className={tileSprite} />
			</div>
		)
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

class Foot extends React.Component<any, any> {
	render() {
		return (
			<div id="foot">
				<a id="gh-link" href="https://github.com/Daynil/roguelike">
					<i className="fa fa-github-square fa-lg"></i>
				</a>
				<div id="foot-text">
					By <a href="https://github.com/Daynil/">Daynil</a> for <a href="http://www.freecodecamp.com/">FCC</a>
				</div>
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
				explored: true,
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
					explored: true,
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
				let tile: TileState = {type: TileType.Wall, explored: false};
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
					map[curPosition.row][curPosition.col] = this.makeTile(TileType.Blank, nextPosition, true);
					if (!alreadyVisited) numOpenSpaces++;
					break;
				case Direction.Up:
					nextPosition = {row: curPosition.row - 1, col: curPosition.col};
					if (nextPosition.row < 1) continue;
					alreadyVisited = map[nextPosition.row][nextPosition.col].type === TileType.Blank;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = this.makeTile(TileType.Blank, nextPosition, true);
					if (!alreadyVisited) numOpenSpaces++;
					break;
				case Direction.Right:
					nextPosition = {row: curPosition.row, col: curPosition.col + 1};
					if (nextPosition.col > mapSize.cols - 2) continue;
					alreadyVisited = map[nextPosition.row][nextPosition.col].type === TileType.Blank;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = this.makeTile(TileType.Blank, nextPosition, true);
					if (!alreadyVisited) numOpenSpaces++;
					break;
				case Direction.Down:
					nextPosition = {row: curPosition.row + 1, col: curPosition.col};
					if (nextPosition.row > mapSize.rows - 2) continue;
					alreadyVisited = map[nextPosition.row][nextPosition.col].type === TileType.Blank;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = this.makeTile(TileType.Blank, nextPosition, true);
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
				explored: false,
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
				explored: false,
				health: [1000, 1000],
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
				explored: false,
				health: [_.random(10, 30)]
			};
			this.gameState.levelMap[randomPosition.row][randomPosition.col] = healthState;
			numHealth++;
		}
		if (this.gameState.playerState.weapon < Weapons.length-1 && level > 1) {
			let randomWeapon = this.randomPosition(mapSize);
			this.gameState.levelMap[randomWeapon.row][randomWeapon.col] = this.makeTile(TileType.Weapon, randomWeapon, true);
		}
		if (this.gameState.playerState.armor < Armors.length-1 && level > 1) {
			let randomArmor = this.randomPosition(mapSize);
			this.gameState.levelMap[randomArmor.row][randomArmor.col] = this.makeTile(TileType.Armor, randomArmor, true);
		}
		if (this.gameState.currentLevel < 7) {
			let randomExit = this.randomPosition(mapSize, true);
			this.gameState.levelMap[randomExit.row][randomExit.col] = this.makeTile(TileType.Exit, randomExit, true);
		}
	}
	
	randomPosition(mapSize: {rows: number, cols: number}, padding?): MapCoords {
		let randomPos: MapCoords;
		let validPosition = false;
		while (!validPosition) {
			randomPos = {
				row: _.random(0, mapSize.rows-1),
				col: _.random(0, mapSize.cols-1)
			};
			if (this.gameState.levelMap[randomPos.row][randomPos.col].type != TileType.Blank) continue;
			if (padding) {
				let hasEmptySpace = false;
				for (let row = randomPos.row-1; row <= randomPos.row+1; row++) {
					for (let col = randomPos.col-1; col <= randomPos.col+1; col++) {
						if (this.gameState.levelMap[randomPos.row][randomPos.col].type === TileType.Blank) {
							hasEmptySpace = true;
						}
					}
				}
				if (!hasEmptySpace) continue;
			}
			validPosition = true;
		}
		return randomPos;
	}
	
	placePlayerRandomly() {
		let gameState: GameState = this.gameState;
		let mapSize = {rows: gameState.levelMap.length, cols: gameState.levelMap[0].length};
		let randomPosition: MapCoords = this.randomPosition(mapSize);
		this.gameState.playerPos = randomPosition;
		this.gameState.levelMap[randomPosition.row][randomPosition.col] = this.gameState.playerState;
		this.adjustViewport(randomPosition);
		this.adjustVisibility();
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
				if (this.gameState.playerState.weapon < Weapons.length-1) {
					this.gameState.playerState.weapon += 1;
					this.calcAttack();
				}
				this.movePlayer(playerNextPos);
				break;
			case TileType.Armor:
				if (this.gameState.playerState.armor < Armors.length-1) {
					this.gameState.playerState.armor += 1;
				}
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
		this.gameState.levelMap[curState.row][curState.col] = this.makeTile(TileType.Blank, curState);
		this.gameState.playerPos = nextState;
		this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = this.gameState.playerState;
		this.adjustViewport(nextState);
		this.adjustVisibility()
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
			this.enemyDeath(enemyState, enemyPos);
		} else {
			this.refreshState();
		}
	}
	
	enemyDeath(enemyState: TileState, enemyPos: MapCoords) {
		let exp = enemyState.level * 10;
		this.gameState.playerState.exp[0] += exp;
		if (this.gameState.playerState.exp[0] >= this.gameState.playerState.exp[1]) this.levelUp();
		
		let epicLootChance = enemyState.level / 100;
		let whichArmor = this.gameState.playerState.armor;
		let whichWeap = this.gameState.playerState.weapon;
		if (whichArmor < Armors.length-1 || whichWeap < Weapons.length-1) {
			let dropLoot = _.random(1, Math.floor(1/epicLootChance)) === 1;
			console.log('loot chance: ', epicLootChance);
			if (dropLoot) {
				if (whichWeap < whichArmor) {
					this.gameState.levelMap[enemyPos.row][enemyPos.col] = this.makeTile(TileType.Weapon, enemyPos)
				} else this.gameState.levelMap[enemyPos.row][enemyPos.col] = this.makeTile(TileType.Armor, enemyPos);
			} else this.gameState.levelMap[enemyPos.row][enemyPos.col] = this.makeTile(TileType.Blank, enemyPos);
		} else {
			this.gameState.levelMap[enemyPos.row][enemyPos.col] = this.makeTile(TileType.Blank, enemyPos);
			this.refreshState();
		}
		if (enemyState.type === TileType.Boss) {
			this.gameState.gameOver = 'win';
		}
		this.refreshState();
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
	
	makeTile(type: TileType, pos: MapCoords, invisible?: boolean): TileState {
		let tile: TileState;
		if (invisible) {
			tile = {
				type: type,
				explored: false
			}
		} else {
			tile = {
				type: type,
				explored: this.isVisible(pos)
			}
		}
		return tile;
	}
	
	isVisible(pos: MapCoords) {
		let lineOfSite: MapCoords[] = [];
		let playerPos = this.gameState.playerPos;
		let map = this.gameState.levelMap;
		let isVisible = false;
		let cornerTiles: MapCoords[] = [
			{row: playerPos.row-3, col: playerPos.col-3},
			{row: playerPos.row-3, col: playerPos.col+3},
			{row: playerPos.row+3, col: playerPos.col-3},
			{row: playerPos.row+3, col: playerPos.col+3}
		];
		for (let row = playerPos.row-3; row < playerPos.row+4; row++) {
			for (let col = playerPos.col-3; col < playerPos.col+4; col++) {
				if (row > 0 && row < map.length
					&& col > 0 && col < map[0].length) {
						let checkTile: MapCoords = {row: row, col: col};
						let isCorner = false;
						cornerTiles.forEach(corner => {
							if (_.isEqual(checkTile, corner)) isCorner = true;
						});
						if (!isCorner) {
							if (_.isEqual(checkTile, pos)) return true;
						}
					}
			}
		}
		return false;
	}
	
	adjustVisibility() {
		let lineOfSite: MapCoords[] = [];
		let playerPos = this.gameState.playerPos;
		let map = this.gameState.levelMap;
		let isVisible = false;
		let cornerTiles: MapCoords[] = [
			{row: playerPos.row-3, col: playerPos.col-3},
			{row: playerPos.row-3, col: playerPos.col+3},
			{row: playerPos.row+3, col: playerPos.col-3},
			{row: playerPos.row+3, col: playerPos.col+3}
		];
		// Set all tiles within a 3 box radius minus corners to visible and explored
		for (let row = playerPos.row-3; row < playerPos.row+4; row++) {
			for (let col = playerPos.col-3; col < playerPos.col+4; col++) {
				if (row >= 0 && row < map.length
					&& col >= 0 && col < map[0].length) {
						let checkTile: MapCoords = {row: row, col: col};
						let isCorner = false;
						cornerTiles.forEach(corner => {
							if (_.isEqual(checkTile, corner)) isCorner = true;
						});
						if (!isCorner) {
							this.gameState.levelMap[checkTile.row][checkTile.col].explored = true;
							lineOfSite.push(checkTile);
						}
					}
			}
		}
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
		name: 'padded armor',
		defense: 3
	},
	{
		name: 'hide armor',
		defense: 4	
	},
	{
		name: 'chainmail',
		defense: 5
	},
	{
		name: 'scalemail',
		defense: 6
	},
	{
		name: 'platemail',
		defense: 7
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
	explored: boolean;
	health?: number[];
	level?: number;
	attack?: number[];
	weapon?: number;
	armor?: number;
	exp?: number[];
}

enum TileType {
	Blank,
	Wall,
	Player,
	Enemy,
	Boss,
	Health,
	Weapon,
	Armor,
	Exit
}

enum Direction {
	Left, Up, Right, Down
}

export default App;