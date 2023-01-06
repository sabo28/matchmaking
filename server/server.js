const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const mongoose = require('mongoose');
const cors = require('cors');

mongoose.connect('mongodb://localhost:27017/mydatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Lobby = mongoose.model('Lobby', new mongoose.Schema({
  user1: {
    type: String,
    required: true
  },
  user2: {
    type: String,
    required: false
  }
}));

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT"]
  }
});

const connections = new Map();

io.on('connection', (socket) => {
  const id = Math.random().toString(36).substr(2);
  connections.set(id, socket);

  socket.on('disconnect', () => {
    connections.delete(id);
  });
});

const sendNotification = (lobby) => {
  if (lobby.user2) {
    connections.forEach((socket) => {
      socket.emit('lobby-update', lobby);
    });
  }
};

app.use(express.json());
app.use(cors());

app.post('/lobbies', async (req, res) => {
  const { user } = req.body;
  const lobby = new Lobby({ user1: user });
  await lobby.save();
  res.send(lobby._id);
});

app.get('/lobbies', async (req, res) => {
  const lobbies = await Lobby.find({ user2: { $exists: false } });
  res.send(lobbies);
});

app.put('/lobbies/:id', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lobby = await Lobby.findById(req.params.id);
    if (!lobby || lobby.user2) {
      throw new Error('Lobby not found or already full');
    }
    lobby.user2 = req.body.user;
    await lobby.save();
    await session.commitTransaction();
    sendNotification(lobby);
    res.send('Success');
  } catch (error) {
    await session.abortTransaction();
    res.status(400).send(error.message);
  }
});

server.listen(3001, () => {
  console.log('Listening on port 3001');
});

