const activeUserContainer = document.getElementById('active-user-container');
const talkingWithInfo = document.getElementById('talking-with-info');

let isAlreadyCalling = false;
let getCalled = false;

const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();

// Get username from URL
const { username } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Join
socket.emit('userJoin', { username });

// New user joins
socket.on('newUser', ({ username, id }) => {
  console.log('new user: ', username);
  outputUsers(username, id);
});

// Get joined users
socket.on('joinedUsers', (joinedUsers) => {
  console.log('joined users: ', joinedUsers);
  joinedUsers.forEach((user) => outputUsers(user.username, user.id));
});

// User leaves
socket.on('userLeave', (id) => {
  console.log('user left - id: ', id);
  const deleteUser = document.getElementById(id);
  activeUserContainer.removeChild(deleteUser);
});

// Call user
async function callUser(id) {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

  socket.emit('callUser', {
    offer,
    to: id,
  });
}

// Call from server
socket.on('callMade', async ({ offer, username, id }) => {
  if (getCalled) {
    const confirmed = confirm(
      `${username} wants to call you. Accept the call?`
    );

    if (!confirmed) {
      socket.emit('rejectCall', {
        from: id,
      });
    }

    return;
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

  socket.emit('makeAnswer', { answer, to: id });
  getCalled = true;
});

// Answer made
socket.on('answerMade', async ({ socket, answer }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  if (!isAlreadyCalling) {
    callUser(socket);
    isAlreadyCalling = true;
  }
});

// Call rejected
socket.on('callRejected', (username) => {
  alert(`${username} rejected your call`);
  unselectUsers();
});

// Output users to DOM
function outputUsers(username, id) {
  const userContainerEl = document.createElement('div');
  userContainerEl.classList.add('active-user');
  userContainerEl.setAttribute('id', id);
  userContainerEl.innerHTML = `<p class="username">${username}</p>`;
  activeUserContainer.appendChild(userContainerEl);

  // Listen for user selection and call user when a user is selected
  userContainerEl.addEventListener('click', () => {
    unselectUsers();
    userContainerEl.classList.add('active-user--selected');
    talkingWithInfo.innerText = `${username}`;
    callUser(id);
  });
}

// Unselect users
function unselectUsers() {
  const alreadySelectedUsers = [].slice.call(
    document.querySelectorAll('.active-user--selected')
  );

  alreadySelectedUsers.forEach((el) =>
    el.classList.remove('active-user--selected')
  );
}

// Stream remote video
peerConnection.ontrack = function ({ streams: [stream] }) {
  const remoteVideo = document.getElementById('remote-video');
  if (remoteVideo) {
    remoteVideo.srcObject = stream;
  }
};

const constraints = { audio: true, video: true };

// Camera and microphone access,
// and stream it to the local client browser
navigator.mediaDevices
  .getUserMedia(constraints)
  .then((stream) => {
    const video = document.getElementById('local-video');
    video.srcObject = stream;

    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));
  })
  .catch((error) => {
    console.warn(error.message);
  });
