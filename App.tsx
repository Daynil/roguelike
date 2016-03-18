import * as React from 'react';
import * as _ from 'lodash';

class App extends React.Component<any, any> {
	
	game: Game;
	isKeyDown = false;
	
	constructor() {
		super();
		this.game = new Game(this.refreshState.bind(this));
		this.state = {
			gameState: this.game.gameState
		}
	}
	
	componentDidMount() {
		document.body.onkeydown = this.handleKeyDown.bind(this);
		document.body.onkeyup = this.handleKeyUp.bind(this);
	}
	
	componentWillUnmount() {
		document.body.onkeydown = null;
		document.body.onkeyup = null;
	}
	
	refreshState() {
		this.setState({gameState: this.state.gameState});
	}
	
	handleKeyDown(e: KeyboardEvent) {
		let key = e.keyCode;
		switch (key) {
			case 37:
				if (!this.isKeyDown) {
					this.isKeyDown = true;
					this.game.movePlayer('left');
				}
				break;
			case 38:
				if (!this.isKeyDown) {
					this.isKeyDown = true;
					this.game.movePlayer('up');
				}
				break;
			case 39:
				if (!this.isKeyDown) {
					this.isKeyDown = true;
					this.game.movePlayer('right');
				}
				break;
			case 40:
				if (!this.isKeyDown) {
					this.isKeyDown = true;
					this.game.movePlayer('down');
				}
				break;
			default:
				break;
		}
	}
	
	handleKeyUp(e: KeyboardEvent) {
		if (this.isKeyDown) this.isKeyDown = false;
	}
	
	render() {
		return (
			<div id="page-wrapper">
				<h1>React Roguelike</h1>
				<GameComp
					gameState={this.state.gameState} />
			</div>
		)
	}
}

class GameComp extends React.Component<any, any> {
	gameState: GameState;
	
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
			default:
				break;
		}
		
		return <div className={tileSprite} key={tileCoords.col} />
	}
	
	generateMap(level: number) {
		// Hold all data in react element vs parallel 2d grid? 
		let map = [];
		for (let row = 0; row < this.gameState.levelMap.length; row++) {
			let genRow = [];
			for (let col = 0; col < this.gameState.levelMap[0].length; col++) {
				genRow.push(this.generateTile({row: row, col: col}));
			}
			map.push(<div key={row}>{genRow}</div>);
		}
		return <div id="map" style={this.getCameraOffset()}>{map}</div>;
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
	
	gameState = {
		playerPos: {row: 3, col: 3},
		cameraOffset: {
			top: -(this.camOffsetVertBlocks*this.blockSizePx), 
			left: -(this.camOffsetHorizBlocks*this.blockSizePx)
		},
		levelMap: []
	}
	
	constructor(refreshState: ()=>void) {
		this.refreshState = refreshState;
		this.generateRandomMap();
		this.rightLimit = this.gameState.levelMap[0].length - 1 - this.camOffsetHorizBlocks;
		this.bottomLimit = this.gameState.levelMap.length - 1 - this.camOffsetVertBlocks;
	}
	
	generateMap(level: number) {
		/*	Level is a 2d array, selection is map[rowNum][colNum]
			Each tile is an object specifying contents and state
			[
				[{contents: player}, {contents: blank}, ...],	<-- row 0
				[{contents: enemy}, {contents: weapon}, ...],	<-- row 1
				...
			]
		*/
		let map = [];
		for (let row = 0; row < 25; row++) {
			let nextRow = []
			for (let col = 0; col < 25; col++) {
				let tile: TileState;
				let curCoords: MapCoords = {row: row, col: col};
				let rollWall = false;
				if (_.random(1, 4) === 1) rollWall = true; 
				if ( _.isEqual(curCoords, this.gameState.playerPos) ) tile = {type: TileType.Player};
				else if (rollWall) tile = {type: TileType.Wall};
				else tile = {type: TileType.Blank};
				nextRow.push(tile);
			}
			map.push(nextRow);
		}
		this.gameState.levelMap = map;
	}
	
	// Random Walk Generation Algorithm
	generateRandomMap() {
		let mapSize = {rows: 25, cols: 25};
		let dungeonSize = 0.7; // Percent of dungeon to be open space
		let desiredOpenSpaces = Math.floor( (mapSize.rows * mapSize.cols) * 0.7 );
		console.log(desiredOpenSpaces);
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
		let visitedPositions: MapCoords[] = [curPosition];
		while (numOpenSpaces < desiredOpenSpaces) {
			let randomStep = _.random(0, 3);
			let nextPosition: MapCoords;
			switch (randomStep) {
				case Direction.Left:
					nextPosition = {row: curPosition.row, col: curPosition.col - 1};
					//if (_.some(visitedPositions, nextPosition)) continue;
					if (nextPosition.col < 0) continue;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					visitedPositions.push(nextPosition);
					numOpenSpaces++;
					break;
				case Direction.Up:
					nextPosition = {row: curPosition.row - 1, col: curPosition.col};
					//if (_.some(visitedPositions, nextPosition)) continue;
					if (nextPosition.row < 0) continue;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					visitedPositions.push(nextPosition);
					numOpenSpaces++;
					break;
				case Direction.Right:
					nextPosition = {row: curPosition.row, col: curPosition.col + 1};
					//if (_.some(visitedPositions, nextPosition)) continue;
					if (nextPosition.col > mapSize.cols - 1) continue;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					visitedPositions.push(nextPosition);
					numOpenSpaces++;
					break;
				case Direction.Down:
					nextPosition = {row: curPosition.row + 1, col: curPosition.col};
					//if (_.some(visitedPositions, nextPosition)) continue;
					if (nextPosition.row > mapSize.rows - 1) continue;
					curPosition = nextPosition;
					map[curPosition.row][curPosition.col] = {type: TileType.Blank};
					visitedPositions.push(nextPosition);
					numOpenSpaces++;
					break;
				default:
					break;
			}
		}
		this.gameState.levelMap = map;
		this.placePlayerRandomly();
		//this.placePlayerTopLeft();
	}
	
	placePlayerTopLeft() {
		// Find first open space in top left edge and place player
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
		let camOffset: CameraOffset = {
			top: this.gameState.cameraOffset.top, 
			left: this.gameState.cameraOffset.left
		};
		if (randomPosition.col > this.leftLimit
			&& randomPosition.col <= this.rightLimit) {
			camOffset.left -= (randomPosition.col - this.leftLimit) * this.blockSizePx;
		} 
		if (randomPosition.row > this.topLimit 
			&& randomPosition.row <= this.bottomLimit) {
			camOffset.top -= (randomPosition.row - this.topLimit) * this.blockSizePx;
		} 
		if (randomPosition.col < this.rightLimit
			&& randomPosition.col >= this.leftLimit) {
			camOffset.left += (this.rightLimit - randomPosition.col) * this.blockSizePx;
		} 
		if (randomPosition.row < this.bottomLimit
			&& randomPosition.row >= this.topLimit) {
			camOffset.top += (this.bottomLimit - randomPosition.row) * this.blockSizePx;
		}
		this.gameState.playerPos = randomPosition;
		this.gameState.levelMap[randomPosition.row][randomPosition.col] = {type: TileType.Player};
		this.gameState.cameraOffset = camOffset;
		console.log(randomPosition, camOffset);
	}
	
	movePlayer(direction: string) {
		let playerState: TileState = _.clone(this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col]);
		let blankState: TileState = {type: TileType.Blank};
		// Middle = 9 left/right, 6 up/down
		switch (direction) {
			case 'left':
				if (this.gameState.playerPos.col === 0) break;
				else {
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = blankState;
					this.gameState.playerPos = {row: this.gameState.playerPos.row, col: this.gameState.playerPos.col - 1};
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = playerState;
					if (this.gameState.playerPos.col < this.rightLimit
							&& this.gameState.playerPos.col >= this.leftLimit) {
						this.gameState.cameraOffset.left += this.blockSizePx;
					}
					this.refreshState();
				}
				break;
			case 'up':
				if (this.gameState.playerPos.row === 0) break;
				else {
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = blankState;
					this.gameState.playerPos = {row: this.gameState.playerPos.row - 1, col: this.gameState.playerPos.col};
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = playerState;
					if (this.gameState.playerPos.row < this.bottomLimit 
							&& this.gameState.playerPos.row >= this.topLimit) {
						this.gameState.cameraOffset.top += this.blockSizePx;
					}
					this.refreshState();
				}
				break;
			case 'right':
				if (this.gameState.playerPos.col === this.gameState.levelMap[0].length-1) break;
				else {
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = blankState;
					this.gameState.playerPos = {row: this.gameState.playerPos.row, col: this.gameState.playerPos.col + 1};
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = playerState;
					if (this.gameState.playerPos.col > this.leftLimit
							&& this.gameState.playerPos.col <= this.rightLimit) {
						this.gameState.cameraOffset.left -= this.blockSizePx;
					}
					this.refreshState();
				}
				break;
			case 'down':
				if (this.gameState.playerPos.row === this.gameState.levelMap.length-1) break;
				else {
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = blankState;
					this.gameState.playerPos = {row: this.gameState.playerPos.row + 1, col: this.gameState.playerPos.col};
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = playerState;
					if (this.gameState.playerPos.row > this.topLimit
							&& this.gameState.playerPos.row <= this.bottomLimit) {
						this.gameState.cameraOffset.top -= this.blockSizePx;
					}
					this.refreshState();
				}
				break;
			default:
				break;
		}
	}
	
}

interface MapCoords {
	row: number;
	col: number;
}

interface GameState {
	playerPos: MapCoords;
	cameraOffset: CameraOffset;
	levelMap: TileState[][];
}

interface CameraOffset {
	top: number;
	left: number;
}

interface TileState {
	type: TileType;
}

enum TileType {
	Blank,
	Player,
	Enemy,
	Item,
	Wall
}

enum Direction {
	Left, Up, Right, Down
}

export default App;