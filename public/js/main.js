// Get username and room from URL
const { username } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

// Connect
socket.emit('join', { username });

const constraints = { audio: true, video: true };

// Camera and microphone access,
// and stream it to the local client browser
navigator.mediaDevices
  .getUserMedia(constraints)
  .then((mediaStream) => {
    const video = document.getElementById('local-video');
    video.srcObject = mediaStream;
  })
  .catch((error) => {
    console.warn(error.message);
  });
