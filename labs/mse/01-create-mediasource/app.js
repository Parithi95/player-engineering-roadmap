const video = document.getElementById("video");

const mediaSource = new MediaSource();

const objectURL = URL.createObjectURL(mediaSource);
video.src = objectURL;

mediaSource.addEventListener("sourceopen", () => {
  console.log(
    "Media source is opened and readyState is: ",
    mediaSource.readyState,
  );
  console.log("Media source is opened", video.src);
});

mediaSource.addEventListener("sourceclose", () => {
  console.log(
    "Media source is closed and readyState is: ",
    mediaSource.readyState,
  );
});

mediaSource.addEventListener("sourceended", () => {
  console.log(
    "Media source is ended and readyState is: ",
    mediaSource.readyState,
  );
});
