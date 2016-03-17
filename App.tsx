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
		
	}
	
	generateMap(level: number) {
		let map = [];
		for (let row = 0; row < 100; row++) {
			let genRow = [];
			for (let col = 0; col < 100; col++) {
				genRow.push(<div className={this.generateTile(level)}></div>);
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

export default App;