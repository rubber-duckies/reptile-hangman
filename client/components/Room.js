import React from 'react';
import ServerAPI from '../models/ServerAPI';
import GameBoard from './GameBoard';
import Gallows from './Gallows.js';
import Outcome from './Outcome.js';
import Players from './Players';


export default class Room extends React.Component {

	constructor(props) {
		super(props);
		this.state = {	
	        word: [], // keep state immutable
    		guessedLetters: [],
    		remainingGuesses: 6,
    		isDone: false,
			players:[],
			coolDown:0,
			timeUntilNextGame: 0
		};
		this.playerId = ""
		this.outcome = {
			win: true,
			player: "",
		}

		// setup socket & initialize
		this.serverAPI = new ServerAPI(4000);
		this.serverAPI.connect();	
		this.serverAPI.onEnterRoom((res)=>{
			console.log("Enter Room", res);
			this.playerId = res.playerId;
			var playerList = res.players.slice();
			playerList.push(res.playerId);
			this.setState({
				'players' : playerList,
		        'word':  res.gameState.word,
	    		'guessedLetters': res.gameState.guessedLetters,
	    		'remainingGuesses': res.gameState.remainingGuesses,
	    		'isDone': res.gameState.isDone
			});
		})

		// Update players
		this.serverAPI.onPlayerEnterRoom((res)=>{
			console.log("Player enter room", res);
			var playerList = this.state.players;
			playerList.push(res.playerId);
			this.setState({
				players: playerList
			})
		});

		this.serverAPI.onPlayerLeaveRoom((res)=>{
			console.log("Player Leave room", res);
			var playerList = this.state.players;
			playerList.splice(playerList.indexOf(res.playerId), 1);
			this.setState({
				players: playerList
			})
		});

		// Game related events
		this.serverAPI.onStartGame( (res) => {
			console.log("Start game", res);
			this.setGameState(res);
		});

		this.serverAPI.onIncorrectGuess((res)=>{
			console.log("Incorrect Guess", res);
			if(res.playerId === this.playerId){
				this.setGameState(res.gameState, res.coolDown);
			} else{
				this.setGameState(res.gameState);
			}
		})

		this.serverAPI.onCorrectGuess((res)=>{
			console.log("Correct Guess", res, res.playerId, this.playerId);
			if(res.playerId === this.playerId){
				this.setGameState(res.gameState, res.coolDown);
			} else{
				this.setGameState(res.gameState );
			}
		})

		this.serverAPI.onWin((res)=>{
			console.log("win!", res)
			this.outcome.win = true;
			this.outcome.player = res.playerId;
			this.setEndGameState(res.gameState, res.timeUntilNextGame)
		})

		this.serverAPI.onLose((res)=>{
			console.log("lose!", res)
			this.outcome.win = false;
			this.outcome.player = res.playerId;
			this.setEndGameState(res.gameState, res.timeUntilNextGame)

		})
	}

	setGameState(gameState, coolDown){
		console.log("setting game state: ", gameState, coolDown)
		if(coolDown > 0){
			console.log("updating with coolDown")
			this.setState({
		        'word':  gameState.word, // keep state immutable
	    		'guessedLetters': gameState.guessedLetters,
	    		'remainingGuesses': gameState.remainingGuesses,
	    		'isDone': gameState.isDone,
	    		'coolDown': coolDown
			})
		} else {
			console.log("updating without coolDown")
			this.setState({
		        'word':  gameState.word, // keep state immutable
	    		'guessedLetters': gameState.guessedLetters,
	    		'remainingGuesses': gameState.remainingGuesses,
	    		'isDone': gameState.isDone
			})		
		}
	}

	setEndGameState(gameState, timeUntilNextGame){
		console.log("setting game state: ", gameState, timeUntilNextGame)
			this.setState({
		        'word':  gameState.word, // keep state immutable
	    		'guessedLetters': gameState.guessedLetters,
	    		'remainingGuesses': gameState.remainingGuesses,
	    		'isDone': gameState.isDone,
	    		'timeUntilNextGame': timeUntilNextGame
			})		
		
	}

	render() {
		var guessedLettersUpper = this.state.guessedLetters.map((letter)=>{return letter.toUpperCase()});
		return(
			<div className="room">
				<Outcome 
					show={this.state.isDone} 
					outcome={this.outcome}
					timeUntilNextGame = {this.state.timeUntilNextGame}/>

				<nav className="navbar navbar-default navbar-static-top">
				  <div className="container navcon">
				    <h1 className="game-title">HANGMAN</h1>
				  </div>
				</nav>

				<div className="container">
					<div className="row">
						<div className="col-xs-2" id="player-col">
							<Players players={this.state.players}/>
						</div>	
						<div className="col-xs-8" id="board-col">
							<GameBoard 
								word={this.state.word} 
								guessedLetters={guessedLettersUpper} 
								remainingGuesses={this.state.remainingGuesses} 
								serverAPI = {this.serverAPI}
								coolDown = {this.state.coolDown}
								/>
						</div>
						<div className="col-xs-2" id="gallows-col">
							<Gallows remainingGuesses={this.state.remainingGuesses} />
						</div>
					</div>
				</div>
			</div>
		)
	}

}
