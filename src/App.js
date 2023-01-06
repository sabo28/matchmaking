import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import openSocket from 'socket.io-client';

const socket = openSocket('http://localhost:3001');

function App() {
  const [user, setUser] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [lobbies, setLobbies] = useState([]);
  const [opponent, setOpponent] = useState('');

  // Benachrichtigungen empfangen
  useEffect(() => {
    socket.on('lobby-update', (lobby) => {
      console.log(lobby);
      if(lobby.user2){
        setOpponent(lobby.user2);
      }
    });
  }, []);

  // Funktion zum Erstellen einer Lobby
  const createLobby = async () => {
    if(user){    
      const response = await axios.post('http://localhost:3001/lobbies', { user });
      setLobbyId(response.data);
    }else {
      alert('Username is empty!');
    }    
  };

  // Funktion zum Suchen verfügbarer Lobbies
  const findLobbies = async () => {

    const response = await axios.get('http://localhost:3001/lobbies');
    setLobbies(response.data);
  };

  // Funktion zum Beitreten einer Lobby
  const joinLobby = async (lobby) => {
    if(user){
      await axios.put(`http://localhost:3001/lobbies/${lobby._id}`, { user });
      setLobbyId(lobby._id);
      setOpponent(lobby.user1);  
    }else {
      alert('Username is empty!');
    }  
  };

  return (
    <div className='App'>
      <div className='App-header'>
        <h1>Matchmaking</h1>
        <input
          type="text"
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        {!lobbyId ? (
          <>
            <button onClick={createLobby}>Create Lobby</button>
            <button onClick={findLobbies}>Find Lobbies</button>
            {lobbies.length > 0 && (
              <ul>
                {lobbies.map((lobby) => (
                  <div key={lobby._id}>
                    <button onClick={() => joinLobby(lobby)}>Join {lobby.user1}</button>
                  </div>
                ))}
              </ul>
            )}
          </>
        ) : (
          !opponent ? (
              <p>Waiting for opponent in lobby {lobbyId}</p>
            ) : (
              <p>Matched with {opponent}</p>  
            )
          
        )}
      </div>
    </div>
  );
}

export default App;
