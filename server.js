const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const {
  userJoin,
  getJoinedUsers,
  getCurrentUser,
  userLeave,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Runs when client connects
io.on('connection', (socket) => {
  socket.on('userJoin', ({ username }) => {
    const user = userJoin(socket.id, username);
    const joinedUsers = getJoinedUsers(socket.id);

    socket.broadcast.emit('newUser', user);
    socket.emit('joinedUsers', joinedUsers);
  });

  socket.on('callUser', ({ offer, to }) => {
    const currentUser = getCurrentUser(socket.id);
    console.log('offer: ', offer);
    console.log('to: ', to);
    socket.to(to).emit('callMade', {
      offer: offer,
      username: currentUser.username,
      id: currentUser.id,
    });
  });

  socket.on('makeAnswer', ({ answer, to }) => {
    console.log('answer: ', answer);
    socket.to(to).emit('answerMade', {
      socket: socket.id,
      answer: answer,
    });
  });

  socket.on('rejectCall', ({ from }) => {
    const currentUser = getCurrentUser(socket.id);
    socket.to(from).emit('callRejected', currentUser.username);
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.emit('userLeave', user.id);
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
