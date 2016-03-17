import * as React from 'react';

class App extends React.Component<any, any> {
	render() {
		return (
			<div id="page-wrapper">
				<h1>React Roguelike</h1>
				<Level />
			</div>
		)
	}
}

class Level extends React.Component<any, any> {
	
	generateTile(level: number) {
		return <Tile type={TileType.Blank} />
	}
	
	generateMap(level: number) {
		// Hold all data in react element vs parallel 2d grid? 
		let map = [];
		for (let row = 0; row < 100; row++) {
			let genRow = [];
			for (let col = 0; col < 100; col++) {
				genRow.push(this.generateTile(1));
			}
		}
	}
	
	render() {
		let div = <div className="boo"></div>
		console.log(div.props.className);
		return (
			<div>
			</div>
		);
	}
}

class Tile extends React.Component<any, any> {
	type: TileType;
	
	render() {
		return (
			<div>
			</div>
		);
	}
}

enum TileType {
	Player,
	Enemy,
	Item,
	Stairs,
	Health,
	Blank
}

export default App;