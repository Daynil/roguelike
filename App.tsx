import * as React from 'react';
import * as _ from 'lodash';

class App extends React.Component<any, any> {
	
	game: Game;
	
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
		document.body.onkeypress = null;
	}
	
	refreshState() {
		this.setState({gameState: this.state.gameState});
	}
	
	handleKeyDown(e: KeyboardEvent) {
		let key = e.keyCode;
		console.log(this);
		switch (key) {
			case 37:
				this.game.movePlayer('left');
				break;
			case 38:
				this.game.movePlayer('up');
				break;
			case 39:
				this.game.movePlayer('right');
				break;
			case 40:
				this.game.movePlayer('down');
				break;
			default:
				break;
		}
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
			default:
				break;
		}
		
		return <div className={tileSprite} key={tileCoords.col} />
	}
	
	generateMap(level: number) {
		// Hold all data in react element vs parallel 2d grid? 
		let map = [];
		for (let row = 0; row < 100; row++) {
			let genRow = [];
			for (let col = 0; col < 100; col++) {
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
	camOffsetVertBlocks = 6;
	camOffsetHorizBlocks = 9;
	blockSizePx = 34;
	
	gameState = {
		playerPos: {row: 0, col: 0},
		cameraOffset: {
			top: -(this.camOffsetVertBlocks*this.blockSizePx), 
			left: -(this.camOffsetHorizBlocks*this.blockSizePx)
		},
		levelMap: []
	}
	
	constructor(refreshState: ()=>void) {
		this.refreshState = refreshState;
		this.generateMap(1);
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
		for (let row = 0; row < 100; row++) {
			let nextRow = []
			for (let col = 0; col < 100; col++) {
				let tile: TileState;
				let curCoords: MapCoords = {row: row, col: col};
				if ( _.isEqual(curCoords, this.gameState.playerPos) ) tile = {type: TileType.Player};
				else tile = {type: TileType.Blank};
				nextRow.push(tile);
			}
			map.push(nextRow);
		}
		this.gameState.levelMap = map;
	}
	
	movePlayer(direction: string) {
		let playerState: TileState = _.create(this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col]);
		let blankState: TileState = {type: TileType.Blank};
		// Middle = 9 left/right, 6 up/down
		switch (direction) {
			case 'left':
				if (this.gameState.playerPos.col === 0) break;
				else {
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = blankState;
					this.gameState.playerPos = {row: this.gameState.playerPos.row, col: this.gameState.playerPos.col - 1};
					this.gameState.levelMap[this.gameState.playerPos.row][this.gameState.playerPos.col] = playerState;
					if (this.gameState.playerPos.col < this.gameState.levelMap[0].length-1 - this.camOffsetHorizBlocks) {
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
					if (this.gameState.playerPos.row < this.gameState.levelMap.length-1 - this.camOffsetVertBlocks) {
						this.gameState.cameraOffset.top -= this.blockSizePx;
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
					if (this.gameState.playerPos.col > this.camOffsetHorizBlocks) {
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
					if (this.gameState.playerPos.row > this.camOffsetVertBlocks) {
						this.gameState.cameraOffset.top += this.blockSizePx;
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
	cameraOffset: {top: number; left: number};
	levelMap: TileState[][];
}

interface TileState {
	type: TileType;
}

enum TileType {
	Blank,
	Player,
	Enemy,
	Item
}

export default App;