import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
require('./styles');
var sprites: any = document.createElement('sprites');
sprites.src = require('./sprites.png');

ReactDOM.render(<App />, document.getElementById('app'));
