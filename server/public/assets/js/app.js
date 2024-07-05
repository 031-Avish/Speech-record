//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);

function startRecording() {
  console.log("recordButton clicked");

  var constraints = { audio: true, video: false };

  recordButton.disabled = true;
  stopButton.disabled = false;
  pauseButton.disabled = false;

  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

    audioContext = new AudioContext();
    document.getElementById("formats").innerHTML =
      "Format: 1 channel pcm @ " + audioContext.sampleRate / 1000 + "kHz";

    gumStream = stream;
    input = audioContext.createMediaStreamSource(stream);

    rec = new Recorder(input, { numChannels: 1 });
    rec.record();

    console.log("Recording started");
  }).catch(function (err) {
    recordButton.disabled = false;
    stopButton.disabled = true;
    pauseButton.disabled = true;
  });
}

function pauseRecording() {
  console.log("pauseButton clicked rec.recording=", rec.recording);
  if (rec.recording) {
    rec.stop();
    pauseButton.innerHTML = "Resume";
  } else {
    rec.record();
    pauseButton.innerHTML = "Pause";
  }
}

function stopRecording() {
  console.log("stopButton clicked");

  stopButton.disabled = true;
  recordButton.disabled = false;
  pauseButton.disabled = true;

  pauseButton.innerHTML = "Pause";

  rec.stop();
  gumStream.getAudioTracks()[0].stop();

  rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
  var url = URL.createObjectURL(blob);
  var au = document.createElement("audio");
  var li = document.createElement("li");
  var link = document.createElement("a");

  var filename = new Date().toISOString();

  au.controls = true;
  au.src = url;

  link.href = url;
  link.download = filename + ".wav";
  link.innerHTML = "Save to disk";

  li.appendChild(au);
  li.appendChild(document.createTextNode(filename + ".wav "));
  li.appendChild(link);

  var upload = document.createElement("a");
  upload.href = "#";
  upload.innerHTML = "Upload";
  upload.addEventListener("click", function (event) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function (e) {
      if (this.readyState === 4) {
        if (xhr.status === 200) {
          alert("Upload successful!");
          location.reload();
        } else {
          alert("Upload failed: " + xhr.responseText);
        }
      }
    };
    var fd = new FormData();
    fd.append("audio_data", blob, filename + ".wav");
    xhr.open("POST", "/upload", true);
    xhr.send(fd);
  });
  li.appendChild(document.createTextNode(" "));
  li.appendChild(upload);

  recordingsList.appendChild(li);
}
